import { useState, useMemo } from 'react';
import type { CodingPlan, NormalizedModel } from '../../lib/types';
import { formatMillionTokens, getProviderColor } from '../../lib/pricing';
import { ArrowRight, Sparkles, AlertCircle, Layers, CheckCircle2, HelpCircle, Info } from 'lucide-react';

interface TokenTranslatorProps {
  plans: CodingPlan[];
  models: NormalizedModel[];
}

export function TokenTranslator({ plans, models }: TokenTranslatorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('cursor');
  const [selectedTierName, setSelectedTierName] = useState<string>('Pro');
  const [modelCategory, setModelCategory] = useState<'plan-models' | 'frontier' | 'value'>('plan-models');

  // Gather all tiers across ALL coding plans with a non-zero monthly price
  const allTiers = useMemo(() => {
    return plans
      .flatMap(p => (p?.tiers || []).map(t => ({ plan: p, tier: t })))
      .filter(x => x.tier.monthlyPrice !== null && x.tier.monthlyPrice > 0)
      .sort((a, b) => a.plan.name.localeCompare(b.plan.name) || (a.tier.monthlyPrice || 0) - (b.tier.monthlyPrice || 0));
  }, [plans]);

  // Group tiers by plan category for select dropdown optgroups
  const groupedTiers = useMemo(() => {
    const groups: Record<string, typeof allTiers> = {
      'coding-ide': [],
      'coding-router': [],
      'api-provider': []
    };
    for (const item of allTiers) {
      const cat = item.plan.category || 'coding-ide';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [allTiers]);

  const activePlanId = selectedPlanId || (allTiers.length > 0 ? allTiers[0].plan.id : '');
  const activeTierName = selectedTierName || (allTiers.length > 0 ? allTiers[0].tier.name : '');

  const selectedData = allTiers.find(x => x.plan.id === activePlanId && x.tier.name === activeTierName) || allTiers[0];
  const budget = selectedData?.tier.monthlyPrice || 20;
  const currentPlan = selectedData?.plan;
  const currentTier = selectedData?.tier;

  // Filter out legacy, obsolete, or batch/free noise models
  const cleanModels = useMemo(() => {
    const excludedPatterns = [
      'nemo', 'granite', 'lunaris', 'hermes', 'gemma-1', 'llama-2', 'gpt-3.5',
      'claude-2', 'claude-1', 'gemini-1.0', 'gemini-1.5-flash-8b', 'command-r', 'dbrx'
    ];
    return models.filter(m => {
      if (m.isFree || m.isBatch || m.blendedCost <= 0) return false;
      const lower = m.id.toLowerCase();
      if (excludedPatterns.some(pat => lower.includes(pat))) return false;
      return true;
    });
  }, [models]);

  // Calculate matching models that correspond to the current plan's supported model list
  const matchingPlanModels = useMemo(() => {
    if (!currentTier?.models || currentTier.models.length === 0) return [];
    
    return cleanModels.filter(m => {
      return currentTier.models!.some(planModelName => {
        const normPlan = planModelName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normId = m.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normName.includes(normPlan) || normId.includes(normPlan) || normPlan.includes(normName);
      });
    });
  }, [cleanModels, currentTier]);

  // Calculate token yields across models for this plan's exact price
  const displayModels = useMemo(() => {
    if (!budget) return [];

    let filtered = cleanModels;

    if (modelCategory === 'plan-models') {
      if (matchingPlanModels.length > 0) {
        filtered = matchingPlanModels;
      } else {
        // Fallback to top frontier models if no exact match found
        filtered = cleanModels.filter(m => (m.benchmarks.codingIndex || 0) >= 65 || m.tierClass === 'frontier');
      }
    } else if (modelCategory === 'frontier') {
      filtered = cleanModels.filter(m => (m.benchmarks.codingIndex || 0) >= 65 || m.tierClass === 'frontier');
    } else if (modelCategory === 'value') {
      filtered = cleanModels.filter(m => (m.benchmarks.codingIndex || 0) >= 50 && m.blendedCost <= 6.0);
    }

    return filtered
      .map(m => {
        const affordableTokens = budget / m.blendedCost;
        const approximateRequests = (budget / (m.costPer1kRequests || 1)) * 1000;
        return {
          ...m,
          affordableTokens,
          approximateRequests
        };
      })
      .sort((a, b) => {
        if (modelCategory === 'value') {
          return (b.benchmarks.valueScore || 0) - (a.benchmarks.valueScore || 0);
        }
        if (modelCategory === 'frontier') {
          return (b.benchmarks.codingIndex || 0) - (a.benchmarks.codingIndex || 0);
        }
        return b.affordableTokens - a.affordableTokens;
      })
      .slice(0, 12);
  }, [cleanModels, budget, modelCategory, matchingPlanModels]);

  if (allTiers.length === 0) return null;

  const categoryLabels: Record<string, string> = {
    'coding-ide': 'Coding IDEs & Agents (Cursor, Copilot, Claude Code...)',
    'coding-router': 'Coding Routers & Aggregators (CommandCode, OpenCode, Kilo...)',
    'api-provider': 'Direct APIs & Cloud Plans (Alibaba, MiniMax, BytePlus...)'
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm mb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-xl font-extrabold text-text">Token Budget Translator</h3>
          </div>
          <p className="text-sm text-text-muted">
            Translate opaque subscription prices into real compute: compare what a plan gives you natively versus direct API equivalent tokens.
          </p>
        </div>

        <div className="bg-surface-alt border border-border px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0">
          <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Plan Spend:</span>
          <span className="text-2xl font-black text-primary">${budget}</span>
          <span className="text-xs text-text-muted font-medium">/mo</span>
        </div>
      </div>

      {/* Explanatory banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-xs text-text-muted flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-text font-semibold">How this comparison works: </strong>
          Coding tools (like Cursor, Copilot, or Claude Code) don't sell raw API tokens—they bundle curated models, completions, and proprietary credit pools.
          Below, we show <strong>(1) what your subscription actually includes</strong>, and <strong>(2) what your ${budget}/mo buys if you spent it directly on modern frontier API tokens</strong>.
        </div>
      </div>

      {/* Plan Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Select Subscription Plan to Translate:
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text font-medium text-sm"
            value={`${activePlanId}|${activeTierName}`}
            onChange={(e) => {
              const [pId, tName] = e.target.value.split('|');
              setSelectedPlanId(pId);
              setSelectedTierName(tName);
              // Set default tab back to plan-models when changing plans
              setModelCategory('plan-models');
            }}
          >
            {Object.entries(groupedTiers).map(([catKey, items]) => {
              if (items.length === 0) return null;
              return (
                <optgroup key={catKey} label={categoryLabels[catKey] || catKey}>
                  {items.map(x => (
                    <option key={`${x.plan.id}|${x.tier.name}`} value={`${x.plan.id}|${x.tier.name}`}>
                      {x.plan.name} — {x.tier.name} (${x.tier.monthlyPrice}/mo)
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {/* Model Filter Tabs */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            API Equivalent Filter:
          </label>
          <div className="flex bg-surface-alt p-1 rounded-xl border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModelCategory('plan-models')}
              className={`flex-1 py-2 px-1 rounded-lg transition-all text-center truncate ${
                modelCategory === 'plan-models' 
                  ? 'bg-surface text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text'
              }`}
              title="Compare with models offered by this plan"
            >
              Plan Models ({matchingPlanModels.length || 'Frontier'})
            </button>
            <button
              type="button"
              onClick={() => setModelCategory('frontier')}
              className={`flex-1 py-2 px-1 rounded-lg transition-all text-center truncate ${
                modelCategory === 'frontier' 
                  ? 'bg-surface text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text'
              }`}
              title="Top frontier reasoning models (Coding Index 65+)"
            >
              Frontier (65+)
            </button>
            <button
              type="button"
              onClick={() => setModelCategory('value')}
              className={`flex-1 py-2 px-1 rounded-lg transition-all text-center truncate ${
                modelCategory === 'value' 
                  ? 'bg-surface text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text'
              }`}
              title="High efficiency, low cost workhorses"
            >
              Best Value
            </button>
          </div>
        </div>
      </div>

      {/* Part 1: Plan Native Allowance & Included Models */}
      {currentPlan && currentTier && (
        <div className="bg-surface-alt/70 rounded-xl border border-border p-5 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-border/60">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-text text-base flex items-center gap-2">
                  <span>Part 1: What {currentPlan.name} ({currentTier.name}) Actually Delivers</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted font-normal">
                    ${budget}/mo
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Official native quotas, credit pools, and bundled models for this tier:
                </p>
              </div>
            </div>

            {currentTier.estimatedTokenBudget && (
              <div className="bg-surface px-3 py-2 rounded-lg border border-border/80 shrink-0">
                <div className="text-[11px] text-text-muted font-medium">Estimated Monthly Allowance:</div>
                <div className="text-sm font-bold text-primary">
                  {currentTier.estimatedTokenBudget.description}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Native Models Included */}
            <div className="bg-surface p-3.5 rounded-lg border border-border">
              <div className="font-semibold text-text mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Models Included in this Plan ({currentTier.models?.length || 0}):</span>
              </div>
              {currentTier.models && currentTier.models.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {currentTier.models.map(m => (
                    <span 
                      key={m} 
                      className="px-2 py-1 bg-surface-alt border border-border rounded-md text-[11px] font-medium text-text"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-text-muted italic">Any provider-supported model</span>
              )}
            </div>

            {/* Key Limits & Quota Rules */}
            <div className="bg-surface p-3.5 rounded-lg border border-border">
              <div className="font-semibold text-text mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>Key Plan Limits &amp; Quotas:</span>
              </div>
              <ul className="space-y-1 text-text-muted">
                {Object.entries(currentTier.limits).map(([k, v]) => (
                  <li key={k} className="flex items-start gap-1.5">
                    <span className="text-primary font-medium capitalize shrink-0">
                      {k.replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <span className="text-text font-medium">{String(v)}</span>
                  </li>
                ))}
              </ul>
              {currentPlan.gotchas && currentPlan.gotchas.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center gap-1.5 text-warning text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" title={currentPlan.gotchas[0]}>
                    <strong>Gotcha:</strong> {currentPlan.gotchas[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Part 2: Direct API Benchmark Comparison */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <span>Part 2: Direct API Equivalent Yield for ${budget}/mo</span>
              <ArrowRight className="w-3.5 h-3.5 text-primary" />
            </span>
            <span className="text-[11px] text-text-muted">
              (Frontier &amp; Workhorse LLMs only, no obsolete models)
            </span>
          </div>
          <span className="text-xs text-text-muted font-medium">
            Assuming 3:1 input:output token ratio
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayModels.map(m => (
            <div 
              key={m.id} 
              className="bg-surface p-3.5 rounded-xl border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span 
                    className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${getProviderColor(m.provider)}15`, color: getProviderColor(m.provider) }}
                  >
                    {m.provider}
                  </span>
                  {m.benchmarks?.codingIndex && (
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Code {m.benchmarks.codingIndex.toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-text truncate mb-1" title={m.name}>
                  {m.name}
                </div>
                <div className="text-[10px] text-text-muted font-mono mb-2">
                  ${m.blendedCost.toFixed(2)}/M blended
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xl font-black text-primary">
                  {formatMillionTokens(m.affordableTokens)}
                </div>
                <div className="text-[11px] text-text-muted flex justify-between mt-0.5 font-medium">
                  <span>~{Math.round(m.approximateRequests).toLocaleString()} reqs</span>
                  <span>tokens/mo</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
