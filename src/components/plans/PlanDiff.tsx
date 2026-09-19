import type { CodingPlan } from '../../lib/types';
import { classifyTraining, trainingBadge, getIndemnityInfo } from '../../lib/tos';
import { 
  X, 
  Check, 
  AlertTriangle, 
  ExternalLink, 
  Layers, 
  ShieldCheck, 
  Sparkles,
  Zap
} from 'lucide-react';

interface PlanDiffProps {
  plans: CodingPlan[];
  comparePlanIds: string[];
  onRemovePlan: (planId: string) => void;
  onClearAll: () => void;
}

export function PlanDiff({ plans, comparePlanIds, onRemovePlan, onClearAll }: PlanDiffProps) {
  const selectedPlans = plans.filter(p => comparePlanIds.includes(p.id));

  if (selectedPlans.length < 2) {
    return null;
  }

  const getPrimaryTier = (p: CodingPlan) => {
    // Find the first paid tier, or the first tier
    return p.tiers.find(t => t.monthlyPrice !== null && t.monthlyPrice > 0) || p.tiers[0];
  };

  return (
    <div id="plan-diff-section" className="bg-surface rounded-2xl border-2 border-primary/30 p-6 shadow-lg mb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-extrabold text-text">Head-to-Head Plan Comparison</h3>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Side-by-side specification, pricing, compute quotas, and fine-print diff for {selectedPlans.length} plans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted font-medium">
            {selectedPlans.length} / 3 selected
          </span>
          <button
            onClick={onClearAll}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
          >
            Clear Diff
          </button>
        </div>
      </div>

      {/* Side by Side Diff Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px] grid" style={{ gridTemplateColumns: `200px repeat(${selectedPlans.length}, minmax(240px, 1fr))` }}>
          {/* Header Row: Plan Identity */}
          <div className="p-3 font-bold text-xs uppercase tracking-wider text-text-muted self-end pb-4">
            Plan &amp; Provider
          </div>
          {selectedPlans.map(plan => (
            <div key={plan.id} className="p-3 bg-surface-alt/60 rounded-xl border border-border/80 relative flex flex-col justify-between m-1">
              <button
                onClick={() => onRemovePlan(plan.id)}
                className="absolute top-2 right-2 p-1 rounded-md text-text-muted hover:text-danger hover:bg-surface transition-colors"
                title="Remove from comparison"
              >
                <X className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10 w-fit block mb-1">
                  {plan.category.replace('-', ' ')}
                </span>
                <h4 className="font-extrabold text-lg text-text">{plan.name}</h4>
              </div>
              <a
                href={plan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium mt-2"
              >
                Official Site <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}

          {/* Row: Representative Paid Tier & Price */}
          <div className="p-3 font-semibold text-xs text-text border-t border-border flex items-center">
            Flagship Paid Tier
          </div>
          {selectedPlans.map(plan => {
            const tier = getPrimaryTier(plan);
            return (
              <div key={plan.id} className="p-3 border-t border-border m-1">
                <span className="font-bold text-sm text-text block">{tier.name}</span>
                <span className="text-xl font-black text-primary">
                  {tier.monthlyPrice === null ? 'PAYG' : tier.monthlyPrice === 0 ? 'Free' : `$${tier.monthlyPrice}`}
                </span>
                {tier.monthlyPrice !== null && tier.monthlyPrice > 0 && (
                  <span className="text-xs text-text-muted font-medium"> /month</span>
                )}
                {tier.annualPrice && (
                  <div className="text-[11px] text-text-muted mt-0.5">
                    ${tier.annualPrice}/yr (Save {Math.round((1 - tier.annualPrice / (tier.monthlyPrice! * 12)) * 100)}%)
                  </div>
                )}
              </div>
            );
          })}

          {/* Row: Stated / Derived Compute Budget */}
          <div className="p-3 font-semibold text-xs text-text border-t border-border flex items-center">
            Estimated Token Budget
          </div>
          {selectedPlans.map(plan => {
            const tier = getPrimaryTier(plan);
            const tb = tier.estimatedTokenBudget;
            return (
              <div key={plan.id} className="p-3 border-t border-border m-1 bg-primary/5 rounded-lg">
                <div className="text-base font-black text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>~{tb?.estimatedMillionTokens ?? '—'}M tokens</span>
                </div>
                <div className="text-[11px] text-text-muted mt-1 leading-snug">
                  {tb?.description || 'Based on standard developer volume'}
                </div>
              </div>
            );
          })}

          {/* Row: Native Quota Limits */}
          <div className="p-3 font-semibold text-xs text-text border-t border-border flex items-center">
            Key Limits &amp; Throttles
          </div>
          {selectedPlans.map(plan => {
            const tier = getPrimaryTier(plan);
            return (
              <div key={plan.id} className="p-3 border-t border-border m-1">
                <ul className="space-y-1.5 text-xs text-text-muted">
                  {Object.entries(tier.limits || {}).slice(0, 4).map(([k, v]) => (
                    <li key={k} className="flex items-start gap-1">
                      <Zap className="w-3 h-3 text-warning shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-text capitalize">
                          {k.replace(/([A-Z])/g, ' $1')}:
                        </span>{' '}
                        <span>{String(v)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Row: Supported Models */}
          <div className="p-3 font-semibold text-xs text-text border-t border-border flex items-center">
            Bundled Models
          </div>
          {selectedPlans.map(plan => {
            const tier = getPrimaryTier(plan);
            return (
              <div key={plan.id} className="p-3 border-t border-border m-1">
                <div className="flex flex-wrap gap-1">
                  {(tier.models || []).slice(0, 4).map(m => (
                    <span key={m} className="px-2 py-0.5 bg-surface-alt border border-border rounded text-[10px] font-medium text-text">
                      {m}
                    </span>
                  ))}
                  {(tier.models?.length || 0) > 4 && (
                    <span className="text-[10px] text-text-muted self-center">
                      +{(tier.models?.length || 0) - 4} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Row: Data Privacy & Training */}
          <div className="p-3 font-semibold text-xs text-text border-t border-border flex items-center">
            Data Training Policy
          </div>
          {selectedPlans.map(plan => {
            const trainingInfo = trainingBadge(classifyTraining(plan).individual);
            const isSafe = trainingInfo.tone === 'success';
            const isDanger = trainingInfo.tone === 'danger';
            return (
              <div key={plan.id} className="p-3 border-t border-border m-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isSafe ? 'text-success' : isDanger ? 'text-danger' : 'text-warning'}`} title={trainingInfo.title}>
                    {isSafe ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {isSafe ? 'Excluded from Training' : trainingInfo.label}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {plan.dataTraining}
                </p>
              </div>
            );
          })}

          {/* Row: IP Indemnification */}
          <div className="p-3 font-semibold text-xs text-text border-t border-border flex items-center">
            IP Indemnification
          </div>
          {selectedPlans.map(plan => {
            const indemnity = getIndemnityInfo(plan);
            return (
              <div key={plan.id} className="p-3 border-t border-border m-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${indemnity.tone === 'success' ? 'text-success' : indemnity.tone === 'warning' ? 'text-warning' : 'text-text-muted'}`} title={indemnity.description}>
                    <ShieldCheck className="w-3.5 h-3.5" /> {indemnity.label}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {indemnity.description}
                </p>
              </div>
            );
          })}

          {/* Row: Gotchas */}
          <div className="p-3 font-semibold text-xs text-text border-t border-border flex items-center">
            Top Provider Gotcha
          </div>
          {selectedPlans.map(plan => (
            <div key={plan.id} className="p-3 border-t border-border m-1 bg-warning/5 rounded-lg">
              <div className="text-[11px] text-warning font-semibold flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                <span>{plan.gotchas[0] || 'No critical gotchas noted.'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
