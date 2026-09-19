import { useState } from 'react';
import { useModels } from '../hooks/useModels';
import { usePlans } from '../hooks/usePlans';
import { LabDecisionEngine } from '../components/budget/LabDecisionEngine';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Database, CreditCard, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { models, loading: modelsLoading } = useModels();
  const { plans, loading: plansLoading } = usePlans();
  const [budget, setBudget] = useState<number>(20);

  if (modelsLoading || plansLoading) return <LoadingSpinner />;

  const freeModelsCount = models.filter(m => m.isFree || m.blendedCost === 0).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="text-center py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3 border border-primary/20">
          <span>⚡ Unobfuscating AI Credits into True Compute</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 text-text">
          Direct APIs vs. Coding Subscriptions
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          Compare real compute yields for Anthropic, OpenAI, Google, DeepSeek, and Z.ai to find where your dollar gets the most intelligence.
        </p>
      </section>

      {/* Primary Feature: Frontier Intelligence Decision Engine */}
      <section>
        <LabDecisionEngine
          models={models}
          plans={plans}
          budget={budget}
          onBudgetChange={setBudget}
        />
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-surface p-6 rounded-xl border border-border flex items-start gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{models.length}</div>
            <div className="text-sm text-text-muted">API Models Tracked</div>
            <Link to="/models" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
              Explore 440+ Models Catalog <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border flex items-start gap-4">
          <div className="p-3 bg-success/10 text-success rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{plans.length}</div>
            <div className="text-sm text-text-muted">Coding Plans Analyzed</div>
            <Link to="/plans" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
              Compare All 33 Plans <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border flex items-start gap-4">
          <div className="p-3 bg-warning/10 text-warning rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{freeModelsCount}</div>
            <div className="text-sm text-text-muted">Free Models Available</div>
            <Link to="/models" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
              Find Free Models <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
