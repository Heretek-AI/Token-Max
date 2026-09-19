import type { BudgetResult, CodingPlan, BudgetSortMode } from '../../lib/types';
import { formatMillionTokens, getProviderColor } from '../../lib/pricing';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface BudgetResultsProps {
  results: BudgetResult[];
  plans: CodingPlan[];
  budget: number;
  sortMode: BudgetSortMode;
}

export function BudgetResults({ results, plans, budget, sortMode }: BudgetResultsProps) {
  const topModels = results.slice(0, 20);
  const featuredPick = topModels.length > 0 ? topModels[0] : null;
  
  // Find plans that fit the budget or are nearby
  const relevantPlans = plans.flatMap(plan => 
    (plan?.tiers || [])
      .filter(tier => tier.monthlyPrice !== null && tier.monthlyPrice <= budget * 1.25 && tier.monthlyPrice >= budget * 0.4)
      .map(tier => ({ plan, tier }))
  ).sort((a, b) => (a.tier.monthlyPrice || 0) - (b.tier.monthlyPrice || 0));

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return <span className="text-text-muted text-xs font-semibold w-5 inline-block text-center">{index + 1}</span>;
  };

  return (
    <div className="space-y-8">
      {/* Featured Callout Card */}
      {featuredPick && (
        <div className="bg-gradient-to-r from-primary/10 via-surface to-primary/5 rounded-xl border border-primary/30 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary/20 text-primary rounded-lg mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    #1 Top Recommendation for ${budget}/mo ({sortMode === 'best-value' ? 'Best Value' : sortMode === 'frontier' ? 'Top Frontier' : 'Max Volume'})
                  </span>
                </div>
                <h3 className="text-xl font-bold text-text mt-0.5">{featuredPick.modelName}</h3>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold uppercase" style={{ color: getProviderColor(featuredPick.provider) }}>
                    {featuredPick.provider}
                  </span>
                  <span>•</span>
                  <span>Blended Cost: ${featuredPick.blendedCost.toFixed(3)}/M tokens</span>
                  {featuredPick.codingIndex && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-semibold">Coding Index: {featuredPick.codingIndex.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 bg-surface px-4 py-2.5 rounded-lg border border-border">
              <div className="text-2xl font-black text-primary">
                ~{formatMillionTokens(featuredPick.millionTokens)}
              </div>
              <div className="text-xs text-text-muted font-medium">
                tokens / mo (~{Math.round(featuredPick.requests1k).toLocaleString()} reqs)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side by side: Models vs Coding Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: API Models */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text">
              <span>Pay-Per-Token API Models</span>
              <span className="text-xs font-normal text-text-muted bg-surface-alt px-2.5 py-0.5 rounded-full border border-border">
                Top 20
              </span>
            </h3>
            <span className="text-xs text-text-muted">
              {sortMode === 'best-value' && 'Ranked by Quality ÷ Cost'}
              {sortMode === 'frontier' && 'Ranked by Benchmark Score'}
              {sortMode === 'max-tokens' && 'Ranked by Total Volume'}
            </span>
          </div>
          
          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-alt border-b border-border text-text-muted">
                  <tr>
                    <th className="px-3 py-3 font-medium w-10 text-center">#</th>
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-3 py-3 font-medium text-right">Tokens</th>
                    <th className="px-3 py-3 font-medium text-right">Coding</th>
                    <th className="px-3 py-3 font-medium text-right">Cost/M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topModels.map((result, i) => (
                    <tr key={result.modelId} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="px-3 py-3 text-center">{getMedal(i)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text text-sm truncate max-w-[200px]" title={result.modelName}>
                          {result.modelName}
                        </div>
                        <div 
                          className="text-xs font-semibold capitalize"
                          style={{ color: getProviderColor(result.provider) }}
                        >
                          {result.provider}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-primary whitespace-nowrap">
                        {formatMillionTokens(result.millionTokens)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {result.codingIndex ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                            result.codingIndex >= 70 ? 'bg-primary/10 text-primary' : 'bg-surface-alt text-text'
                          }`}>
                            {result.codingIndex.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-text-muted font-mono whitespace-nowrap">
                        ${result.blendedCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Coding Plans */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-text">
              Subscriptions Near ${budget}/mo
            </h3>
            <span className="text-xs text-text-muted">
              {relevantPlans.length} plans available
            </span>
          </div>
          
          {relevantPlans.length > 0 ? (
            <div className="grid gap-3 max-h-[620px] overflow-y-auto pr-1">
              {relevantPlans.map(({ plan, tier }, i) => (
                <div key={`${plan.id}-${tier.name}-${i}`} className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-text">{plan.name}</h4>
                      <span className="text-xs font-medium text-text-muted bg-surface-alt px-2 py-0.5 rounded border border-border">
                        {tier.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-primary">
                        ${tier.monthlyPrice}/mo
                      </div>
                      {tier.annualPrice && (
                        <div className="text-[10px] text-text-muted">
                          (${tier.annualPrice}/yr)
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {tier.estimatedTokenBudget && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-text-muted">Estimated Compute Value:</span>
                        <span className="text-xs font-bold text-text">
                          ~{formatMillionTokens(tier.estimatedTokenBudget.estimatedMillionTokens)} tokens
                        </span>
                      </div>
                      {tier.estimatedTokenBudget.description && (
                        <p className="text-[11px] text-text-muted mt-1 leading-snug line-clamp-2">
                          {tier.estimatedTokenBudget.description}
                        </p>
                      )}
                    </div>
                  )}

                  {tier.limits && (
                    <div className="mt-2 text-[11px] text-text-muted flex gap-3 flex-wrap">
                      {Object.entries(tier.limits).slice(0, 2).map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          <span className="capitalize">{k}: {String(v)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-alt border border-border border-dashed rounded-xl p-8 text-center text-text-muted">
              No coding subscription tiers strictly centered at ${budget}/mo.
              <p className="text-xs mt-1">Try adjusting the slider to $10, $20, or $100.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
