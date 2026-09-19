import { useModels } from '../hooks/useModels';
import { usePlans } from '../hooks/usePlans';
import { LabDecisionEngine } from '../components/budget/LabDecisionEngine';
import { WorkflowCalculator } from '../components/budget/WorkflowCalculator';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useQueryState } from '../hooks/useQueryState';
import { Database, CreditCard, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { models, loading: modelsLoading } = useModels();
  const { plans, loading: plansLoading } = usePlans();
  const [budget, setBudget] = useQueryState<number>('b', 20);

  function scrollToEngine() {
    const el = document.getElementById('decision-engine');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (modelsLoading || plansLoading) return <LoadingSpinner />;

  const freeModelsCount = models.filter(m => m.isFree || m.blendedCost === 0).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative text-center py-10">
        <div className="pointer-events-none absolute inset-0 mx-auto max-w-3xl bg-circuit-dark opacity-40 blur-[1px]" aria-hidden="true" />
        <div className="relative">
          <img
            src="logo-web.png"
            alt="Token-Max by Heretek-AI"
            className="h-36 sm:h-44 mx-auto mb-4 animate-heretic-glow drop-shadow-[0_0_24px_hsl(0_75%_35%_/0.35)]"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blood-900/60 text-blood-300 text-[11px] font-display font-semibold uppercase tracking-widest mb-4 border border-blood-700/50 animate-binary-flicker">
            <span>⚡ Unobfuscating AI Credits into True Compute</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 text-text text-grim-title animate-glitch-text drop-shadow-[0_0_18px_hsl(0_75%_35%_/0.35)]">
            Direct APIs vs.{' '}
            <span className="text-blood-400">Coding Subscriptions</span>
          </h1>
          <p className="text-base text-text-muted max-w-2xl mx-auto">
            Compare real compute yields for Anthropic, OpenAI, Google, DeepSeek, and Z.ai to find where your dollar gets the most intelligence.
          </p>
          <button
            type="button"
            onClick={scrollToEngine}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary/90 hover:bg-primary text-void-950 font-bold text-sm tracking-wide shadow-[0_0_16px_hsl(0_70%_40%_/0.3)] transition-all hover:shadow-[0_0_24px_hsl(0_75%_45%_/0.45)]"
          >
            Start with your budget
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Primary Feature: Frontier Intelligence Decision Engine */}
      <section id="decision-engine" className="scroll-mt-20">
        <LabDecisionEngine
          models={models}
          plans={plans}
          budget={budget}
          onBudgetChange={setBudget}
        />
      </section>

      {/* Secondary Feature: Developer Workflow Breakeven Calculator */}
      <section>
        <WorkflowCalculator models={models} plans={plans} />
      </section>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="grim-card grim-card-glow p-6 rounded-xl flex items-start gap-4 hover:border-blood-600/60 hover:shadow-[0_0_18px_hsl(0_70%_35%_/0.25)]">
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
        
        <div className="grim-card grim-card-glow p-6 rounded-xl flex items-start gap-4 hover:border-blood-600/60 hover:shadow-[0_0_18px_hsl(0_70%_35%_/0.25)]">
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

        <div className="grim-card grim-card-glow p-6 rounded-xl flex items-start gap-4 hover:border-blood-600/60 hover:shadow-[0_0_18px_hsl(0_70%_35%_/0.25)]">
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
