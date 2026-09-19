import type { BudgetResult, CodingPlan } from '../../lib/types';
import { formatMillionTokens } from '../../lib/pricing';
import { getProviderColor } from '../../lib/pricing';

interface BudgetResultsProps {
  results: BudgetResult[];
  plans: CodingPlan[];
  budget: number;
}

export function BudgetResults({ results, plans, budget }: BudgetResultsProps) {
  const topModels = results.slice(0, 20);
  
  // Find plans that fit the budget or are slightly above (up to 20% more)
  const relevantPlans = plans.flatMap(plan => 
    (plan?.tiers || [])
      .filter(tier => tier.monthlyPrice !== null && tier.monthlyPrice <= budget * 1.2 && tier.monthlyPrice >= budget * 0.5)
      .map(tier => ({ plan, tier }))
  ).sort((a, b) => (a.tier.monthlyPrice || 0) - (b.tier.monthlyPrice || 0));

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return <span className="text-text-muted text-sm w-5 inline-block text-center">{index + 1}</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>API Models</span>
          <span className="text-xs font-normal text-text-muted bg-surface-alt px-2 py-0.5 rounded-full">Top 20</span>
        </h3>
        
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-alt border-b border-border text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium w-12">#</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium text-right">Tokens</th>
                  <th className="px-4 py-3 font-medium text-right">Code Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topModels.map((result, i) => (
                  <tr key={result.modelId} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="px-4 py-3">{getMedal(i)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text">{result.modelName}</div>
                      <div 
                        className="text-xs mt-0.5 font-medium"
                        style={{ color: getProviderColor(result.provider) }}
                      >
                        {result.provider}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-primary">
                      {formatMillionTokens(result.millionTokens)}
                    </td>
                    <td className="px-4 py-3 text-right text-text-muted">
                      {result.codingIndex ? result.codingIndex.toFixed(0) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Relevant Coding Plans</h3>
        
        {relevantPlans.length > 0 ? (
          <div className="grid gap-4">
            {relevantPlans.map(({ plan, tier }, i) => (
              <div key={`${plan.id}-${tier.name}-${i}`} className="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-text">{plan.name}</h4>
                    <span className="text-sm text-text-muted">{tier.name}</span>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    ${tier.monthlyPrice}/mo
                  </div>
                </div>
                
                {tier.estimatedTokenBudget && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Estimated Monthly Budget
                    </div>
                    <div className="text-sm font-medium text-text">
                      ~{formatMillionTokens(tier.estimatedTokenBudget.estimatedMillionTokens)} tokens
                    </div>
                    {tier.estimatedTokenBudget.description && (
                      <div className="text-xs text-text-muted mt-1 line-clamp-2">
                        {tier.estimatedTokenBudget.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-alt border border-border border-dashed rounded-xl p-8 text-center text-text-muted">
            No coding plans found strictly in this budget range.
          </div>
        )}
      </div>
    </div>
  );
}
