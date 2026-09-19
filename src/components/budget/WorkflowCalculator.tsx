import { useState, useMemo } from 'react';
import type { CodingPlan, NormalizedModel, CacheRate } from '../../lib/types';
import { getModelCacheDiscountMultiplier } from '../../lib/pricing';
import {
  Workflow,
  Sparkles,
  Rocket,
  Coins,
  TrendingDown,
  TrendingUp,
  Info,
  XCircle,
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
const COMPLETION_TOKENS = 300;

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
  const inPrice = model.pricing.input || model.blendedCost * 0.75;
  const outPrice = model.pricing.output || model.blendedCost * 1.75;
  const cacheMult = getModelCacheDiscountMultiplier(model.provider, model.id);
  const freshInput = inputTokens * (1 - cacheRate);
  const cachedInput = inputTokens * cacheRate;
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

export function WorkflowCalculator({ models, plans }: WorkflowCalculatorProps) {
  const [agentTasks, setAgentTasks] = useState(10);
  const [chatQueries, setChatQueries] = useState(120);
  const [completions, setCompletions] = useState(200);
  const [contextKey, setContextKey] = useState<ContextKey>('medium');
  const [cacheRate, setCacheRate] = useState<CacheRate>(0.75);

  const contextTokens = CONTEXT_OPTIONS.find(c => c.key === contextKey)!.tokens;

  const usage = useMemo(() => {
    const agentRequests = agentTasks * AGENT_REQUESTS_PER_TASK * WORKDAYS_PER_MONTH;
    const agentTokenCost = agentTasks * AGENT_REQUESTS_PER_TASK * (contextTokens + 1000) * WORKDAYS_PER_MONTH;
    const chatTokenCost = chatQueries * (CHAT_INPUT_TOKENS + 500) * WORKDAYS_PER_MONTH;
    const autoTokenCost = completions * COMPLETION_TOKENS * WORKDAYS_PER_MONTH;
    return {
      totalTokens: agentTokenCost + chatTokenCost + autoTokenCost,
      agentRequests,
      chatQueries: chatQueries * WORKDAYS_PER_MONTH,
      completions: completions * WORKDAYS_PER_MONTH,
    };
  }, [agentTasks, chatQueries, completions, contextTokens]);

  const apiComparables = useMemo(() => {
    const clean = cleanedModels(models);
    const frontier = [...clean]
      .filter(m => (m.benchmarks?.codingIndex ?? 0) >= 68)
      .sort((a, b) => (b.benchmarks?.codingIndex ?? 0) - (a.benchmarks?.codingIndex ?? 0))[0];
    const workhorse = [...clean]
      .filter(m => (m.benchmarks?.codingIndex ?? 0) >= 65)
      .sort((a, b) => {
        const agentA = requestCost(a, contextTokens, 1000, cacheRate) * usage.agentRequests +
          requestCost(a, 10_000, 500, cacheRate) * usage.chatQueries;
        const agentB = requestCost(b, contextTokens, 1000, cacheRate) * usage.agentRequests +
          requestCost(b, 10_000, 500, cacheRate) * usage.chatQueries;
        return agentA - agentB;
      })[0];

    const pick = (m: NormalizedModel | undefined) => {
      if (!m) return null;
      const agentCost =
        requestCost(m, contextTokens, 1000, cacheRate) * usage.agentRequests;
      const chatCost = requestCost(m, 10_000, 500, cacheRate) * usage.chatQueries;
      const autoCost = requestCost(m, 500, 100, 0) * usage.completions;
      const total = agentCost + chatCost + autoCost;
      return { model: m, monthlyCost: total };
    };

    return {
      frontier: pick(frontier),
      workhorse: pick(workhorse),
    };
  }, [models, usage, contextTokens, cacheRate]);

  const tierRecommendations = useMemo(() => {
    const requiredTokens = usage.totalTokens / 1e6;
    return plans
      .flatMap(plan =>
        (plan.tiers || [])
          .filter(t => t.monthlyPrice !== null && t.monthlyPrice > 0 && t.estimatedTokenBudget)
          .map(tier => {
            const capacity = tier.estimatedTokenBudget?.estimatedMillionTokens ?? 0;
            const fits = capacity >= requiredTokens;
            return {
              planId: plan.id,
              planName: plan.name,
              planCategory: plan.category,
              tierName: tier.name,
              monthlyPrice: tier.monthlyPrice as number,
              capacity,
              fits,
            };
          })
      )
      .filter(r => r.capacity > 0)
      .sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  }, [plans, usage]);

  const cheapestFit = tierRecommendations.find(r => r.fits) || null;
  const overageApi = apiComparables.workhorse && apiComparables.frontier
    ? Math.min(apiComparables.workhorse.monthlyCost, apiComparables.frontier.monthlyCost)
    : apiComparables.workhorse?.monthlyCost ?? apiComparables.frontier?.monthlyCost ?? null;

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
    if (overageApi != null && !cheapestFit) {
      return {
        planWinner: false,
        apiWinner: true,
        delta: 0,
        headline: `Direct API is your only path — no plan covers ${Math.round(usage.totalTokens / 1e6)}M tokens/mo`,
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
  }, [cheapestFit, overageApi, usage]);

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
            Describe how you actually work — agent runs, quick chats, and tab completions — and we translate it into
            real token demand. Then we find the plan (or direct API path) that covers it cheapest.
          </p>
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
      </div>

      {/* Inputs */}
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
            Speculative autocomplete (~300 tokens each)
          </p>
        </div>
      </div>

      {/* Context Size + Summary */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-6">
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

        <div className="flex-1 bg-surface-alt border border-border px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span>
            Your workflow needs ~<strong className="text-text">{(usage.totalTokens / 1e6).toFixed(1)}M tokens/mo</strong>
            {' '}({usage.agentRequests.toLocaleString()} agent requests · {usage.chatQueries.toLocaleString()} chats · {usage.completions.toLocaleString()} completions @ 22 workdays)
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
            .map(r => (
              <div key={`${r.planId}-${r.tierName}`} className="border border-border rounded-xl p-3 bg-surface-alt/50">
                <div className="text-sm font-bold text-text truncate">{r.planName} <span className="text-text-muted font-medium">· {r.tierName}</span></div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-primary">${r.monthlyPrice}</span>
                  <span className="text-xs text-text-muted">/mo</span>
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  Capacity {r.capacity.toFixed(1)}M tokens
                  {overageApi != null && (
                    <> · saves ${Math.max(0, overageApi - r.monthlyPrice).toFixed(2)} vs API</>
                  )}
                </div>
              </div>
            ))}
          {tierRecommendations.filter(r => r.fits).length === 0 && (
            <div className="md:col-span-3 text-xs text-text-muted italic border border-border rounded-xl p-4 bg-surface-alt/50 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-warning" />
              No subscription covers {(usage.totalTokens / 1e6).toFixed(1)}M tokens/mo — direct API is the economical path at this usage level.
            </div>
          )}
        </div>
      </div>

      {/* Direct API Comparables */}
      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-success" /> Direct API Equivalents ({Math.round(cacheRate * 100)}% cache)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Assumptions footnote */}
      <p className="text-[10px] text-text-muted mt-4 flex items-start gap-1.5">
        <Info className="w-3 h-3 shrink-0 mt-0.5" />
        Assumptions: 22 workdays/month, agent tasks average {AGENT_REQUESTS_PER_TASK} requests of {contextTokens / 1000}K-token
        context + 1K output, chat requests use {CHAT_INPUT_TOKENS / 1000}K input + 500 output, completions use ~300 tokens,
        and plan capacity comes from audited provider quotas. Estimates are conservative — verify against your actual usage dashboards.
      </p>
    </div>
  );
}
