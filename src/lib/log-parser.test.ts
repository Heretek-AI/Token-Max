import { describe, it, expect } from 'vitest';
import { parseAgentLog, SAMPLE_AGENT_SESSION } from './log-parser';
import { calculateSessionReceipt } from './receipt-math';
import type { NormalizedModel } from './types';

describe('Agent Log Parser & Session Receipt Engine', () => {
  const dummyModels: NormalizedModel[] = [
    {
      id: 'anthropic/claude-sonnet-5',
      name: 'Claude Sonnet 5',
      provider: 'anthropic',
      modality: 'text->text',
      contextWindow: 200000,
      maxOutput: 8192,
      pricing: {
        input: 3.0,
        output: 15.0,
        cachedInput: 0.3,
        cachedInputWrite: 3.75,
        reasoning: null,
        webSearch: null,
      },
      blendedCost: 6.0,
      agentBlendedCost: 1.5,
      costPer1kRequests: 30.0,
      benchmarks: { intelligenceIndex: 88, codingIndex: 85, agenticIndex: 84, valueScore: 78 },
      reasoning: null,
      isFree: false,
      isBatch: false,
    },
    {
      id: 'deepseek/deepseek-v4.1-flash',
      name: 'DeepSeek V4.1 Flash',
      provider: 'deepseek',
      modality: 'text->text',
      contextWindow: 1000000,
      maxOutput: 384000,
      pricing: {
        input: 0.30,
        output: 1.20,
        cachedInput: 0.003,
        cachedInputWrite: null,
        reasoning: null,
        webSearch: null,
      },
      blendedCost: 0.52,
      agentBlendedCost: 0.18,
      costPer1kRequests: 3.6,
      benchmarks: { intelligenceIndex: 78, codingIndex: 75, agenticIndex: 76, valueScore: 95 },
      reasoning: null,
      isFree: false,
      isBatch: false,
    },
  ];

  it('validates pre-configured sample agent session', () => {
    expect(SAMPLE_AGENT_SESSION.totalTurns).toBe(38);
    expect(SAMPLE_AGENT_SESSION.totalInputTokens).toBeGreaterThan(1000000);
    expect(SAMPLE_AGENT_SESSION.effectiveCacheHitRate).toBeGreaterThan(0.7);
    expect(SAMPLE_AGENT_SESSION.toolInvocationsCount).toBeGreaterThan(30);
  });

  it('parses Antigravity / Gemini CLI JSONL transcripts', () => {
    const jsonlContent = [
      JSON.stringify({ step_index: 1, type: 'USER_INPUT', content: 'Refactor auth service' }),
      JSON.stringify({
        step_index: 2,
        type: 'PLANNER_RESPONSE',
        content: 'Analyzing files...',
        tool_calls: [{ toolAction: 'view_file' }],
      }),
      JSON.stringify({
        step_index: 3,
        type: 'PLANNER_RESPONSE',
        content: 'Editing code...',
        tool_calls: [{ toolAction: 'replace_file_content' }],
      }),
    ].join('\n');

    const session = parseAgentLog(jsonlContent, 'transcript.jsonl');
    expect(session.format).toBe('antigravity-jsonl');
    expect(session.totalTurns).toBe(3);
    expect(session.toolInvocationsCount).toBe(2);
    expect(session.totalInputTokens).toBeGreaterThan(0);
  });

  it('parses Cline / Roo Code task history JSON', () => {
    const clineJson = JSON.stringify({
      ui_messages: [
        { role: 'user', content: 'Add tests', tokensIn: 15000, cacheReads: 10000, tokensOut: 500 },
        { role: 'assistant', content: 'Writing test suite', tokensIn: 25000, cacheReads: 20000, tokensOut: 1200, tool_calls: [{}] },
      ],
    });

    const session = parseAgentLog(clineJson, 'ui_messages.json');
    expect(session.format).toBe('cline-json');
    expect(session.totalTurns).toBe(2);
    expect(session.totalInputTokens).toBe(40000);
    expect(session.totalCachedTokens).toBe(30000);
    expect(session.effectiveCacheHitRate).toBe(0.75);
    expect(session.toolInvocationsCount).toBe(1);
  });

  it('throws error when parsing empty string', () => {
    expect(() => parseAgentLog('', 'empty.txt')).toThrow('Log file is empty.');
  });

  it('calculates itemized session receipt and cross-model repricing', () => {
    const receipt = calculateSessionReceipt(SAMPLE_AGENT_SESSION, dummyModels);

    expect(receipt.baselineTotalCost).toBeGreaterThan(0);
    expect(receipt.lineItems.length).toBe(3);
    expect(receipt.modelRepricings.length).toBeGreaterThanOrEqual(2);

    // DeepSeek Flash should be vastly cheaper than Claude Sonnet
    const flashRepricing = receipt.modelRepricings.find((m) => m.modelId.includes('flash'));
    expect(flashRepricing).toBeDefined();
    expect(flashRepricing!.sessionCost).toBeLessThan(receipt.baselineTotalCost * 0.2);
    expect(flashRepricing!.savingsPercentVsBaseline).toBeGreaterThan(80);

    // Subscription impacts
    const cursor = receipt.subscriptionImpacts.find((s) => s.planId === 'cursor-pro');
    expect(cursor).toBeDefined();
    expect(cursor!.quotaConsumedPercentage).toBeCloseTo(7.6, 1); // 38/500 = 7.6%
  });
});
