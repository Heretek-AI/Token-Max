import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModels } from '../hooks/useModels';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  REASONING_EFFORT_SPECS,
  PLAN_ABSORPTION_POLICIES,
  calculateReasoningCost,
  calculateMonthlyReasoningWorkload,
  type ReasoningEffort,
  type ReasoningTurnCost,
} from '../lib/reasoning';
import type { CacheRate } from '../lib/types';
import { formatPrice } from '../lib/pricing';
import {
  Brain,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ExternalLink,
  Share2,
  Check,
  RotateCcw,
  Info,
  DollarSign,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function ReasoningExploder() {
  const { models, loading: modelsLoading } = useModels();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial params
  const rawEffort = searchParams.get('effort') as ReasoningEffort;
  const initialEffort: ReasoningEffort = (rawEffort && REASONING_EFFORT_SPECS[rawEffort]) ? rawEffort : 'medium';
  const initialTurns = Math.min(3000, Math.max(100, Number(searchParams.get('turns')) || 800));
  const initialCache = (Number(searchParams.get('cache')) || 0.75) as CacheRate;
  const initialModel = searchParams.get('model') || 'anthropic/claude-sonnet-5';

  const [effort, setEffort] = useState<ReasoningEffort>(initialEffort);
  const [turns, setTurns] = useState<number>(initialTurns);
  const [cacheRate, setCacheRate] = useState<CacheRate>(initialCache);
  const [selectedModelId, setSelectedModelId] = useState<string>(initialModel);
  const [absorptionFilter, setAbsorptionFilter] = useState<'all' | 'full-absorption' | 'quota-penalty' | 'pass-through'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Model lookup map
  const modelMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of models) {
      map.set(m.id, m);
    }
    return map;
  }, [models]);

  // Target model
  const activeModel = useMemo(() => {
    return modelMap.get(selectedModelId) || models.find((m) => m.id.includes('sonnet') || m.id.includes('claude')) || models[0];
  }, [modelMap, selectedModelId, models]);

  // Sync to URL
  const updateUrl = (newEffort: ReasoningEffort, newTurns: number, newCache: CacheRate, newModel: string) => {
    const params = new URLSearchParams();
    params.set('effort', newEffort);
    params.set('turns', newTurns.toString());
    params.set('cache', newCache.toString());
    params.set('model', newModel);
    setSearchParams(params, { replace: true });
  };

  const handleEffortChange = (e: ReasoningEffort) => {
    setEffort(e);
    updateUrl(e, turns, cacheRate, selectedModelId);
  };

  const handleTurnsChange = (t: number) => {
    setTurns(t);
    updateUrl(effort, t, cacheRate, selectedModelId);
  };

  const handleCacheChange = (c: CacheRate) => {
    setCacheRate(c);
    updateUrl(effort, turns, c, selectedModelId);
  };

  const handleModelChange = (id: string) => {
    setSelectedModelId(id);
    updateUrl(effort, turns, cacheRate, id);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Workload calculations
  const workload = useMemo(() => {
    if (!activeModel) return null;
    return calculateMonthlyReasoningWorkload(activeModel, turns, cacheRate, effort);
  }, [activeModel, turns, cacheRate, effort]);

  // Feasibility per effort level for the active model (VULN-06)
  const effortFeasibility = useMemo(() => {
    if (!activeModel) return null;
    const map = {} as Record<ReasoningEffort, ReasoningTurnCost>;
    for (const eKey of ['off', 'low', 'medium', 'high', 'max'] as ReasoningEffort[]) {
      map[eKey] = calculateReasoningCost(activeModel, cacheRate, eKey);
    }
    return map;
  }, [activeModel, cacheRate]);

  // Popular reasoning benchmark models for side-by-side comparison
  const comparisonModels = useMemo(() => {
    const targets = [
      'anthropic/claude-sonnet-5',
      'anthropic/claude-opus-5',
      'deepseek/deepseek-r1',
      'openai/o3-mini',
      'google/gemini-2.0-flash-001',
      'z-ai/glm-5.3-flash',
    ];
    return targets
      .map((id) => modelMap.get(id))
      .filter(Boolean);
  }, [modelMap]);

  // Chart data: stack base input, visible output, and hidden reasoning cost per turn (in cents)
  const chartData = useMemo(() => {
    return comparisonModels.map((m) => {
      const turn = calculateReasoningCost(m, cacheRate, effort);
      return {
        name: m.name,
        inputCost: Number((turn.inputCost * 100).toFixed(2)), // in cents
        outputCost: Number((turn.outputCost * 100).toFixed(2)), // in cents
        reasoningCost: Number((turn.reasoningCost * 100).toFixed(2)), // in cents
        totalCost: Number((turn.totalCost * 100).toFixed(2)),
        multiplier: turn.inflationMultiplier,
      };
    });
  }, [comparisonModels, cacheRate, effort]);

  // Filter absorption policies
  const filteredPolicies = useMemo(() => {
    if (absorptionFilter === 'all') return PLAN_ABSORPTION_POLICIES;
    return PLAN_ABSORPTION_POLICIES.filter((p) => p.absorptionType === absorptionFilter);
  }, [absorptionFilter]);

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="relative border-b border-steel-700/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/20 border border-primary/40 text-primary-light shadow-[0_0_15px_hsl(0_70%_40%_/0.3)]">
                <Brain className="w-6 h-6 text-blood-400" />
              </span>
              <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-text">
                Reasoning Token Cost Exploder
              </h1>
            </div>
            <p className="text-text-muted mt-2 max-w-3xl text-sm leading-relaxed">
              Model the hidden 3x–15x token cost inflation of frontier reasoning chains (o3, Claude 3.7 Thinking, DeepSeek-R1) and discover which subscription plans absorb reasoning costs into flat monthly fees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text transition-colors shadow-sm"
              title="Copy shareable link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blood-400" />
                  <span>Share Analysis</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setEffort('medium');
                setTurns(800);
                setCacheRate(0.75);
                updateUrl('medium', 800, 0.75, selectedModelId);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text transition-colors"
              title="Reset parameters to standard medium reasoning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Reasoning Effort Pills */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-display font-bold text-steel-400 flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-blood-500" />
            Reasoning Effort:
          </span>
          {(['off', 'low', 'medium', 'high', 'max'] as ReasoningEffort[]).map((eKey) => {
            const spec = REASONING_EFFORT_SPECS[eKey];
            const isActive = effort === eKey;
            const infeasible = effortFeasibility != null && !effortFeasibility[eKey].feasible;
            const infeasibleTitle = effortFeasibility?.[eKey].infeasibilityReason ?? '';
            return (
              <button
                key={eKey}
                onClick={() => { if (!infeasible) handleEffortChange(eKey); }}
                disabled={infeasible}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  infeasible
                    ? 'border-steel-800 bg-void-950/60 text-steel-600 line-through cursor-not-allowed'
                    : isActive
                    ? 'border-blood-500/80 bg-blood-950/60 text-blood-200 shadow-[0_0_12px_hsl(0_70%_40%_/0.25)]'
                    : 'border-steel-700/60 bg-void-950/40 text-steel-300 hover:border-steel-500 hover:text-text'
                }`}
                title={infeasible ? `Infeasible: ${infeasibleTitle}` : spec.description}
              >
                {spec.label}
              </button>
            );
          })}
        </div>

        {/* Infeasible effort warning (VULN-06) */}
        {effortFeasibility && !effortFeasibility[effort].feasible && (
          <div className="mt-3 p-3 rounded-lg bg-amber-950/50 border border-amber-700/40 text-xs text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Impossible combination.</span>{' '}
              {effortFeasibility[effort].infeasibilityReason}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls & Cost KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Card */}
        <div className="lg:col-span-7 p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-6">
          <div className="flex items-center justify-between border-b border-steel-800 pb-3">
            <h2 className="text-sm uppercase tracking-widest font-display font-bold text-steel-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blood-500" />
              Reasoning Workload Controls
            </h2>
            <span className="text-xs text-text-muted">
              {REASONING_EFFORT_SPECS[effort].tokens.toLocaleString()} thinking tokens/turn
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                Target Model:
              </label>
              <select
                value={activeModel?.id}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-steel-700 bg-surface text-text font-mono focus:border-blood-500 focus:outline-none"
              >
                {models
                  .filter((m) => !m.isBatch && m.blendedCost > 0)
                  .sort((a, b) => (b.benchmarks.codingIndex || 0) - (a.benchmarks.codingIndex || 0))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider}) — Out: ${m.pricing.output.toFixed(2)}/M
                    </option>
                  ))}
              </select>
            </div>

            {/* Prompt Cache Rate */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                Prompt Cache Hit Rate:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[0, 0.75, 0.90].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleCacheChange(rate as CacheRate)}
                    className={`py-2 text-xs font-semibold rounded border transition-colors ${
                      cacheRate === rate
                        ? 'border-blood-500 bg-blood-950/60 text-blood-200'
                        : 'border-steel-700 bg-surface/60 text-steel-400 hover:text-text hover:bg-surface'
                    }`}
                  >
                    {rate * 100}% Cache
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Turns Slider */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold uppercase tracking-wider text-steel-300">
                  Monthly Agent Turns:
                </label>
                <span className="font-mono text-blood-300 font-bold px-2 py-0.5 rounded bg-surface border border-steel-700">
                  {turns.toLocaleString()} Turns / month
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={3000}
                step={50}
                value={turns}
                onChange={(e) => handleTurnsChange(Number(e.target.value))}
                className="w-full accent-blood-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>100 (Light Casual)</span>
                <span>800 (Full-time Dev)</span>
                <span>2,000 (Autonomous Fleet)</span>
                <span>3,000 (Extreme Power)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Impact KPIs */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
              Base Direct Spend
            </span>
            <div className="text-2xl font-display font-bold text-text mt-1">
              {workload ? formatPrice(workload.monthlyBaseCost) : '—'}
            </div>
            <span className="text-[11px] text-text-muted mt-1">
              without reasoning tokens
            </span>
          </div>

          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
              Reasoning-Inflated Spend
            </span>
            <div className="text-2xl font-display font-bold text-blood-400 mt-1">
              {workload ? formatPrice(workload.monthlyTotalCost) : '—'}
            </div>
            <span className="text-[11px] text-blood-300 mt-1 font-semibold">
              {workload ? `${workload.inflationMultiplier}x turn cost` : ''}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 col-span-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest font-display text-steel-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blood-500" />
                The Net "Reasoning Tax"
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blood-950/80 border border-blood-600/40 text-blood-300">
                +{workload ? formatPrice(workload.monthlyReasoningTax) : '$0.00'}/mo
              </span>
            </div>
            <div className="text-xs text-text-muted mt-2">
              Generating <span className="text-text font-bold font-mono">~{workload?.reasoningTokensMillion}M hidden reasoning tokens</span> that are never visible in the final code diff.
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Stacked Visualization */}
      <div className="p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <Flame className="w-4 h-4 text-blood-500" />
              Per-Turn Cost Anatomy: Visible vs. Hidden Reasoning (Cents / Turn)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Notice how the reasoning block (crimson) towers over input and output tokens for high-effort models.
            </p>
          </div>
          <span className="text-xs text-steel-400 font-mono hidden sm:inline">
            Effort: {REASONING_EFFORT_SPECS[effort].label}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                unit="¢"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-lg border border-steel-700 bg-surface shadow-xl text-xs space-y-1.5">
                        <div className="font-bold text-text">{data.name}</div>
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">Cached Input:</span>
                          <span className="font-mono text-steel-200">{data.inputCost}¢</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">Visible Output:</span>
                          <span className="font-mono text-steel-200">{data.outputCost}¢</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-blood-400 font-semibold">Hidden Reasoning:</span>
                          <span className="font-mono font-bold text-blood-400">{data.reasoningCost}¢</span>
                        </div>
                        <div className="border-t border-steel-800 pt-1 flex justify-between gap-4 font-bold">
                          <span className="text-text">Total / Turn:</span>
                          <span className="font-mono text-emerald-400">{data.totalCost}¢ ({data.multiplier}x)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => {
                  if (value === 'inputCost') return 'Input Context (Cached)';
                  if (value === 'outputCost') return 'Visible Output Diff';
                  if (value === 'reasoningCost') return 'Hidden Reasoning Tokens (Tax)';
                  return value;
                }}
              />
              <Bar dataKey="inputCost" stackId="a" fill="#64748b" />
              <Bar dataKey="outputCost" stackId="a" fill="#3b82f6" />
              <Bar dataKey="reasoningCost" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan Absorption Matrix Table */}
      <div className="rounded-xl border border-steel-700/60 bg-void-950/60 overflow-hidden">
        {/* Table Header & Filters */}
        <div className="p-4 border-b border-steel-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blood-500" />
              Subscription Plan Absorption Matrix
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Which subscriptions absorb thinking tokens into flat fees vs pass them through to your credit card?
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setAbsorptionFilter('all')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                absorptionFilter === 'all'
                  ? 'bg-steel-700 text-text'
                  : 'text-text-muted hover:bg-surface hover:text-text'
              }`}
            >
              All Plans
            </button>
            <button
              onClick={() => setAbsorptionFilter('full-absorption')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                absorptionFilter === 'full-absorption'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  : 'text-text-muted hover:bg-surface hover:text-emerald-400'
              }`}
            >
              Full Absorption
            </button>
            <button
              onClick={() => setAbsorptionFilter('quota-penalty')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                absorptionFilter === 'quota-penalty'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                  : 'text-text-muted hover:bg-surface hover:text-amber-400'
              }`}
            >
              Quota Penalty
            </button>
            <button
              onClick={() => setAbsorptionFilter('pass-through')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                absorptionFilter === 'pass-through'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
                  : 'text-text-muted hover:bg-surface hover:text-rose-400'
              }`}
            >
              Pass-Through
            </button>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-steel-800/80">
          {filteredPolicies.map((p) => {
            const typeBadge = {
              'full-absorption': {
                label: 'Full Absorption',
                badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40',
                icon: ShieldCheck,
                color: 'text-emerald-400',
              },
              'quota-penalty': {
                label: 'Quota Penalty',
                badge: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
                icon: AlertTriangle,
                color: 'text-amber-400',
              },
              'pass-through': {
                label: 'Unshielded Billing',
                badge: 'bg-rose-950/60 text-rose-300 border-rose-600/40',
                icon: Flame,
                color: 'text-rose-400',
              },
            }[p.absorptionType];

            const BadgeIcon = typeBadge.icon;

            return (
              <div key={p.planId} className="p-4 hover:bg-surface/30 transition-colors space-y-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <BadgeIcon className={`w-5 h-5 ${typeBadge.color} shrink-0`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text text-sm">{p.planName}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface border border-steel-700 text-steel-300">
                          {p.tierName}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {p.monthlyPrice !== null ? `$${p.monthlyPrice}/mo` : 'Pay-As-You-Go API'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide border ${typeBadge.badge}`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      {typeBadge.label}
                    </span>

                    <div className="text-right min-w-[90px]">
                      <div className="text-sm font-mono font-bold text-text">
                        {p.absorptionScore}
                        <span className="text-xs text-text-muted font-normal">/100</span>
                      </div>
                      <div className="text-[10px] text-steel-400">Shield Score</div>
                    </div>

                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded border border-steel-700/60 hover:bg-surface text-steel-400 hover:text-text"
                      title="View pricing documentation"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="text-xs text-steel-300 bg-void-950/60 p-2.5 rounded border border-steel-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blood-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-text">{p.policySummary} </span>
                    <span className="text-text-muted">"{p.evidenceQuote}"</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
