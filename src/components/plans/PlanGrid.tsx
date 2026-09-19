import type { CodingPlan } from '../../lib/types';
import { Code2, Server, Globe, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface PlanGridProps {
  plans: CodingPlan[];
  onSelectPlan: (plan: CodingPlan) => void;
  selectedPlanId?: string;
}

export function PlanGrid({ plans, onSelectPlan, selectedPlanId }: PlanGridProps) {
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
      {plans.map(plan => (
        <div 
          key={plan.id}
          onClick={() => onSelectPlan(plan)}
          className={clsx(
            "bg-surface rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md",
            selectedPlanId === plan.id 
              ? "border-primary shadow-sm ring-1 ring-primary/50" 
              : "border-border hover:border-primary/50"
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-surface-alt flex items-center justify-center text-text-muted mb-2">
              <span className="font-bold text-xl">{plan.name.charAt(0)}</span>
            </div>
            {selectedPlanId === plan.id && (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            )}
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
              {plan.tiers?.[0]?.monthlyPrice === 0 ? 'Free' : `$${plan.tiers?.[0]?.monthlyPrice || 0}`}+
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
