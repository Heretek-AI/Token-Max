import { useState, useMemo } from 'react';
import type { CodingPlan } from '../../lib/types';
import { 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  CreditCard, 
  Clock, 
  Search, 
  ExternalLink,
  Lock
} from 'lucide-react';

interface GotchaCardsProps {
  plans: CodingPlan[];
}

type GotchaCategory = 'all' | 'data-privacy' | 'ip-legal' | 'billing' | 'limits' | 'restrictions';

interface ParsedGotcha {
  planId: string;
  planName: string;
  planUrl: string;
  planCategory: string;
  text: string;
  category: GotchaCategory;
  severity: 'critical' | 'warning' | 'advisory';
}

export function GotchaCards({ plans }: GotchaCardsProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GotchaCategory>('all');

  const allGotchas: ParsedGotcha[] = useMemo(() => {
    return plans.flatMap(plan => 
      (plan?.gotchas || []).map(gotcha => {
        const lower = gotcha.toLowerCase();
        let cat: GotchaCategory = 'limits';
        let sev: 'critical' | 'warning' | 'advisory' = 'advisory';

        if (lower.includes('train') || lower.includes('data') || lower.includes('privacy') || lower.includes('telemetry') || lower.includes('human review')) {
          cat = 'data-privacy';
          sev = 'critical';
        } else if (lower.includes('ip') || lower.includes('indemnity') || lower.includes('legal') || lower.includes('copyright') || lower.includes('liability')) {
          cat = 'ip-legal';
          sev = 'warning';
        } else if (lower.includes('bill') || lower.includes('fee') || lower.includes('charge') || lower.includes('overage') || lower.includes('refund') || lower.includes('cost') || lower.includes('expire') || lower.includes('rate') || lower.includes('$')) {
          cat = 'billing';
          sev = lower.includes('in-arrears') || lower.includes('fee') || lower.includes('expire') ? 'warning' : 'advisory';
        } else if (lower.includes('ban') || lower.includes('suspend') || lower.includes('tool-only') || lower.includes('unauthorized') || lower.includes('error 1113') || lower.includes('lock-in')) {
          cat = 'restrictions';
          sev = 'critical';
        } else {
          cat = 'limits';
          sev = lower.includes('cooldown') || lower.includes('hard limit') || lower.includes('throttle') ? 'warning' : 'advisory';
        }

        return {
          planId: plan.id,
          planName: plan.name,
          planUrl: plan.url,
          planCategory: plan.category,
          text: gotcha,
          category: cat,
          severity: sev
        };
      })
    );
  }, [plans]);

  const filteredGotchas = useMemo(() => {
    return allGotchas.filter(g => {
      const matchesSearch = search === '' || 
        g.text.toLowerCase().includes(search.toLowerCase()) || 
        g.planName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || g.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allGotchas, search, selectedCategory]);

  const counts: Record<GotchaCategory, number> = useMemo(() => {
    return {
      all: allGotchas.length,
      'data-privacy': allGotchas.filter(g => g.category === 'data-privacy').length,
      'ip-legal': allGotchas.filter(g => g.category === 'ip-legal').length,
      'billing': allGotchas.filter(g => g.category === 'billing').length,
      'limits': allGotchas.filter(g => g.category === 'limits').length,
      'restrictions': allGotchas.filter(g => g.category === 'restrictions').length,
    };
  }, [allGotchas]);

  const categoryPills: { id: GotchaCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Gotchas', icon: <Info className="w-3.5 h-3.5" /> },
    { id: 'data-privacy', label: 'Data & Privacy', icon: <ShieldAlert className="w-3.5 h-3.5 text-danger" /> },
    { id: 'ip-legal', label: 'IP & Legal', icon: <AlertTriangle className="w-3.5 h-3.5 text-warning" /> },
    { id: 'billing', label: 'Billing & Overages', icon: <CreditCard className="w-3.5 h-3.5 text-primary" /> },
    { id: 'limits', label: 'Rolling Limits & Caps', icon: <Clock className="w-3.5 h-3.5 text-indigo-400" /> },
    { id: 'restrictions', label: 'Tool Bans & Lock-in', icon: <Lock className="w-3.5 h-3.5 text-rose-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search gotchas by keyword or provider name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1">
          {categoryPills.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedCategory(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                selectedCategory === p.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-border text-text-muted hover:text-text hover:border-border/80'
              }`}
            >
              {p.icon}
              <span>{p.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === p.id ? 'bg-white/20 text-white' : 'bg-surface-alt text-text-muted'
              }`}>
                {counts[p.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Gotchas Grid */}
      {filteredGotchas.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center text-text-muted">
          <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No gotchas found matching your filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGotchas.map((item, i) => {
            const isDanger = item.severity === 'critical';
            const isWarning = item.severity === 'warning';

            return (
              <div 
                key={i} 
                className={`p-4 rounded-xl border transition-all hover:shadow-sm flex flex-col justify-between ${
                  isDanger 
                    ? 'bg-danger/5 border-danger/25 hover:border-danger/40' 
                    : isWarning 
                    ? 'bg-warning/5 border-warning/25 hover:border-warning/40' 
                    : 'bg-surface border-border hover:border-primary/40'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-bold text-text truncate">
                        {item.planName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-alt text-text-muted border border-border uppercase tracking-wider font-semibold">
                        {item.planCategory.replace('-', ' ')}
                      </span>
                    </div>

                    <a 
                      href={item.planUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-text-muted hover:text-primary transition-colors shrink-0"
                      title="View provider pricing & terms"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Gotcha Text */}
                  <p className="text-xs leading-relaxed font-medium text-text mt-1">
                    {item.text}
                  </p>
                </div>

                {/* Footer Badges */}
                <div className="flex items-center justify-between mt-3 pt-2 text-[10px] text-text-muted border-t border-border/40">
                  <span className="capitalize font-medium flex items-center gap-1">
                    {item.category === 'data-privacy' && <ShieldAlert className="w-3 h-3 text-danger" />}
                    {item.category === 'ip-legal' && <AlertTriangle className="w-3 h-3 text-warning" />}
                    {item.category === 'billing' && <CreditCard className="w-3 h-3 text-primary" />}
                    {item.category === 'limits' && <Clock className="w-3 h-3 text-indigo-400" />}
                    {item.category === 'restrictions' && <Lock className="w-3 h-3 text-rose-500" />}
                    {item.category.replace('-', ' ')}
                  </span>
                  
                  <span className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isDanger 
                      ? 'bg-danger/15 text-danger' 
                      : isWarning 
                      ? 'bg-warning/15 text-warning' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
