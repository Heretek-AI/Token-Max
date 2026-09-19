import type { CodingPlan } from '../../lib/types';
import { formatMillionTokens } from '../../lib/pricing';
import { AlertTriangle, Check, X } from 'lucide-react';

interface PlanDetailProps {
  plan: CodingPlan;
}

export function PlanDetail({ plan }: PlanDetailProps) {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">{plan.name} Detail</h2>
          <a href={plan.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium">
            Visit Website ↗
          </a>
        </div>
        <div className="text-xs text-text-muted bg-surface-alt px-3 py-1 rounded-full border border-border">
          Verified: {plan.lastVerified}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            TOS Gotchas
          </h3>
          <ul className="space-y-2 text-sm text-text-muted">
            {plan.gotchas.map((g, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-warning mt-0.5">•</span>
                <span>{g}</span>
              </li>
            ))}
            {plan.gotchas.length === 0 && (
              <li className="text-text-muted italic">No major gotchas noted.</li>
            )}
          </ul>
        </div>
        <div className="space-y-4">
          <div className="bg-surface-alt p-4 rounded-lg border border-border">
            <div className="text-sm font-semibold mb-1">Data Training</div>
            <div className="text-sm flex items-center gap-2">
              {plan.dataTraining.includes('No') ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-danger" />}
              {plan.dataTraining}
            </div>
          </div>
          <div className="bg-surface-alt p-4 rounded-lg border border-border">
            <div className="text-sm font-semibold mb-1">IP Indemnity</div>
            <div className="text-sm flex items-center gap-2">
              {plan.ipIndemnity ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-danger" />}
              {typeof plan.ipIndemnity === 'string' ? plan.ipIndemnity : (plan.ipIndemnity ? 'Provided' : 'Not Provided')}
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4">Tiers Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 font-semibold text-text-muted bg-surface-alt rounded-tl-lg">Tier</th>
              <th className="py-3 px-4 font-semibold text-text-muted bg-surface-alt">Price</th>
              <th className="py-3 px-4 font-semibold text-text-muted bg-surface-alt">Key Limits</th>
              <th className="py-3 px-4 font-semibold text-text-muted bg-surface-alt">Est. Tokens</th>
              <th className="py-3 px-4 font-semibold text-text-muted bg-surface-alt rounded-tr-lg">Models</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plan.tiers.map((tier, i) => (
              <tr key={i} className="hover:bg-surface-alt/30 transition-colors">
                <td className="py-4 px-4 font-medium text-text align-top">{tier.name}</td>
                <td className="py-4 px-4 align-top">
                  {tier.monthlyPrice !== null ? `$${tier.monthlyPrice}/mo` : 'Custom'}
                  {tier.annualPrice && <div className="text-xs text-text-muted mt-1">${tier.annualPrice}/mo (yearly)</div>}
                </td>
                <td className="py-4 px-4 align-top">
                  <ul className="list-disc list-inside space-y-1 text-xs text-text-muted">
                    {Object.entries(tier.limits).map(([k, v]) => (
                      <li key={k} className="capitalize">{k.replace(/([A-Z])/g, ' $1')}: {String(v)}</li>
                    ))}
                  </ul>
                </td>
                <td className="py-4 px-4 align-top">
                  {tier.estimatedTokenBudget ? (
                    <div>
                      <div className="font-semibold text-primary mb-1">
                        ~{formatMillionTokens(tier.estimatedTokenBudget.estimatedMillionTokens)}
                      </div>
                      <div className="text-xs text-text-muted leading-tight">
                        {tier.estimatedTokenBudget.description}
                      </div>
                    </div>
                  ) : (
                    <span className="text-text-muted italic">N/A</span>
                  )}
                </td>
                <td className="py-4 px-4 align-top">
                  {tier.models && tier.models.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tier.models.map(m => (
                        <span key={m} className="px-2 py-0.5 bg-surface-alt border border-border rounded text-xs">
                          {m}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-text-muted text-xs">Any supported</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
