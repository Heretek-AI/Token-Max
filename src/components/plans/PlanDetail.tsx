import type { CodingPlan } from '../../lib/types';
import { formatMillionTokens } from '../../lib/pricing';
import { AlertTriangle, Check, X, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';

interface PlanDetailProps {
  plan: CodingPlan;
}

export function PlanDetail({ plan }: PlanDetailProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-text">{plan.name}</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
              {plan.category.replace('-', ' ')}
            </span>
          </div>
          <a 
            href={plan.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-medium mt-1"
          >
            <span>Official Website &amp; Documentation</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="text-xs text-text-muted bg-surface-alt px-3 py-1.5 rounded-xl border border-border self-start sm:self-auto">
          Last Verified: <strong className="text-text">{plan.lastVerified}</strong>
        </div>
      </div>

      {/* TOS and Security Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-alt/50 p-4 rounded-xl border border-border">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-text">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>Key Gotchas &amp; Caveats</span>
          </h3>
          <ul className="space-y-2 text-xs text-text-muted">
            {plan.gotchas.map((g, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-warning font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{g}</span>
              </li>
            ))}
            {plan.gotchas.length === 0 && (
              <li className="text-text-muted italic">No major gotchas noted.</li>
            )}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="bg-surface-alt/50 p-3.5 rounded-xl border border-border">
            <div className="text-xs font-bold text-text mb-1 flex items-center justify-between">
              <span>Data Training Policy</span>
              {plan.dataTraining.toLowerCase().includes('no') || plan.dataTraining.toLowerCase().includes('opt-out') ? (
                <span className="flex items-center gap-1 text-success text-[11px] font-semibold">
                  <Check className="w-3.5 h-3.5" /> Shielded / Opt-out
                </span>
              ) : (
                <span className="flex items-center gap-1 text-danger text-[11px] font-semibold">
                  <X className="w-3.5 h-3.5" /> Trains on code
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {plan.dataTraining}
            </p>
          </div>

          <div className="bg-surface-alt/50 p-3.5 rounded-xl border border-border">
            <div className="text-xs font-bold text-text mb-1 flex items-center justify-between">
              <span>Intellectual Property Indemnity</span>
              {plan.ipIndemnity ? (
                <span className="flex items-center gap-1 text-success text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Protected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-text-muted text-[11px] font-medium">
                  None on standard
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {typeof plan.ipIndemnity === 'string' ? plan.ipIndemnity : (plan.ipIndemnity ? 'IP Indemnity guaranteed by provider.' : 'No standard IP indemnification on individual plans.')}
            </p>
          </div>
        </div>
      </div>

      {/* Tiers Comparison Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-text flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Tiers &amp; Compute Quotas Comparison</span>
          </h3>
          <span className="text-xs text-text-muted">
            {plan.tiers.length} subscription {plan.tiers.length === 1 ? 'tier' : 'tiers'} available
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface-alt">
                <th className="py-3 px-4 font-bold text-text uppercase tracking-wider w-32">Tier</th>
                <th className="py-3 px-4 font-bold text-text uppercase tracking-wider w-28">Price</th>
                <th className="py-3 px-4 font-bold text-text uppercase tracking-wider min-w-[200px]">Key Limits</th>
                <th className="py-3 px-4 font-bold text-text uppercase tracking-wider min-w-[200px]">Est. Monthly Tokens</th>
                <th className="py-3 px-4 font-bold text-text uppercase tracking-wider min-w-[220px]">Models Included</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {plan.tiers.map((tier, i) => (
                <tr key={i} className="hover:bg-surface-alt/40 transition-colors">
                  {/* Tier Name */}
                  <td className="py-4 px-4 font-bold text-text align-top">
                    <div className="text-sm text-text font-black">{tier.name}</div>
                    {tier.notes && (
                      <div className="text-[11px] text-text-muted font-normal mt-1 leading-tight">
                        {tier.notes}
                      </div>
                    )}
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 align-top">
                    <div className="text-base font-extrabold text-text">
                      {tier.monthlyPrice !== null ? `$${tier.monthlyPrice}` : 'Custom'}
                      {tier.monthlyPrice !== null && <span className="text-xs font-normal text-text-muted">/mo</span>}
                    </div>
                    {tier.annualPrice && (
                      <div className="text-[11px] text-text-muted mt-0.5">
                        ${tier.annualPrice}/yr billed yearly
                      </div>
                    )}
                  </td>

                  {/* Key Limits */}
                  <td className="py-4 px-4 align-top">
                    {tier.limits && Object.keys(tier.limits).length > 0 ? (
                      <ul className="space-y-1.5">
                        {Object.entries(tier.limits).map(([k, v]) => (
                          <li key={k} className="flex items-start gap-1 leading-tight">
                            <span className="font-semibold text-text capitalize shrink-0">
                              {k.replace(/([A-Z])/g, ' $1')}:
                            </span>
                            <span className="text-text-muted font-medium">{String(v)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-text-muted italic">Standard provider limits</span>
                    )}
                  </td>

                  {/* Est. Tokens */}
                  <td className="py-4 px-4 align-top">
                    {tier.estimatedTokenBudget ? (
                      <div>
                        <div className="text-sm font-black text-primary mb-0.5">
                          ~{formatMillionTokens(tier.estimatedTokenBudget.estimatedMillionTokens)} tokens
                        </div>
                        <div className="text-xs font-medium text-text leading-tight mb-1">
                          {tier.estimatedTokenBudget.description}
                        </div>
                        {tier.estimatedTokenBudget.assumptions && (
                          <div className="text-[11px] text-text-muted leading-tight italic">
                            Assumes: {tier.estimatedTokenBudget.assumptions}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-muted italic">Metered / BYOK</span>
                    )}
                  </td>

                  {/* Models */}
                  <td className="py-4 px-4 align-top">
                    {tier.models && tier.models.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tier.models.map(m => (
                          <span 
                            key={m} 
                            className="px-2 py-0.5 bg-surface-alt border border-border/80 rounded-md text-[11px] font-medium text-text shadow-xs"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-text-muted italic">Any supported model</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
