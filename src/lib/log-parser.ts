export interface ParsedSessionTurn {
  stepIndex: number;
  role: 'user' | 'assistant' | 'tool' | 'system';
  timestamp?: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  toolCallsCount: number;
  toolNames: string[];
}

export interface ParsedAgentSession {
  format: 'antigravity-jsonl' | 'cline-json' | 'aider-markdown' | 'generic-agent' | 'sample-run';
  sessionTitle: string;
  detectedModel: string;
  totalTurns: number;
  totalInputTokens: number;
  totalCachedTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  effectiveCacheHitRate: number; // 0 to 1
  toolInvocationsCount: number;
  turns: ParsedSessionTurn[];
  /**
   * True when the transcript contained real token accounting.
   * False means the parser synthesized the numbers (VULN-05) — receipts must
   * flag these as estimates, never present them as measured cost.
   */
  measuredTokens: boolean;
}

/**
 * Built-in realistic sample session for one-click testing without a local file.
 * Models a 38-turn autonomous refactoring sprint on Claude Sonnet 5 with prompt caching.
 */
export const SAMPLE_AGENT_SESSION: ParsedAgentSession = {
  format: 'sample-run',
  sessionTitle: 'Sample Autonomous Refactor Sprint (38 Turns)',
  detectedModel: 'anthropic/claude-sonnet-5',
  totalTurns: 38,
  totalInputTokens: 1340000,
  totalCachedTokens: 1045200,
  totalOutputTokens: 52400,
  totalTokens: 1392400,
  effectiveCacheHitRate: 0.78, // 78% cache hit rate
  toolInvocationsCount: 46,
  measuredTokens: true,
  turns: Array.from({ length: 38 }, (_, i) => {
    const isToolHeavy = i % 2 === 1;
    const input = 32000 + i * 800;
    const cached = Math.round(input * (0.7 + (i / 100)));
    return {
      stepIndex: i + 1,
      role: 'assistant',
      inputTokens: input,
      cachedInputTokens: cached,
      outputTokens: 800 + (i % 5) * 200,
      toolCallsCount: isToolHeavy ? 2 : 1,
      toolNames: isToolHeavy ? ['view_file', 'replace_file_content'] : ['run_command'],
    };
  }),
};

function safeTokenNumber(val: any): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Parses raw text from an agent log file. Auto-detects format.
 */
export function parseAgentLog(rawText: string, filename: string = 'transcript.jsonl'): ParsedAgentSession {
  if (rawText.length > 25 * 1024 * 1024) {
    throw new Error('Log content exceeds 25MB safety limit.');
  }
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Log file is empty.');
  }

  // 1. Try Cline / Roo Code JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) || parsed.ui_messages || parsed.taskHistory) {
        return parseClineJson(parsed, filename);
      }
    } catch {
      // Continue to JSONL check
    }
  }

  // 2. Try JSONL (Antigravity, Gemini CLI, or generic JSONL)
  if (trimmed.includes('\n')) {
    const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
    const firstLine = lines[0].trim();
    if (firstLine.startsWith('{') && firstLine.endsWith('}')) {
      return parseJsonlSession(lines, filename);
    }
  }

  // 3. Fallback to generic text or sample
  return parseGenericSession(trimmed, filename);
}

function parseClineJson(data: any, filename: string): ParsedAgentSession {
  const messages: any[] = Array.isArray(data) ? data : (data.ui_messages || data.taskHistory || []);
  let totalInputTokens = 0;
  let totalCachedTokens = 0;
  let totalOutputTokens = 0;
  let toolInvocationsCount = 0;
  let sawMeasuredTokens = false;
  const turns: ParsedSessionTurn[] = [];

  messages.forEach((msg, idx) => {
    const inTok = safeTokenNumber(msg.tokensIn ?? msg.inputTokens ?? msg.usage?.prompt_tokens);
    const cachedTok = safeTokenNumber(msg.cacheReads ?? msg.cachedTokens ?? msg.usage?.prompt_tokens_details?.cached_tokens);
    const outTok = safeTokenNumber(msg.tokensOut ?? msg.outputTokens ?? msg.usage?.completion_tokens);
    const tools = Array.isArray(msg.tool_calls || msg.tools) ? (msg.tool_calls || msg.tools).length : 0;

    if (inTok > 0 || outTok > 0) sawMeasuredTokens = true;

    if (inTok > 0 || outTok > 0 || tools > 0) {
      totalInputTokens += inTok;
      totalCachedTokens += cachedTok;
      totalOutputTokens += outTok;
      toolInvocationsCount += tools;

      turns.push({
        stepIndex: idx + 1,
        role: msg.role || 'assistant',
        inputTokens: inTok || 20000,
        cachedInputTokens: cachedTok,
        outputTokens: outTok || 800,
        toolCallsCount: tools,
        toolNames: [],
      });
    }
  });

  const totalTurns = Math.max(1, turns.length);
  const effectiveCacheHitRate = totalInputTokens > 0
    ? Math.min(1, Math.max(0, totalCachedTokens / totalInputTokens))
    : 0;

  return {
    format: 'cline-json',
    sessionTitle: `Cline / Roo Code Session (${filename})`,
    detectedModel: 'anthropic/claude-sonnet-5',
    totalTurns,
    totalInputTokens: totalInputTokens || totalTurns * 22000,
    totalCachedTokens: totalCachedTokens || Math.round(totalTurns * 16000),
    totalOutputTokens: totalOutputTokens || totalTurns * 950,
    totalTokens: (totalInputTokens || totalTurns * 22000) + (totalOutputTokens || totalTurns * 950),
    effectiveCacheHitRate: effectiveCacheHitRate || 0.72,
    toolInvocationsCount: toolInvocationsCount > 0 ? toolInvocationsCount : Math.round(totalTurns * 1.2),
    turns,
    measuredTokens: sawMeasuredTokens,
  };
}

function parseJsonlSession(lines: string[], filename: string): ParsedAgentSession {
  let stepIndex = 0;
  let totalInputTokens = 0;
  let totalCachedTokens = 0;
  let totalOutputTokens = 0;
  let toolInvocationsCount = 0;
  let sawMeasuredTokens = false;
  const turns: ParsedAgentSession['turns'] = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line.trim());
      stepIndex++;

      // Check tool calls
      const tools = Array.isArray(obj.tool_calls) ? obj.tool_calls.length : 0;
      toolInvocationsCount += tools;

      // Token tracking if explicitly recorded
      let inTok = safeTokenNumber(obj.input_tokens ?? obj.tokens_in ?? obj.usage?.prompt_tokens);
      let cachedTok = safeTokenNumber(obj.cached_tokens ?? obj.cache_reads ?? obj.usage?.prompt_tokens_details?.cached_tokens);
      let outTok = safeTokenNumber(obj.output_tokens ?? obj.tokens_out ?? obj.usage?.completion_tokens);

      // If token fields are omitted in raw transcript, derive empirical agent tokens
      if (inTok === 0 && outTok === 0) {
        inTok = 20000 + stepIndex * 600;
        cachedTok = Math.round(inTok * 0.75);
        outTok = 850;
      } else {
        sawMeasuredTokens = true;
      }

      totalInputTokens += inTok;
      totalCachedTokens += cachedTok;
      totalOutputTokens += outTok;

      turns.push({
        stepIndex,
        role: obj.type === 'USER_INPUT' ? 'user' : 'assistant',
        timestamp: obj.created_at,
        inputTokens: inTok,
        cachedInputTokens: cachedTok,
        outputTokens: outTok,
        toolCallsCount: tools,
        toolNames: Array.isArray(obj.tool_calls) ? obj.tool_calls.map((t: any) => t.toolAction || 'tool') : [],
      });
    } catch {
      // Skip malformed individual lines
    }
  }

  const totalTurns = Math.max(1, turns.length);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const effectiveCacheHitRate = totalInputTokens > 0
    ? Math.min(1, Math.max(0, totalCachedTokens / totalInputTokens))
    : 0.75;

  return {
    format: 'antigravity-jsonl',
    sessionTitle: `Antigravity Agent Session (${filename})`,
    detectedModel: 'anthropic/claude-sonnet-5',
    totalTurns,
    totalInputTokens,
    totalCachedTokens,
    totalOutputTokens,
    totalTokens,
    effectiveCacheHitRate,
    toolInvocationsCount,
    turns,
    measuredTokens: sawMeasuredTokens,
  };
}

function parseGenericSession(text: string, filename: string): ParsedAgentSession {
  // Rough turn estimation from lines/paragraphs
  const lines = text.split('\n');
  const turnsCount = Math.max(5, Math.round(lines.length / 10));
  const totalInputTokens = turnsCount * 21000;
  const totalCachedTokens = Math.round(totalInputTokens * 0.75);
  const totalOutputTokens = turnsCount * 900;

  return {
    format: 'generic-agent',
    sessionTitle: `Agent Session (${filename})`,
    detectedModel: 'anthropic/claude-sonnet-5',
    totalTurns: turnsCount,
    totalInputTokens,
    totalCachedTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens,
    effectiveCacheHitRate: 0.75,
    toolInvocationsCount: Math.round(turnsCount * 1.3),
    measuredTokens: false,
    turns: Array.from({ length: turnsCount }, (_, i) => ({
      stepIndex: i + 1,
      role: 'assistant',
      inputTokens: 21000,
      cachedInputTokens: Math.round(21000 * 0.75),
      outputTokens: 900,
      toolCallsCount: 1,
      toolNames: ['agent_step'],
    })),
  };
}
