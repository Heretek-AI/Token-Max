import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CodingPlan, NormalizedModel, CacheRate, WorkloadItem } from '../../lib/types';
import { getEffectiveCacheMultiplier, calculatePoolDrain, resolveTierModelBudget, QUALITY } from '../../lib/pricing';
import { DEFAULT_CACHE_RATE } from '../../lib/estimate-constants';
import {
  Workflow,
  Sparkles,
  Rocket,
  Coins,
  TrendingDown,
  TrendingUp,
  Info,
  XCircle,
  Clock,
  Layers,
  Gauge,
  Share2,
  Check,
} from 'lucide-react';

const WORKDAYS_PER_MONTH = 22;
const CONTEXT_OPTIONS = [
  { key: 'small', label: 'Small', tokens: 10_000, hint: 'Fine-grained edits, single files' },
  { key: 'medium', label: 'Medium', tokens: 40_000, hint: 'Typical agent session, multi-file context' },
  { key: 'large', label: 'Large', tokens: 100_000, hint: 'Whole-repo agent runs, deep refactors' },
] as const;
type ContextKey = (typeof CONTEXT_OPTIONS)[number]['key'];

const AGENT_REQUESTS_PER_TASK = 40;
const CHAT_INPUT_TOKENS = 10_000;
const COMPLETION_INPUT_TOKENS = 500;
const COMPLETION_OUTPUT_TOKENS = 100;
const TURNS_PER_HOUR = 30;
const MCP_TOOL_TOKENS_PER_TURN = 1000;
const SESSION_OUTPUT_TOKENS_PER_TURN = 1000;

type InputMode = 'daily' | 'session';
type EstimateBasis = 'conservative' | 'midpoint' | 'optimistic';
type McpStackKey = 'none' | 'light' | 'full';
const MCP_STACK_LEVEL: Record<McpStackKey, number> = { none: 0, light: 1, full: 2 };

const MCP_STACK_OPTIONS = [
  { key: 'none' as McpStackKey, label: 'None', hint: 'No MCP tools connected' },
  { key: 'light' as McpStackKey, label: 'Light', hint: '~1 MCP tools: ~1K tool-output tokens/turn re-read into later context' },
  { key: 'full' as McpStackKey, label: 'Full', hint: 'Full MCP stack: ~2K tool-output tokens/turn re-read into later context' },
];

const QUALITY_PRESETS = [
  { key: 'any', label: `Any ≥${QUALITY.economy} CI`, min: QUALITY.economy, hint: 'Open to capable economy/flash models (DeepSeek-class and up)' },
  { key: 'balanced', label: `Balanced ≥${QUALITY.workhorse} CI`, min: QUALITY.workhorse, hint: 'Production-grade workhorses' },
  { key: 'frontier', label: `Frontier ≥${QUALITY.frontier} CI`, min: QUALITY.frontier, hint: 'Only the best coding models (Claude Opus-class and up)' },
] as const;
type QualityKey = (typeof QUALITY_PRESETS)[number]['key'];

const ESTIMATE_BASES = [
  { key: 'conservative' as const, label: 'Conservative', hint: 'Capacity floor audited from provider quotas' },
  { key: 'midpoint' as const, label: 'Midpoint', hint: 'Middle of the documented capacity range' },
  { key: 'optimistic' as const, label: 'Optimistic', hint: 'Capacity ceiling of the documented range' },
];

const SESSION_PRESETS = [
  { label: 'MCP Marathon (5h · 750K · full stack)', hours: 5, perDay: 1, peak: 750, mcp: 'full' as McpStackKey },
  { label: 'Daily Driver (2h · 200K · light)', hours: 2, perDay: 2, peak: 200, mcp: 'light' as McpStackKey },
  { label: 'Overnight Batch (8h · 1M · full stack)', hours: 8, perDay: 1, peak: 1000, mcp: 'full' as McpStackKey },
];

interface WorkflowCalculatorProps {
  models: NormalizedModel[];
  plans: CodingPlan[];
}

function requestCost(
  model: NormalizedModel,
  inputTokens: number,
  outputTokens: number,
  cacheRate: CacheRate
): number {
  const inPrice = model.pricing.input ?? model.blendedCost * 0.75;
  const outPrice = model.pricing.output ?? model.blendedCost * 1.75;
  const cacheMult = getEffectiveCacheMultiplier(model);
  const freshInput = inputTokens * (1 - cacheRate);
  const cachedInput = inputTokens * cacheRate;
  return (
    (freshInput * inPrice) / 1e6 +
    (cachedInput * inPrice * cacheMult) / 1e6 +
    (outputTokens * outPrice) / 1e6
  );
}

function sessionCost(
  model: NormalizedModel,
  sessionInputSum: number,
  finalContextTokens: number,
  outputTokens: number,
  cacheRate: CacheRate
): number {
  const inPrice = model.pricing.input ?? model.blendedCost * 0.75;
  const outPrice = model.pricing.output ?? model.blendedCost * 1.75;
  const cacheMult = getEffectiveCacheMultiplier(model);

  if (cacheRate === 0) {
    return (sessionInputSum * inPrice) / 1e6 + (outputTokens * outPrice) / 1e6;
  }

  // Realistic prefix caching across multi-turn sessions:
  // Unique tokens generated/written across the session are bounded by finalContextTokens.
  // Subsequent turns read previously written context from cache.
  // Residual cache-busts / invalidations scale with (1 - cacheRate).
  const baseFresh = Math.min(sessionInputSum, finalContextTokens);
  const reReadTokens = Math.max(0, sessionInputSum - baseFresh);
  const uncachedOverhead = Math.max(0, 1 - cacheRate);
  const freshInput = baseFresh + reReadTokens * uncachedOverhead * 0.15;
  const cachedInput = Math.max(0, sessionInputSum - freshInput);

  return (
    (freshInput * inPrice) / 1e6 +
    (cachedInput * inPrice * cacheMult) / 1e6 +
    (outputTokens * outPrice) / 1e6
  );
}

function cleanedModels(models: NormalizedModel[]): NormalizedModel[] {
  const excludedPatterns = [
    'nemo', 'granite', 'lunaris', 'hermes', 'gemma-1', 'llama-2', 'gpt-3.5',
    'claude-2', 'claude-1', 'gemini-1.0', 'command-r', 'dbrx'
  ];
  return models.filter(m => {
    if (m.isFree || m.isBatch || m.blendedCost <= 0) return false;
    const lower = m.id.toLowerCase();
    if (excludedPatterns.some(pat => lower.includes(pat))) return false;
    return true;
  });
}

function formatTokens(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}B`;
  return `${Math.round(m) >= 100 ? Math.round(m) : m.toFixed(1)}M`;
}

export function WorkflowCalculator({ models, plans }: WorkflowCalculatorProps) {
  const [searchParams] = useSearchParams();

  const [inputMode, setInputMode] = useState<InputMode>(
    searchParams.get('mode') === 'session' ? 'session' : 'daily'
  );
  const [agentTasks, setAgentTasks] = useState(
    Number(searchParams.get('tasks')) || 10
  );
  const [chatQueries, setChatQueries] = useState(
    Number(searchParams.get('chats')) || 120
  );
  const [completions, setCompletions] = useState(
    Number(searchParams.get('comps')) || 200
  );
  const [contextKey, setContextKey] = useState<ContextKey>(
    CONTEXT_OPTIONS.some(c => c.key === searchParams.get('ctx')) ? (searchParams.get('ctx') as ContextKey) : 'medium'
  );
  const [cacheRate, setCacheRate] = useState<CacheRate>(
    searchParams.get('cache') !== null ? (Number(searchParams.get('cache')) as CacheRate) : DEFAULT_CACHE_RATE
  );
  const [sessionHours, setSessionHours] = useState(
    Number(searchParams.get('h')) || 5
  );
  const [sessionsPerDay, setSessionsPerDay] = useState(
    Number(searchParams.get('spd')) || 1
  );
  const [peakContextK, setPeakContextK] = useState(
    Number(searchParams.get('peak')) || 200
  );
  const [mcpStack, setMcpStack] = useState<McpStackKey>(
    Object.prototype.hasOwnProperty.call(MCP_STACK_LEVEL, searchParams.get('mcp') || '') ? (searchParams.get('mcp') as McpStackKey) : 'light'
  );
  const [estimateBasis, setEstimateBasis] = useState<EstimateBasis>(
    ESTIMATE_BASES.some(b => b.key === searchParams.get('basis')) ? (searchParams.get('basis') as EstimateBasis) : 'conservative'
  );
  const [qualityKey, setQualityKey] = useState<QualityKey>(
    QUALITY_PRESETS.some(q => q.key === searchParams.get('quality')) ? (searchParams.get('quality') as QualityKey) : 'balanced'
  );
  const [pipelineMode, setPipelineMode] = useState<'single' | 'hybrid'>(
    searchParams.get('pipe') === 'hybrid' ? 'hybrid' : 'single'
  );
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const params = new URLSearchParams();
    params.set('mode', inputMode);
    if (inputMode === 'daily') {
      params.set('tasks', String(agentTasks));
      params.set('chats', String(chatQueries));
      params.set('comps', String(completions));
      params.set('ctx', contextKey);
    } else {
      params.set('h', String(sessionHours));
      params.set('spd', String(sessionsPerDay));
      params.set('peak', String(peakContextK));
      params.set('mcp', mcpStack);
    }
    params.set('cache', String(cacheRate));
    params.set('pipe', pipelineMode);
    params.set('basis', estimateBasis);
    params.set('quality', qualityKey);

    const shareUrl = `${window.location.origin}${window.location.pathname}#/?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const contextTokens = CONTEXT_OPTIONS.find(c => c.key === contextKey)?.tokens ?? 40_000;
  const minCodingIndex = QUALITY_PRESETS.find(q => q.key === qualityKey)?.min ?? QUALITY.workhorse;
  const sessionTurns = Math.max(1, Math.round((Number.isFinite(sessionHours) && sessionHours > 0 ? sessionHours : 5) * TURNS_PER_HOUR));
  const safePeakContextK = Number.isFinite(peakContextK) && peakContextK > 0 ? peakContextK : 200;
  const mcpLevel = MCP_STACK_LEVEL[mcpStack] ?? 1;
  const finalContextTokens = safePeakContextK * 1000 + mcpLevel * MCP_TOOL_TOKENS_PER_TURN * sessionTurns;
  const sessionInputSum = (finalContextTokens * (sessionTurns + 1)) / 2;
  const sessionOutput = sessionTurns * SESSION_OUTPUT_TOKENS_PER_TURN;
  const safeSessionsPerDay = Number.isFinite(sessionsPerDay) && sessionsPerDay > 0 ? sessionsPerDay : 1;
  const monthlySessions = safeSessionsPerDay * WORKDAYS_PER_MONTH;

  const usage = useMemo(() => {
    if (inputMode === 'session') {
      const agentMonthlyInput = sessionInputSum * monthlySessions;
      const agentMonthlyOutput = sessionOutput * monthlySessions;
      const chatTokenCost = chatQueries * (CHAT_INPUT_TOKENS + 500) * WORKDAYS_PER_MONTH;
      const autoTokenCost = completions * (COMPLETION_INPUT_TOKENS + COMPLETION_OUTPUT_TOKENS) * WORKDAYS_PER_MONTH;
      return {
        mode: inputMode as InputMode,
        totalTokens: agentMonthlyInput + agentMonthlyOutput + chatTokenCost + autoTokenCost,
        agentRequests: sessionTurns * monthlySessions,
        sessionTurns,
        monthlySessions,
        sessionInputSum,
        sessionOutput,
        chatTokenCost,
        autoTokenCost,
        chatQueries: chatQueries * WORKDAYS_PER_MONTH,
        completions: completions * WORKDAYS_PER_MONTH,
      };
    }
    const agentRequests = agentTasks * AGENT_REQUESTS_PER_TASK * WORKDAYS_PER_MONTH;
    const agentTokenCost = agentTasks * AGENT_REQUESTS_PER_TASK * (contextTokens + 1000) * WORKDAYS_PER_MONTH;
    const chatTokenCost = chatQueries * (CHAT_INPUT_TOKENS + 500) * WORKDAYS_PER_MONTH;
    const autoTokenCost = completions * (COMPLETION_INPUT_TOKENS + COMPLETION_OUTPUT_TOKENS) * WORKDAYS_PER_MONTH;
    return {
      mode: inputMode as InputMode,
      totalTokens: agentTokenCost + chatTokenCost + autoTokenCost,
      agentRequests,
      sessionTurns: 0,
      monthlySessions: 0,
      sessionInputSum: 0,
      sessionOutput: 0,
      chatTokenCost,
      autoTokenCost,
      chatQueries: chatQueries * WORKDAYS_PER_MONTH,
      completions: completions * WORKDAYS_PER_MONTH,
    };
  }, [inputMode, agentTasks, chatQueries, completions, contextTokens, sessionInputSum, sessionOutput, sessionTurns, monthlySessions]);

  const apiComparables = useMemo(() => {
    const clean = cleanedModels(models).filter(
      m => (m.benchmarks?.codingIndex ?? 0) >= minCodingIndex
    );

    const sessionAgentCost = (m: NormalizedModel) =>
      inputMode === 'session'
        ? sessionCost(m, sessionInputSum, finalContextTokens, sessionOutput, cacheRate) * monthlySessions
        : 0;

    const dailyAgentCost = (m: NormalizedModel) =>
      inputMode === 'daily'
        ? requestCost(m, contextTokens, 1000, cacheRate) * usage.agentRequests
        : 0;

    const markdown = (m: NormalizedModel) => {
      const agentCost = sessionAgentCost(m) + dailyAgentCost(m);
      const chatCost = requestCost(m, 10_000, 500, cacheRate) * usage.chatQueries;
      const autoCost = requestCost(m, COMPLETION_INPUT_TOKENS, COMPLETION_OUTPUT_TOKENS, 0) * usage.completions;
      const monthlyCost = agentCost + chatCost + autoCost;
      return { model: m, monthlyCost, effectivePerM: monthlyCost / (usage.totalTokens / 1e6) };
    };

    const frontier = [...clean]
      .sort((a, b) => (b.benchmarks?.codingIndex ?? 0) - (a.benchmarks?.codingIndex ?? 0))[0];
    const workhorse = [...clean].sort(
      (a, b) => markdown(a).monthlyCost - markdown(b).monthlyCost
    )[0];

    return { frontier: frontier ? markdown(frontier) : null, workhorse: workhorse ? markdown(workhorse) : null };
  }, [models, usage, inputMode, contextTokens, cacheRate, minCodingIndex, sessionInputSum, finalContextTokens, sessionOutput, monthlySessions]);

  const tierRecommendations = useMemo(() => {
    const requiredTokens = usage.totalTokens / 1e6;
    const dailyDemand = inputMode === 'session'
      ? (sessionInputSum + sessionOutput) * sessionsPerDay
      : usage.totalTokens / WORKDAYS_PER_MONTH;

    const workloadItems: WorkloadItem[] =
      pipelineMode === 'hybrid' && apiComparables.workhorse && apiComparables.frontier
        ? [
            {
              modelId: apiComparables.workhorse.model.id,
              modelName: apiComparables.workhorse.model.name,
              share: 0.75,
              tokensMillion: requiredTokens * 0.75,
              costPpu: apiComparables.workhorse.monthlyCost * 0.75,
            },
            {
              modelId: apiComparables.frontier.model.id,
              modelName: apiComparables.frontier.model.name,
              share: 0.25,
              tokensMillion: requiredTokens * 0.25,
              costPpu: apiComparables.frontier.monthlyCost * 0.25,
            },
          ]
        : [
            {
              modelId: (apiComparables.workhorse || apiComparables.frontier)?.model.id || 'default',
              modelName: (apiComparables.workhorse || apiComparables.frontier)?.model.name || 'Default Model',
              share: 1.0,
              tokensMillion: requiredTokens,
              costPpu: (apiComparables.workhorse || apiComparables.frontier)?.monthlyCost || 0,
            },
          ];

    return plans
      .flatMap(plan =>
        (plan.tiers || [])
          .filter(t => t.monthlyPrice !== null && t.monthlyPrice > 0 && t.estimatedTokenBudget)
          .map(tier => {
            const tb = tier.estimatedTokenBudget;
            const primaryItem = workloadItems[0];
            const resolved = resolveTierModelBudget(tier, primaryItem?.modelName, primaryItem?.modelId);
            const conservative = resolved.tokens > 0 ? resolved.tokens : (tb ? tb.estimatedMillionTokens : 0);
            const optimistic = resolved.tokens > 0 ? (resolved.optimistic || resolved.tokens) : (tb ? (tb.optimisticEstimate ?? conservative) : 0);
            const midpoint = resolved.tokens > 0 ? (resolved.midpoint || resolved.tokens) : (tb ? (tb.midpointEstimate ?? conservative) : 0);
            const basis =
              estimateBasis === 'optimistic' ? optimistic :
              estimateBasis === 'midpoint' ? midpoint :
              conservative;
            const caps = { basis, optimistic, conservative };
            const poolDrain = calculatePoolDrain(plan, tier, workloadItems, estimateBasis);
            const fits = poolDrain.coverageType !== 'none' && poolDrain.overageCost === 0 && (caps.basis >= requiredTokens || poolDrain.coveredDirectCost >= poolDrain.totalDirectCost);
            const borderline = !fits && poolDrain.coverageType !== 'none' && (caps.optimistic >= requiredTokens || (caps.optimistic > caps.basis && poolDrain.overageCost < poolDrain.totalDirectCost * 0.25));
            const dailyCapacity = (caps.basis * 1e6) / 30;
            const windowRisk = dailyDemand > dailyCapacity;

            return {
              planId: plan.id,
              planName: plan.name,
              planCategory: plan.category,
              tierName: tier.name,
              monthlyPrice: tier.monthlyPrice as number,
              caps,
              fits,
              borderline,
              dailyDemand,
              dailyCapacity,
              windowRisk,
              poolDrain,
            };
          })
      )
      .filter(r => r.caps.basis > 0)
      .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  }, [plans, usage, estimateBasis, inputMode, sessionInputSum, sessionOutput, sessionsPerDay, pipelineMode, apiComparables]);

  const cheapestFit = tierRecommendations.find(r => r.fits) || null;
  const cheapestBorderline = tierRecommendations.find(r => r.borderline && !cheapestFit) || null;
  const overageApi =
    pipelineMode === 'hybrid' && apiComparables.workhorse && apiComparables.frontier
      ? apiComparables.workhorse.monthlyCost * 0.75 + apiComparables.frontier.monthlyCost * 0.25
      : apiComparables.workhorse && apiComparables.frontier
      ? Math.min(apiComparables.workhorse.monthlyCost, apiComparables.frontier.monthlyCost)
      : apiComparables.workhorse?.monthlyCost ?? apiComparables.frontier?.monthlyCost ?? null;

  const cachedDominant = inputMode === 'session' && cacheRate >= 0.9;

  const verdict = useMemo(() => {
    if (cheapestFit && overageApi != null) {
      const delta = overageApi - cheapestFit.monthlyPrice;
      return {
        planWinner: delta > 1,
        apiWinner: delta < -1,
        delta: Math.abs(delta),
        headline: delta > 1
          ? `${cheapestFit.planName} ${cheapestFit.tierName} saves you $${delta.toFixed(0)}/mo`
          : delta < -1
          ? `Direct API saves you $${Math.abs(delta).toFixed(0)}/mo vs the cheapest fitting plan`
          : 'Plan and direct API cost are roughly even for this workflow',
      };
    }
    if (overageApi != null && !cheapestFit && cheapestBorderline) {
      return {
        planWinner: false,
        apiWinner: false,
        delta: 0,
        headline: `Closest plan: ${cheapestBorderline.planName} ${cheapestBorderline.tierName} at $${cheapestBorderline.monthlyPrice}/mo — fits only at the optimistic estimate (${(cheapestBorderline.caps.optimistic / 1000).toFixed(1)}B) vs your ${(usage.totalTokens / 1e6).toFixed(1)}M demand`,
      };
    }
    if (overageApi != null && !cheapestFit) {
      return {
        planWinner: false,
        apiWinner: true,
        delta: 0,
        headline: `Direct API is your only path — no plan covers ${(usage.totalTokens / 1e6).toFixed(1)}M tokens/mo`,
      };
    }
    if (cheapestFit) {
      return {
        planWinner: true,
        apiWinner: false,
        delta: 0,
        headline: `${cheapestFit.planName} ${cheapestFit.tierName} is your cheapest path: $${cheapestFit.monthlyPrice}/mo`,
      };
    }
    return null;
  }, [cheapestFit, cheapestBorderline, overageApi, usage]);

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Workflow className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-text">Developer Workflow Breakeven Calculator</h2>
          </div>
          <p className="text-xs text-text-muted max-w-xl">
            Describe how you actually work — daily request volumes, or marathon agent sessions filling a
            context window — and we translate it into real token demand. Then we find the plan (or direct API
            path) that covers it cheapest.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs">
            {(['daily', 'session'] as InputMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={`flex items-center gap-1 px-3 py-1 rounded-md font-semibold transition-colors ${
                  inputMode === mode
                    ? 'bg-surface text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {mode === 'daily' ? <Layers className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {mode === 'daily' ? 'Daily' : 'Session'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Cache:</span>
            {([0, 0.75, 0.9] as CacheRate[]).map(rate => (
              <button
                key={rate}
                onClick={() => setCacheRate(rate)}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  cacheRate === rate
                    ? 'bg-surface text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {rate === 0 ? '0%' : `${Math.round(rate * 100)}%`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Pipeline:</span>
            <button
              onClick={() => setPipelineMode('single')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                pipelineMode === 'single'
                  ? 'bg-surface text-text shadow-xs border border-border'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setPipelineMode('hybrid')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                pipelineMode === 'hybrid'
                  ? 'bg-surface text-text shadow-xs border border-border'
                  : 'text-text-muted hover:text-text'
              }`}
              title="75% Workhorse (bulk coding) + 25% Frontier (planning & architecture)"
            >
              Hybrid (75/25)
            </button>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface-alt hover:bg-surface text-xs font-semibold text-text-muted hover:text-text transition-colors shadow-xs"
            title="Copy shareable link for this workflow scenario"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-success font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-primary" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inputs */}
      {inputMode === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Agent Tasks / Day</label>
              <span className="text-lg font-black text-primary">{agentTasks}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={agentTasks}
              onChange={e => setAgentTasks(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-text-muted mt-1">
              ~{AGENT_REQUESTS_PER_TASK} model requests per task (edit loops, tool calls, retries)
            </p>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Chat Queries / Day</label>
              <span className="text-lg font-black text-primary">{chatQueries}</span>
            </div>
            <input
              type="range"
              min={0}
              max={400}
              step={10}
              value={chatQueries}
              onChange={e => setChatQueries(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Quick inline questions (~11K tokens each)
            </p>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Tab Completions / Day</label>
              <span className="text-lg font-black text-primary">{completions}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={25}
              value={completions}
              onChange={e => setCompletions(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-text-muted mt-1">
              Speculative autocomplete (~600 tokens each)
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {SESSION_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  setSessionHours(p.hours);
                  setSessionsPerDay(p.perDay);
                  setPeakContextK(p.peak);
                  setMcpStack(p.mcp);
                }}
                className={`px-3 py-1.5 rounded-xl border border-border bg-surface-alt text-xs font-semibold text-text-muted hover:text-text hover:border-border transition-colors ${
                  sessionHours === p.hours &&
                  sessionsPerDay === p.perDay &&
                  peakContextK === p.peak &&
                  mcpStack === p.mcp
                    ? 'bg-surface text-text border-primary/50 shadow-xs'
                    : ''
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Sessions / Workday</label>
                <span className="text-lg font-black text-primary">{sessionsPerDay}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={sessionsPerDay}
                onChange={e => setSessionsPerDay(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-[11px] text-text-muted mt-1">Agent sessions per working day</p>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Session Length</label>
                <span className="text-lg font-black text-primary">{sessionHours}h</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={sessionHours}
                onChange={e => setSessionHours(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-[11px] text-text-muted mt-1">
                ≈ {sessionTurns} agent turns (~{TURNS_PER_HOUR}/h)
              </p>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Peak Context</label>
                <span className="text-lg font-black text-primary">{peakContextK}K</span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={peakContextK}
                onChange={e => setPeakContextK(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-[11px] text-text-muted mt-1">
                {mcpStack === 'none'
                  ? 'Final accumulated context this session reaches'
                  : `With MCP tool outputs → ~${Math.round(finalContextTokens / 1000)}K final context`}
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 block">MCP Stack</label>
              <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs w-fit">
                {MCP_STACK_OPTIONS.map(o => (
                  <button
                    key={o.key}
                    onClick={() => setMcpStack(o.key)}
                    title={o.hint}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      mcpStack === o.key
                        ? 'bg-surface text-text shadow-xs border border-border'
                        : 'text-text-muted hover:text-text'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                {mcpStack === 'none'
                  ? 'No tool-output overhead'
                  : `+${(MCP_STACK_LEVEL[mcpStack] * MCP_TOOL_TOKENS_PER_TURN).toLocaleString()}K tool-result tokens re-read into later turns`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat + Completions (session mode keeps daily-scale auxiliary usage) */}
      {inputMode === 'session' && (
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Chat Queries / Day</label>
              <span className="text-lg font-black text-primary">{chatQueries}</span>
            </div>
            <input
              type="range"
              min={0}
              max={400}
              step={10}
              value={chatQueries}
              onChange={e => setChatQueries(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Tab Completions / Day</label>
              <span className="text-lg font-black text-primary">{completions}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              step={25}
              value={completions}
              onChange={e => setCompletions(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {/* Context Size (daily) + Estimate Basis + Coding Quality + Summary */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-6">
        {inputMode === 'daily' && (
          <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs w-fit">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Context:</span>
            {CONTEXT_OPTIONS.map(c => (
              <button
                key={c.key}
                onClick={() => setContextKey(c.key)}
                title={c.hint}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  contextKey === c.key
                    ? 'bg-surface text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {c.label} ({c.tokens / 1000}K)
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs w-fit">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Estimates:</span>
          {ESTIMATE_BASES.map(b => (
            <button
              key={b.key}
              onClick={() => setEstimateBasis(b.key)}
              title={b.hint}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                estimateBasis === b.key
                  ? 'bg-surface text-text shadow-xs border border-border'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs w-fit">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">
            <Gauge className="w-3 h-3" /> Quality:
          </span>
          {QUALITY_PRESETS.map(q => (
              <button
                key={q.key}
                onClick={() => setQualityKey(q.key)}
                title={q.hint}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  qualityKey === q.key
                    ? 'bg-surface text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {q.label}
              </button>
            ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
        <div className="flex-1 bg-surface-alt border border-border px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span>
            {inputMode === 'session' ? (
              <>
                {sessionHours}h × {sessionsPerDay}/day × 22 workdays ≈{' '}
                <strong className="text-text">{monthlySessions} sessions</strong> ·{' '}
                ~{Math.round(finalContextTokens / 1000)}K final context ·{' '}
                ~{sessionTurns.toLocaleString()} turns/session → needs ~
                <strong className="text-text">{(usage.totalTokens / 1e6).toFixed(1)}M tokens/mo</strong>
                {' '}({usage.agentRequests.toLocaleString()} requests · {usage.chatQueries.toLocaleString()} chats · {usage.completions.toLocaleString()} completions)
              </>
            ) : (
              <>
                Your workflow needs ~<strong className="text-text">{(usage.totalTokens / 1e6).toFixed(1)}M tokens/mo</strong>
                {' '}({usage.agentRequests.toLocaleString()} agent requests · {usage.chatQueries.toLocaleString()} chats · {usage.completions.toLocaleString()} completions @ 22 workdays)
              </>
            )}
          </span>
        </div>
      </div>

      {/* Verdict Banner */}
      {verdict && (
        <div className={`p-4 rounded-xl mb-6 border ${
          verdict.planWinner
            ? 'bg-primary/5 border-primary/30'
            : 'bg-success/5 border-success/30'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-surface border border-border shrink-0 ${
              verdict.planWinner ? 'text-primary' : 'text-success'
            }`}>
              {verdict.planWinner ? <Rocket className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-text mb-0.5">Breakeven Verdict</div>
              <p className="text-sm font-bold text-text">{verdict.headline}</p>
              {cachedDominant && (
                <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Cached input dominates (~{Math.round(cacheRate * 100)}% of billed tokens) — for this workflow the
                  breakeven hinges on 5-hour window quotas and capacity estimates, not aggregate monthly token counts.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cheapest Fitting Plans */}
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-primary" /> Cheapest Plans That Cover Your Workflow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tierRecommendations
            .filter(r => r.fits)
            .slice(0, 3)
            .map(r => {
              const c = r.caps;
              const hasRange = c.optimistic > c.conservative;
              return (
                <div key={`${r.planId}-${r.tierName}`} className="border border-border rounded-xl p-3 bg-surface-alt/50">
                  <div className="text-sm font-bold text-text truncate">{r.planName} <span className="text-text-muted font-medium">· {r.tierName}</span></div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-primary">${r.monthlyPrice}</span>
                    <span className="text-xs text-text-muted">/mo</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-1">
                    Capacity ~{formatTokens(c.basis)}
                    {hasRange ? ` (${formatTokens(c.conservative)}–${formatTokens(c.optimistic)})` : ''} tokens
                    {overageApi != null && (
                      <> · saves ${Math.max(0, overageApi - r.monthlyPrice).toFixed(2)} vs API</>
                    )}
                  </div>
                  {r.poolDrain && (
                    <div className="text-[10px] text-text-muted mt-1 flex items-center justify-between">
                      <span>Pool usage: ~{r.poolDrain.poolUtilizedPercent}%</span>
                      {r.poolDrain.isCapped && (
                        <span className="text-warning font-semibold">+${r.poolDrain.overageCost.toFixed(2)} API overage</span>
                      )}
                    </div>
                  )}
                  {r.windowRisk && (
                    <div className="text-[10px] text-warning mt-1" title="Monthly capacity averaged over 30 days is lower than your busiest working day, and most plans cap usage in 5-hour/weekly windows">
                      Peak-window risk: ~{formatTokens(r.dailyDemand / 1e6)}/day demand vs ~{formatTokens(r.dailyCapacity / 1e6)}/day average capacity
                    </div>
                  )}
                </div>
              );
            })}
          {tierRecommendations.filter(r => r.fits).length === 0 && (
            <div className="md:col-span-3 text-xs text-text-muted italic border border-border rounded-xl p-4 bg-surface-alt/50 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-warning" />
              No subscription covers {(usage.totalTokens / 1e6).toFixed(1)}M tokens/mo on this estimate basis — direct API is the economical path at this usage level.
            </div>
          )}
        </div>
        {cheapestBorderline && (
          <div className="mt-3 border border-warning/40 rounded-xl p-3 bg-warning/5 text-xs text-text-muted flex items-start gap-2">
            <Gauge className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
            <span>
              <strong className="text-text">Borderline:</strong> {cheapestBorderline.planName} {cheapestBorderline.tierName} at
              ${cheapestBorderline.monthlyPrice}/mo covers {(cheapestBorderline.caps.conservative / 1000).toFixed(1)}B–
              {(cheapestBorderline.caps.optimistic / 1000).toFixed(1)}B tokens/mo depending on the capacity estimate —
              it fits your demand only at the optimistic end.
            </span>
          </div>
        )}
      </div>

      {/* Direct API Comparables */}
      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-success" /> Direct API Equivalents ({Math.round(cacheRate * 100)}% cache · {minCodingIndex}+ CI)
        </h3>
        <div className={`grid grid-cols-1 ${pipelineMode === 'hybrid' && apiComparables.frontier && apiComparables.workhorse ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-3`}>
          {pipelineMode === 'hybrid' && apiComparables.frontier && apiComparables.workhorse && (
            <div className="border border-primary/40 rounded-xl p-3 bg-primary/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                Hybrid Pipeline (75/25)
              </div>
              <div className="text-sm font-bold text-text truncate">
                {apiComparables.workhorse.model.name} + {apiComparables.frontier.model.name}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-black text-primary">
                  ${(apiComparables.workhorse.monthlyCost * 0.75 + apiComparables.frontier.monthlyCost * 0.25).toFixed(2)}
                </span>
                <span className="text-xs text-text-muted">/mo blended</span>
              </div>
              <div className="text-[11px] text-text-muted mt-1">
                75% workhorse bulk + 25% frontier architect
              </div>
            </div>
          )}
          {(['frontier', 'workhorse'] as const).map(key => {
            const c = apiComparables[key];
            if (!c) return null;
            return (
              <div key={key} className="border border-border rounded-xl p-3 bg-surface-alt/50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                  {key === 'frontier' ? 'Best Frontier' : 'Best-Value Workhorse'}
                </div>
                <div className="text-sm font-bold text-text truncate">{c.model.name}</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-success">${c.monthlyCost.toFixed(2)}</span>
                  <span className="text-xs text-text-muted">/mo direct</span>
                </div>
                {verdict && verdict.planWinner && (
                  <div className="text-[11px] text-text-muted mt-1">
                    vs cheapest fitting plan at ${verdict.delta.toFixed(2)} premium
                  </div>
                )}
                <div className="text-[11px] text-text-muted mt-1">
                  ≈ ${c.effectivePerM.toFixed(3)}/M effective · {Math.round(cacheRate * 100)}% cache
                </div>
              </div>
            );
          })}
          {!apiComparables.frontier && !apiComparables.workhorse && (
            <div className="md:col-span-2 text-xs text-text-muted italic border border-border rounded-xl p-4 bg-surface-alt/50">
              No API models meet the {qualityKey === 'any' ? 'Any' : qualityKey} quality preset (need AI Coding Index ≥ {minCodingIndex}).
            </div>
          )}
        </div>
      </div>

      {/* Assumptions footnote */}
      <p className="text-[10px] text-text-muted mt-4 flex items-start gap-1.5">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        Assumptions:{' '}
        {inputMode === 'session'
          ? `agent sessions accumulate context linearly to ~${Math.round(finalContextTokens / 1000)}K final context over ~${sessionTurns} turns (~${TURNS_PER_HOUR} turns/h), with ${sessionsPerDay}/day × 22 workdays`
          : `22 workdays/month, agent tasks average ${AGENT_REQUESTS_PER_TASK} requests of ${contextTokens / 1000}K-token context + 1K output`}
        , chat requests use {CHAT_INPUT_TOKENS / 1000}K input + 500 output, completions use ~{COMPLETION_INPUT_TOKENS + COMPLETION_OUTPUT_TOKENS} tokens (500 in + 100 out)
        {inputMode === 'session' ? `, MCP tools add ${MCP_STACK_LEVEL[mcpStack] * MCP_TOOL_TOKENS_PER_TURN / 1000}K tool-output tokens per turn into later context` : ''}
        , and plan capacity is measured against the {estimateBasis} estimate. Direct API rates here are priced against
        your own workload (cache-heavy, output-light session reads), while the Home leaderboard prices a fixed 20K-in/1K-out
        standard request — the two $/M effective rates legitimately differ at the same cache setting. Estimates are conservative — verify against
        your actual usage dashboards.
      </p>
    </div>
  );
}
