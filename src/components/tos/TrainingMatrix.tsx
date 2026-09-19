import type { CodingPlan } from '../../lib/types';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface TrainingMatrixProps {
  plans: CodingPlan[];
}

export function TrainingMatrix({ plans }: TrainingMatrixProps) {
  // A simplistic mapping to categorize tiers
  const getTierLevel = (tierName: string, price: number | null) => {
    const n = tierName.toLowerCase();
    if (price === 0 || n.includes('free')) return 'free';
    if (n.includes('business') || n.includes('team') || n.includes('enterprise') || n.includes('corp')) return 'business';
    return 'individual';
  };

  // We determine training status. If the plan says "No", we assume safe. 
  // For the matrix, we assume Free tiers often train unless specified, Business rarely does, Individual varies.
  // This is a simplified display logic based on plan.dataTraining string.
  
  const getStatusIcon = (status: 'safe' | 'warn' | 'danger') => {
    if (status === 'safe') return <CheckCircle2 className="w-5 h-5 text-success mx-auto" />;
    if (status === 'danger') return <XCircle className="w-5 h-5 text-danger mx-auto" />;
    return <AlertCircle className="w-5 h-5 text-warning mx-auto" />;
  };

  const inferTierStatus = (plan: CodingPlan, level: 'free' | 'individual' | 'business') => {
    // If the whole plan explicitly says No training, all tiers are safe
    if (plan.dataTraining.toLowerCase().includes('no')) return 'safe';
    
    // Otherwise, we guess based on common patterns if not explicit
    if (level === 'business') return 'safe'; // Usually enterprise is opted out
    if (level === 'free') return 'danger'; // Usually free is opted in
    return 'warn'; // Individual requires opt-out usually
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mb-12">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt border-b border-border text-text-muted">
            <tr>
              <th className="px-6 py-4 font-medium">Service</th>
              <th className="px-6 py-4 font-medium text-center">Free Tier</th>
              <th className="px-6 py-4 font-medium text-center">Individual Paid</th>
              <th className="px-6 py-4 font-medium text-center">Business / Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plans.map((plan) => {
              const hasFree = plan.tiers.some(t => getTierLevel(t.name, t.monthlyPrice) === 'free');
              const hasIndiv = plan.tiers.some(t => getTierLevel(t.name, t.monthlyPrice) === 'individual');
              const hasBiz = plan.tiers.some(t => getTierLevel(t.name, t.monthlyPrice) === 'business');

              return (
                <tr key={plan.id} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-text">{plan.name}</div>
                    <div className="text-xs text-text-muted truncate max-w-[200px] mt-1" title={plan.dataTraining}>
                      {plan.dataTraining}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {hasFree ? getStatusIcon(inferTierStatus(plan, 'free')) : <span className="text-text-muted text-center block">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    {hasIndiv ? getStatusIcon(inferTierStatus(plan, 'individual')) : <span className="text-text-muted text-center block">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    {hasBiz ? getStatusIcon(inferTierStatus(plan, 'business')) : <span className="text-text-muted text-center block">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-surface-alt p-4 flex gap-6 justify-center text-xs text-text-muted border-t border-border">
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Default Opt-Out (Safe)</div>
        <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-warning" /> Requires Manual Opt-Out</div>
        <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-danger" /> Default Opt-In (Risk)</div>
      </div>
    </div>
  );
}
