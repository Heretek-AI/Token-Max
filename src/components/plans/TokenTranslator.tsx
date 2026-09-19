import { useState, useMemo } from 'react';
import type { CodingPlan, NormalizedModel } from '../../lib/types';
import { formatMillionTokens, getProviderColor } from '../../lib/pricing';
import { ArrowRight, Sparkles, AlertCircle, Layers } from 'lucide-react';

interface TokenTranslatorProps {
  plans: CodingPlan[];
  models: NormalizedModel[];
}

export function TokenTranslator({ plans, models }: TokenTranslatorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('claude-code');
  const [selectedTierName, setSelectedTierName] = useState<string>('Pro');
  const [modelCategory, setModelCategory] = useState<'all' | 'frontier' | 'value'>('all');

  // Gather all tiers across ALL coding plans with a non-zero monthly price
  const allTiers = useMemo(() => {
    return plans
      .flatMap(p => (p?.tiers || []).map(t => ({ plan: p, tier: t })))
      .filter(x => x.tier.monthlyPrice !== null && x.tier.monthlyPrice > 0)
      .sort((a, b) => a.plan.name.localeCompare(b.plan.name) || (a.tier.monthlyPrice || 0) - (b.tier.monthlyPrice || 0));
  }, [plans]);

  // Group tiers by plan category for the select optgroups
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

  // Calculate token yields across models for this plan's exact price
  const topModels = useMemo(() => {
    if (!budget) return [];
    
    let filtered = models.filter(m => !m.isFree && !m.isBatch && m.blendedCost > 0);

    if (modelCategory === 'frontier') {
      filtered = filtered.filter(m => m.tierClass === 'frontier' || (m.benchmarks.codingIndex && m.benchmarks.codingIndex >= 70));
    } else if (modelCategory === 'value') {
      filtered = filtered.filter(m => m.benchmarks.codingIndex != null && m.benchmarks.codingIndex >= 40);
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
        if (modelCategory === 'frontier') {
          return (b.benchmarks.codingIndex || 0) - (a.benchmarks.codingIndex || 0);
        }
        if (modelCategory === 'value') {
          return (b.benchmarks.valueScore || 0) - (a.benchmarks.valueScore || 0);
        }
        return b.affordableTokens - a.affordableTokens;
      })
      .slice(0, 12);
  }, [models, budget, modelCategory]);

  if (allTiers.length === 0) return null;

  const categoryLabels: Record<string, string> = {
    'coding-ide': 'Coding IDEs & Agents (Cursor, Copilot, Claude Code...)',
    'coding-router': 'Coding Routers & Aggregators (CommandCode, OpenCode, Kilo...)',
    'api-provider': 'Direct APIs & Cloud Plans (Alibaba, MiniMax, BytePlus...)'
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-xl font-extrabold text-text">Token Budget Translator</h3>
          </div>
          <p className="text-sm text-text-muted">
            Select any coding subscription ({allTiers.length} tiers tracked) and see exactly what that monthly spend yields in direct API tokens.
          </p>
        </div>

        <div className="bg-surface-alt border border-border px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0">
          <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">Plan Spend:</span>
          <span className="text-2xl font-black text-primary">${budget}</span>
          <span className="text-xs text-text-muted font-medium">/mo</span>
        </div>
      </div>

      {/* Plan Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Select Subscription Plan:
          </label>
          <select 
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-text font-medium text-sm"
            value={`${activePlanId}|${activeTierName}`}
            onChange={(e) => {
              const [pId, tName] = e.target.value.split('|');
              setSelectedPlanId(pId);
              setSelectedTierName(tName);
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
            Compare Models:
          </label>
          <div className="flex bg-surface-alt p-1 rounded-xl border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModelCategory('all')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                modelCategory === 'all' 
                  ? 'bg-surface text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              All Models
            </button>
            <button
              type="button"
              onClick={() => setModelCategory('frontier')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                modelCategory === 'frontier' 
                  ? 'bg-surface text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Frontier
            </button>
            <button
              type="button"
              onClick={() => setModelCategory('value')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                modelCategory === 'value' 
                  ? 'bg-surface text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Best Value
            </button>
          </div>
        </div>
      </div>

      {/* Plan Native Context Callout */}
      {currentPlan && currentTier && (
        <div className="bg-surface-alt/70 rounded-xl border border-border p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-text text-sm flex items-center gap-2">
                <span>{currentPlan.name} ({currentTier.name})</span>
                <span className="text-[11px] font-normal text-text-muted">
                  {currentPlan.category === 'coding-ide' ? 'Coding IDE' : currentPlan.category === 'coding-router' ? 'API Router' : 'Cloud Plan'}
                </span>
              </div>
              <div className="text-text-muted mt-0.5">
                {currentTier.estimatedTokenBudget ? (
                  <span>Official/Estimated Allowance: <strong className="text-text">~{formatMillionTokens(currentTier.estimatedTokenBudget.estimatedMillionTokens)} tokens</strong> ({currentTier.estimatedTokenBudget.description})</span>
                ) : (
                  <span>Allowance: <strong className="text-text">{currentTier.notes || 'Metered by requests/concurrency'}</strong></span>
                )}
              </div>
            </div>
          </div>

          {currentPlan.gotchas && currentPlan.gotchas.length > 0 && (
            <div className="flex items-center gap-2 text-warning bg-warning/10 border border-warning/20 px-3 py-1.5 rounded-lg shrink-0 max-w-sm truncate">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate" title={currentPlan.gotchas[0]}>
                <strong>Gotcha:</strong> {currentPlan.gotchas[0]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Token Translation Cards */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span>Direct API Yield for ${budget}/mo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
          <span>Tokens &amp; Requests</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {topModels.map(m => (
            <div 
              key={m.id} 
              className="bg-surface p-3.5 rounded-xl border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
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
                <div className="text-xs font-bold text-text truncate mb-2" title={m.name}>
                  {m.name}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="text-xl font-black text-primary">
                  {formatMillionTokens(m.affordableTokens)}
                </div>
                <div className="text-[11px] text-text-muted flex justify-between mt-0.5 font-medium">
                  <span>~{Math.round(m.approximateRequests).toLocaleString()} reqs</span>
                  <span className="font-mono text-[10px]">${m.blendedCost.toFixed(2)}/M</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
