import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModels } from '../hooks/useModels';
import { usePlans } from '../hooks/usePlans';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  calculateAgentRequestCost,
  calculateTimeBlendedCost,
  calculatePoolDrain,
  formatMillionTokens,
  getProviderColor,
} from '../lib/pricing';
import { DEFAULT_CACHE_RATE } from '../lib/estimate-constants';
import type { NormalizedModel, WorkloadItem, CacheRate } from '../lib/types';
import {
  Sliders,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Share2,
  Check,
  TrendingDown,
  Layers,
  Rocket,
  Coins,
} from 'lucide-react';

interface MixEntry {
  modelId: string;
  tokensMillion: number;
}

const PRESETS: { name: string; description: string; entries: MixEntry[] }[] = [
  {
    name: 'Autonomous Agent Stack',
    description: '60% fast background workhorse + 30% reasoning architect + 10% deep refactor engine',
    entries: [
      { modelId: 'deepseek/deepseek-v4.1-flash', tokensMillion: 300 },
      { modelId: 'anthropic/claude-sonnet-5', tokensMillion: 150 },
      { modelId: 'anthropic/claude-opus-5', tokensMillion: 50 },
    ],
  },
  {
    name: 'Daily Driver Pair',
    description: '75% daily bulk edits + 25% frontier reasoning assistant',
    entries: [
      { modelId: 'deepseek/deepseek-v4.1-flash', tokensMillion: 150 },
      { modelId: 'anthropic/claude-sonnet-5', tokensMillion: 50 },
    ],
  },
  {
    name: 'Lean Open-Model Workhorse',
    description: 'Ultra cost-effective open router stack for continuous execution',
    entries: [
      { modelId: 'z-ai/glm-5.3-flash', tokensMillion: 140 },
      { modelId: 'deepseek/deepseek-v4.1-flash', tokensMillion: 60 },
    ],
  },
];

export default function MixOptimizer() {
  const { models, loading: modelsLoading } = useModels();
  const { plans, loading: plansLoading } = usePlans();
  const [searchParams] = useSearchParams();

  // Model catalog lookup map
  const modelMap = useMemo(() => {
    const map = new Map<string, NormalizedModel>();
    for (const m of models) {
      map.set(m.id.toLowerCase(), m);
    }
    return map;
  }, [models]);

  // State
  const [cacheRate, setCacheRate] = useState<CacheRate>(DEFAULT_CACHE_RATE);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [addTokens, setAddTokens] = useState<number>(50);
  const [copied, setCopied] = useState<boolean>(false);

  // Parse initial mix from searchParams or default to Autonomous Agent preset
  const [mix, setMix] = useState<MixEntry[]>(() => {
    const rawMix = searchParams.get('mix');
    if (rawMix) {
      try {
        const parts = rawMix.split(';');
        const parsed: MixEntry[] = [];
        for (const p of parts) {
          const [id, tok] = p.split(':');
          if (id && tok) parsed.push({ modelId: decodeURIComponent(id), tokensMillion: Number(tok) || 10 });
        }
        if (parsed.length > 0) return parsed;
      } catch {
        // fallback to preset
      }
    }
    return PRESETS[0].entries;
  });

  const handleShare = () => {
    const encodedMix = mix.map(e => `${encodeURIComponent(e.modelId)}:${e.tokensMillion}`).join(';');
    const shareUrl = `${window.location.origin}${window.location.pathname}#/optimizer?mix=${encodedMix}&cache=${cacheRate}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const totalTokensMillion = useMemo(() => {
    return mix.reduce((sum, e) => sum + e.tokensMillion, 0);
  }, [mix]);

  // Resolve mix items with live model pricing and direct cost
  const resolvedMix = useMemo(() => {
    return mix.map(entry => {
      const clean = entry.modelId.toLowerCase();
      const model = modelMap.get(clean) || models.find(m => m.id.toLowerCase().includes(clean) || m.name.toLowerCase().includes(clean)) || null;
      const effectiveName = model ? model.name : entry.modelId;
      const share = totalTokensMillion > 0 ? entry.tokensMillion / totalTokensMillion : 0;

      let costPpu = 0;
      let effectivePerM = 0;
      if (model) {
        const { effectiveBlendedCost } = calculateAgentRequestCost(model, cacheRate);
        const timeBlendedCost = calculateTimeBlendedCost({ ...model, blendedCost: effectiveBlendedCost });
        effectivePerM = timeBlendedCost;
        costPpu = entry.tokensMillion * timeBlendedCost;
      }

      return {
        ...entry,
        model,
        displayName: effectiveName,
        share,
        effectivePerM,
        costPpu,
      };
    });
  }, [mix, modelMap, models, totalTokensMillion, cacheRate]);

  const totalDirectCost = useMemo(() => {
    return resolvedMix.reduce((sum, item) => sum + item.costPpu, 0);
  }, [resolvedMix]);

  // Construct WorkloadItems for the pool drain engine
  const workloadItems: WorkloadItem[] = useMemo(() => {
    return resolvedMix.map(item => ({
      modelId: item.modelId,
      modelName: item.displayName,
      share: item.share,
      tokensMillion: item.tokensMillion,
      costPpu: item.costPpu,
    }));
  }, [resolvedMix]);

  // Run Pool Drain Engine across all 33 plans and all paid tiers
  const planRankings = useMemo(() => {
    if (workloadItems.length === 0 || totalTokensMillion === 0) return [];

    return plans
      .flatMap(plan =>
        (plan.tiers || [])
          .filter(t => t.monthlyPrice !== null && t.monthlyPrice > 0 && t.estimatedTokenBudget)
          .map(tier => {
            const drain = calculatePoolDrain(plan, tier, workloadItems, 'midpoint');
            return {
              plan,
              tier,
              drain,
              monthlyPrice: tier.monthlyPrice as number,
              totalCost: drain.totalPlanCost,
              overage: drain.overageCost,
              savings: totalDirectCost - drain.totalPlanCost,
              fitsZeroOverage: !drain.isCapped,
            };
          })
      )
      .sort((a, b) => a.totalCost - b.totalCost);
  }, [plans, workloadItems, totalTokensMillion, totalDirectCost]);

  if (modelsLoading || plansLoading) return <LoadingSpinner />;

  const bestPureSub = planRankings.find(r => r.fitsZeroOverage) || null;
  const cheapestOverall = planRankings[0] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <section className="relative text-center py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blood-900/60 text-blood-300 text-[11px] font-display font-semibold uppercase tracking-widest mb-3 border border-blood-700/50">
          <Sliders className="w-3.5 h-3.5 text-blood-400" />
          <span>Multi-Model Pool Exhaustion & Overage Optimizer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-text text-grim-title mb-2">
          Multi-Model <span className="text-blood-400">Mix Optimizer</span>
        </h1>
        <p className="text-sm text-text-muted max-w-2xl mx-auto">
          Configure an arbitrary agent pipeline across workhorse and frontier models. Our pool drain engine tests your mix
          against all 33 subscription plans to pinpoint the cheapest combination and exact API overages.
        </p>
      </section>

      {/* Presets & Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Presets:
          </span>
          {PRESETS.map(p => (
            <button
              key={p.name}
              onClick={() => setMix(p.entries)}
              className="px-3 py-1 rounded-lg border border-border bg-surface-alt hover:bg-surface text-xs font-medium text-text-muted hover:text-text transition-colors"
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-lg border border-border text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2">Cache:</span>
            {([0, 0.75, 0.9] as CacheRate[]).map(r => (
              <button
                key={r}
                onClick={() => setCacheRate(r)}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  cacheRate === r ? 'bg-surface text-text shadow-xs' : 'text-text-muted hover:text-text'
                }`}
              >
                {r === 0 ? '0%' : `${Math.round(r * 100)}%`}
              </button>
            ))}
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-alt hover:bg-surface text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5 text-primary" />}
            <span>{copied ? 'Copied!' : 'Share Mix'}</span>
          </button>
        </div>
      </div>

      {/* Mix Builder & Workload Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Selected Mix Table */}
        <div className="lg:col-span-2 border border-border rounded-2xl p-5 bg-surface shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Active Pipeline Mix ({mix.length} models)
            </h2>
            <span className="text-xs font-mono font-bold text-primary">
              Total: {formatMillionTokens(totalTokensMillion)} tokens/mo
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {resolvedMix.map((item, idx) => (
              <div key={`${item.modelId}-${idx}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.model ? getProviderColor(item.model.provider) : 'gray' }}
                    />
                    <span className="font-bold text-sm text-text truncate">{item.displayName}</span>
                    {item.model?.benchmarks?.codingIndex && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt border border-border text-text-muted font-mono">
                        {item.model.benchmarks.codingIndex} CI
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {(item.share * 100).toFixed(0)}% of workload · PPU rate ≈ ${item.effectivePerM.toFixed(3)}/M
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-text">{item.tokensMillion}M tokens</div>
                    <div className="text-[11px] text-text-muted font-mono">${item.costPpu.toFixed(2)}/mo PPU</div>
                  </div>
                  <button
                    onClick={() => setMix(mix.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-surface-alt transition-colors"
                    title="Remove model from mix"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Model to Mix Form */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedModelId}
              onChange={e => setSelectedModelId(e.target.value)}
              className="flex-1 text-xs bg-surface-alt border border-border rounded-xl px-3 py-2 text-text font-medium"
            >
              <option value="">-- Add another model to mix --</option>
              {models
                .filter(m => !m.isFree && m.blendedCost > 0)
                .slice(0, 100)
                .map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider}) — ${m.blendedCost.toFixed(2)}/M list
                  </option>
                ))}
            </select>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={1}
                max={2000}
                value={addTokens}
                onChange={e => setAddTokens(Math.max(1, Number(e.target.value)))}
                className="w-20 text-xs bg-surface-alt border border-border rounded-xl px-2 py-2 text-text font-mono text-center"
                placeholder="M tok"
              />
              <span className="text-xs text-text-muted">M</span>
              <button
                disabled={!selectedModelId}
                onClick={() => {
                  if (!selectedModelId) return;
                  setMix([...mix, { modelId: selectedModelId, tokensMillion: addTokens }]);
                  setSelectedModelId('');
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary text-surface font-bold text-xs hover:bg-primary-light disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Right: Key Economic Metrics Card */}
        <div className="border border-border rounded-2xl p-5 bg-surface shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-primary" /> Economic Summary
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-surface-alt/60 border border-border">
                <div className="text-[11px] text-text-muted uppercase font-bold tracking-wider">Benchmark Direct API</div>
                <div className="text-2xl font-black text-text font-mono mt-0.5">${totalDirectCost.toFixed(2)}<span className="text-xs text-text-muted font-normal">/mo</span></div>
                <div className="text-[11px] text-text-muted mt-0.5">100% pay-as-you-go across {mix.length} models</div>
              </div>

              {cheapestOverall && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/30">
                  <div className="text-[11px] text-primary uppercase font-bold tracking-wider flex items-center justify-between">
                    <span>Cheapest Overall Plan</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                      {cheapestOverall.fitsZeroOverage ? 'Zero Overage' : 'Hybrid + API'}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-primary font-mono mt-0.5">
                    ${cheapestOverall.totalCost.toFixed(2)}
                    <span className="text-xs text-text-muted font-normal">/mo</span>
                  </div>
                  <div className="text-xs font-bold text-text truncate mt-0.5">
                    {cheapestOverall.plan.name} · {cheapestOverall.tier.name}
                  </div>
                  <div className="text-[11px] text-success font-semibold mt-1">
                    Saves ${cheapestOverall.savings.toFixed(2)}/mo vs pure direct API
                  </div>
                </div>
              )}

              {bestPureSub && bestPureSub !== cheapestOverall && (
                <div className="p-3 rounded-xl bg-surface-alt/60 border border-border">
                  <div className="text-[11px] text-text-muted uppercase font-bold tracking-wider">
                    Best Pure Sub (Zero Overage)
                  </div>
                  <div className="text-xl font-black text-text font-mono mt-0.5">
                    ${bestPureSub.totalCost.toFixed(2)}
                    <span className="text-xs text-text-muted font-normal">/mo</span>
                  </div>
                  <div className="text-xs font-bold text-text truncate mt-0.5">
                    {bestPureSub.plan.name} · {bestPureSub.tier.name}
                  </div>
                  <div className="text-[11px] text-success font-semibold mt-1">
                    Saves ${bestPureSub.savings.toFixed(2)}/mo vs direct API
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-text-muted p-3 rounded-xl bg-surface-alt/40 border border-border">
            <span className="font-bold text-text">Pool Exhaustion Logic:</span> Drains monthly allowance sequentially across models. Overages are billed at pay-per-use rates.
          </div>
        </div>
      </div>

      {/* Ranked Plan Candidates */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" /> Ranked Subscription & Hybrid Options
          </h2>
          <span className="text-xs text-text-muted font-mono">
            {planRankings.length} qualifying plans evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planRankings.slice(0, 9).map((r, i) => (
            <div
              key={`${r.plan.id}-${r.tier.name}`}
              className={`border rounded-2xl p-4 bg-surface transition-all flex flex-col justify-between ${
                i === 0 ? 'border-primary shadow-[0_0_20px_hsl(0_70%_40%_/0.15)] ring-1 ring-primary/40' : 'border-border'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                      <span>#{i + 1}</span> · <span>{r.plan.name}</span>
                    </div>
                    <div className="text-base font-extrabold text-text">{r.tier.name}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      r.fitsZeroOverage
                        ? 'bg-success/10 text-success border border-success/30'
                        : 'bg-warning/10 text-warning border border-warning/30'
                    }`}
                  >
                    {r.fitsZeroOverage ? 'Full Fit' : `+${r.drain.poolUtilizedPercent}% drain`}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 my-2">
                  <span className="text-2xl font-black text-text font-mono">${r.totalCost.toFixed(2)}</span>
                  <span className="text-xs text-text-muted">/mo total</span>
                  {r.overage > 0 && (
                    <span className="text-[11px] text-text-muted font-mono">
                      (${r.monthlyPrice} base + ${r.overage.toFixed(2)} overage)
                    </span>
                  )}
                </div>

                {r.savings > 0 ? (
                  <div className="text-xs font-bold text-success flex items-center gap-1 mb-3">
                    <TrendingDown className="w-3.5 h-3.5" /> Saves ${r.savings.toFixed(2)}/mo vs Direct API
                  </div>
                ) : (
                  <div className="text-xs text-text-muted mb-3">
                    Direct API is ${Math.abs(r.savings).toFixed(2)}/mo cheaper
                  </div>
                )}

                <div className="text-[11px] text-text-muted space-y-1 pt-2 border-t border-border">
                  <div className="flex justify-between">
                    <span>Pool utilization:</span>
                    <span className="font-mono font-bold text-text">{r.drain.poolUtilizedPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Privacy policy:</span>
                    <span className="truncate max-w-[150px] font-medium text-text">{r.plan.dataTraining}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <a
                  href={r.plan.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Official pricing</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
