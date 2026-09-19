import type { CodingPlan } from '../../lib/types';
import { Code2, Server, Globe, CheckCircle2, Layers, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface PlanGridProps {
  plans: CodingPlan[];
  onSelectPlan: (plan: CodingPlan) => void;
  selectedPlanId?: string;
  comparePlanIds?: string[];
  onToggleCompare?: (planId: string) => void;
}

export function PlanGrid({ 
  plans, 
  onSelectPlan, 
  selectedPlanId,
  comparePlanIds = [],
  onToggleCompare
}: PlanGridProps) {
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'coding-ide': return <Code2 className="w-5 h-5" />;
      case 'api-provider': return <Server className="w-5 h-5" />;
      case 'coding-router': return <Globe className="w-5 h-5" />;
      default: return <Code2 className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map(plan => {
        const isCompared = comparePlanIds.includes(plan.id);

        return (
          <div 
            key={plan.id}
            onClick={() => onSelectPlan(plan)}
            className={clsx(
              "bg-surface rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md relative group",
              selectedPlanId === plan.id 
                ? "border-primary shadow-sm ring-1 ring-primary/50" 
                : isCompared
                ? "border-primary/60 bg-primary/2"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-surface-alt flex items-center justify-center text-text-muted mb-2">
                <span className="font-bold text-xl">{plan.name.charAt(0)}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {onToggleCompare && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCompare(plan.id);
                    }}
                    className={clsx(
                      "px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                      isCompared
                        ? "bg-primary text-white"
                        : "bg-surface-alt text-text-muted hover:text-text hover:bg-surface border border-border"
                    )}
                    title={isCompared ? "Remove from comparison" : "Add to comparison (up to 3)"}
                  >
                    {isCompared ? <Check className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
                    <span>{isCompared ? "Compared" : "+ Compare"}</span>
                  </button>
                )}

                {selectedPlanId === plan.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                )}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-text mb-1">{plan.name}</h3>
            
            <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted mb-4 bg-surface-alt px-2.5 py-1 rounded-full w-fit">
              {getCategoryIcon(plan.category)}
              <span>{getCategoryLabel(plan.category)}</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <span className="text-sm font-medium text-text-muted">
                {plan.tiers?.length || 0} Tier{(plan.tiers?.length || 0) === 1 ? '' : 's'}
              </span>
              <span className="text-sm font-bold text-text">
                {(() => {
                  const prices = (plan.tiers || []).map(t => t.monthlyPrice).filter((p): p is number => p !== null);
                  if (prices.length === 0) return 'Enterprise / Custom';
                  const minPrice = Math.min(...prices);
                  if (minPrice === 0) {
                    const hasPaid = prices.some(p => p > 0);
                    return hasPaid ? 'Free tier available' : 'Free';
                  }
                  return `$${minPrice}/mo+`;
                })()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
