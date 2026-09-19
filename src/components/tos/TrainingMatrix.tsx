import { useState, useMemo } from 'react';
import type { CodingPlan } from '../../lib/types';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Shield
} from 'lucide-react';

interface TrainingMatrixProps {
  plans: CodingPlan[];
}

export function TrainingMatrix({ plans }: TrainingMatrixProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | 'coding-ide' | 'coding-router' | 'api-provider'>('all');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchesSearch = search === '' || 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.dataTraining.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || p.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [plans, search, category]);

  // Determine IP indemnity badge
  const getIpIndemnityBadge = (ip: string | boolean) => {
    if (ip === true) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" /> Full Indemnity
        </span>
      );
    }
    if (typeof ip === 'string' && (ip.toLowerCase().includes('enterprise') || ip.toLowerCase().includes('team') || ip.toLowerCase().includes('business'))) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 px-2 py-1 rounded-md" title={ip}>
          <Shield className="w-3.5 h-3.5" /> Enterprise Only
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-text-muted bg-surface-alt px-2 py-1 rounded-md">
        <ShieldAlert className="w-3.5 h-3.5 opacity-50" /> None
      </span>
    );
  };

  // Determine Free tier training status
  const getFreeTierStatus = (plan: CodingPlan) => {
    const hasFreeTier = plan.tiers.some(t => t.monthlyPrice === 0 || t.name.toLowerCase().includes('free'));
    if (!hasFreeTier) return <span className="text-text-muted text-xs font-mono">—</span>;

    const lower = plan.dataTraining.toLowerCase();
    if (lower.includes('zero data retention') || lower.includes('zdr')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3" /> ZDR Safe
        </span>
      );
    }
    if (lower.includes('yes on free') || lower.includes('public repl') || lower.includes('opt-out required') || lower.includes('standard cloud terms')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger bg-danger/10 px-2 py-0.5 rounded" title="Free tier inputs used for model training or human review">
          <XCircle className="w-3 h-3" /> Trains Code
        </span>
      );
    }
    if (lower.includes('no') || lower.includes('does not train')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3" /> No Training
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded">
        <AlertCircle className="w-3 h-3" /> Opt-Out Req.
      </span>
    );
  };

  // Determine Paid Individual tier training status
  const getIndividualPaidStatus = (plan: CodingPlan) => {
    const lower = plan.dataTraining.toLowerCase();
    if (lower.includes('zero data retention') || lower.includes('zdr')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3" /> ZDR Safe
        </span>
      );
    }
    if (lower.includes('opt-out') || lower.includes('privacy mode') || lower.includes('opt out')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded" title="Must enable Privacy Mode or uncheck training in settings">
          <AlertCircle className="w-3 h-3" /> Opt-Out Setting
        </span>
      );
    }
    if (lower.includes('no') || lower.includes('excluded') || lower.includes('does not train')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3" /> No Training
        </span>
      );
    }
    if (lower.includes('yes')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger bg-danger/10 px-2 py-0.5 rounded">
          <XCircle className="w-3 h-3" /> Trains Code
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
        <CheckCircle2 className="w-3 h-3" /> Shielded
      </span>
    );
  };

  // Determine Business / Enterprise tier status
  const getEnterpriseStatus = () => {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded">
        <CheckCircle2 className="w-3 h-3" /> Zero Training
      </span>
    );
  };

  return (
    <div className="space-y-4 mb-12">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search provider privacy policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 grim-card grim-card-glow rounded-xl text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs font-semibold">
          <button
            onClick={() => setCategory('all')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${category === 'all' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text'}`}
          >
            All ({plans.length})
          </button>
          <button
            onClick={() => setCategory('coding-ide')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${category === 'coding-ide' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text'}`}
          >
            IDEs
          </button>
          <button
            onClick={() => setCategory('coding-router')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${category === 'coding-router' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text'}`}
          >
            Routers
          </button>
          <button
            onClick={() => setCategory('api-provider')}
            className={`px-2.5 py-1.5 rounded-lg transition-colors ${category === 'api-provider' ? 'bg-surface text-primary shadow-xs' : 'text-text-muted hover:text-text'}`}
          >
            APIs
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="grim-card grim-card-glow rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-alt border-b border-border text-text-muted text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Provider &amp; Plan</th>
                <th className="px-4 py-3.5 text-center">Free Tier</th>
                <th className="px-4 py-3.5 text-center">Paid Individual</th>
                <th className="px-4 py-3.5 text-center">Business / Enterprise</th>
                <th className="px-4 py-3.5 text-center">IP Indemnity</th>
                <th className="px-3 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPlans.map((plan) => {
                const isExpanded = expandedPlanId === plan.id;

                return (
                  <tr key={plan.id} className="hover:bg-surface-alt/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text text-sm">{plan.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-alt text-text-muted uppercase tracking-wider font-semibold border border-border">
                          {plan.category.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-1 truncate max-w-[280px]">
                        {plan.dataTraining}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {getFreeTierStatus(plan)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {getIndividualPaidStatus(plan)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {getEnterpriseStatus()}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {getIpIndemnityBadge(plan.ipIndemnity)}
                    </td>

                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                        className="p-1 rounded hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
                        title="Toggle legal fine print"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="bg-surface-alt p-3.5 flex flex-wrap gap-4 justify-center items-center text-xs text-text-muted border-t border-border">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" /> 
            <span><strong>ZDR / No Training:</strong> Code is strictly private &amp; excluded from model training</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-warning" /> 
            <span><strong>Opt-Out Setting:</strong> Telemetry/training active until user disables it in settings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-danger" /> 
            <span><strong>Trains Code:</strong> Free prompts/code indexed for model training or human review</span>
          </div>
        </div>
      </div>

      {/* Expanded Policy Drawer */}
      {expandedPlanId && (() => {
        const p = plans.find(x => x.id === expandedPlanId);
        if (!p) return null;
        return (
          <div className="bg-surface-alt/80 rounded-xl border border-border p-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text">
                {p.name} — Full Privacy &amp; IP Policy Highlights
              </h4>
              <a 
                href={p.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Official Pricing Page <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-surface p-3 rounded-lg border border-border">
                <span className="font-semibold text-text block mb-1">Data Retention &amp; Training:</span>
                <p className="text-text-muted leading-relaxed">{p.dataTraining}</p>
              </div>
              <div className="bg-surface p-3 rounded-lg border border-border">
                <span className="font-semibold text-text block mb-1">IP Indemnification Terms:</span>
                <p className="text-text-muted leading-relaxed">
                  {typeof p.ipIndemnity === 'string' ? p.ipIndemnity : (p.ipIndemnity ? 'Full legal IP indemnification covered for copyright infringement on generated code.' : 'No intellectual property indemnification provided on standard or individual subscription tiers.')}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
