import type { CodingPlan } from '../../lib/types';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface GotchaCardsProps {
  plans: CodingPlan[];
}

interface CardSectionProps {
  title: string;
  icon: React.ReactNode;
  items: { planName: string; text: string; severity: string }[];
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function CardSection({ title, icon, items, colorClass, bgClass, borderClass }: CardSectionProps) {
  if (items.length === 0) return null;
  return (
    <div className="mb-8">
      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${colorClass}`}>
        {icon}
        {title} ({items.length})
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div key={i} className={`p-4 rounded-xl border ${bgClass} ${borderClass}`}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">
              {item.planName}
            </div>
            <p className="text-sm font-medium">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GotchaCards({ plans }: GotchaCardsProps) {
  // Extract all gotchas from all plans and categorize them
  const gotchas = plans.flatMap(plan => 
    plan.gotchas.map(gotcha => {
      let severity: 'danger' | 'warning' | 'info' = 'info';
      if (gotcha.toLowerCase().includes('train') || gotcha.toLowerCase().includes('data')) severity = 'danger';
      else if (gotcha.toLowerCase().includes('ip') || gotcha.toLowerCase().includes('indemnity')) severity = 'warning';
      
      return { planName: plan.name, text: gotcha, severity };
    })
  );

  const dangerGotchas = gotchas.filter(g => g.severity === 'danger');
  const warningGotchas = gotchas.filter(g => g.severity === 'warning');
  const infoGotchas = gotchas.filter(g => g.severity === 'info');

  return (
    <div>
      <CardSection 
        title="Data & Privacy Risks" 
        icon={<ShieldAlert className="w-5 h-5" />} 
        items={dangerGotchas} 
        colorClass="text-danger"
        bgClass="bg-danger/5"
        borderClass="border-danger/20"
      />
      <CardSection 
        title="IP & Legal Gaps" 
        icon={<AlertTriangle className="w-5 h-5" />} 
        items={warningGotchas} 
        colorClass="text-warning"
        bgClass="bg-warning/5"
        borderClass="border-warning/20"
      />
      <CardSection 
        title="Hidden Limits & Costs" 
        icon={<Info className="w-5 h-5" />} 
        items={infoGotchas} 
        colorClass="text-primary"
        bgClass="bg-primary/5"
        borderClass="border-primary/20"
      />
    </div>
  );
}
