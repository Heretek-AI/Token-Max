import { useState, useMemo } from 'react';
import type { CodingPlan, NormalizedModel } from '../../lib/types';
import { formatMillionTokens } from '../../lib/pricing';

interface TokenTranslatorProps {
  plans: CodingPlan[];
  models: NormalizedModel[];
}

export function TokenTranslator({ plans, models }: TokenTranslatorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [selectedTierName, setSelectedTierName] = useState<string>('');

  const allTiers = useMemo(() => {
    return plans.flatMap(p => p.tiers.map(t => ({ plan: p, tier: t })))
      .filter(x => x.tier.estimatedTokenBudget !== null && x.tier.monthlyPrice !== null);
  }, [plans]);

  const activePlanId = selectedPlanId || (allTiers.length > 0 ? allTiers[0].plan.id : '');
  const activeTierName = selectedTierName || (allTiers.length > 0 ? allTiers[0].tier.name : '');

  const selectedData = allTiers.find(x => x.plan.id === activePlanId && x.tier.name === activeTierName) || allTiers[0];
  const budget = selectedData?.tier.monthlyPrice || 0;

  const topModels = useMemo(() => {
    if (!budget) return [];
    return models
      .filter(m => !m.isFree && !m.isBatch && m.blendedCost > 0)
      .map(m => ({
        ...m,
        affordableTokens: budget / m.blendedCost
      }))
      .sort((a, b) => b.affordableTokens - a.affordableTokens)
      .slice(0, 12);
  }, [models, budget]);

  if (allTiers.length === 0) return null;

  return (
    <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mb-8">
      <h3 className="text-lg font-bold text-text mb-4">Token Budget Translator</h3>
      <p className="text-sm text-text-muted mb-6">
        See how far a subscription's cost would go if spent directly on API tokens.
      </p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select 
          className="px-4 py-2 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-text flex-1"
          value={`${activePlanId}|${activeTierName}`}
          onChange={(e) => {
            const [pId, tName] = e.target.value.split('|');
            setSelectedPlanId(pId);
            setSelectedTierName(tName);
          }}
        >
          {allTiers.map(x => (
            <option key={`${x.plan.id}|${x.tier.name}`} value={`${x.plan.id}|${x.tier.name}`}>
              {x.plan.name} - {x.tier.name} (${x.tier.monthlyPrice}/mo)
            </option>
          ))}
        </select>
        
        <div className="px-6 py-2 bg-primary text-white rounded-lg font-bold flex items-center justify-center whitespace-nowrap">
          Budget: ${budget}/mo
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {topModels.map(m => (
          <div key={m.id} className="bg-surface p-3 rounded-lg border border-border flex flex-col justify-between shadow-sm">
            <div className="text-xs font-medium text-text-muted truncate mb-1" title={m.name}>{m.name}</div>
            <div className="text-lg font-bold text-primary">
              {formatMillionTokens(m.affordableTokens)}
            </div>
            <div className="text-[10px] text-text-muted mt-1">tokens / mo</div>
          </div>
        ))}
      </div>
    </div>
  );
}
