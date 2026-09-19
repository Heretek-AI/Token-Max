import { useModels } from '../hooks/useModels';
import { usePlans } from '../hooks/usePlans';
import { useBudget } from '../hooks/useBudget';
import { BudgetInput } from '../components/budget/BudgetInput';
import { BudgetResults } from '../components/budget/BudgetResults';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Database, CreditCard, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { models, loading: modelsLoading } = useModels();
  const { plans, loading: plansLoading } = usePlans();
  const { budget, setBudget, sortMode, setSortMode, results } = useBudget(models);

  if (modelsLoading || plansLoading) return <LoadingSpinner />;

  const freeModelsCount = models.filter(m => m.isFree || m.blendedCost === 0).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="text-center py-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-text">
          Maximize Your AI Token Budget
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          Compare API models against AI coding subscriptions to find the most cost-effective way to code with LLMs.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface p-6 rounded-xl border border-border flex items-start gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{models.length}</div>
            <div className="text-sm text-text-muted">API Models Tracked</div>
            <Link to="/models" className="text-xs text-primary hover:underline mt-1 inline-block">Explore Models →</Link>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border flex items-start gap-4">
          <div className="p-3 bg-success/10 text-success rounded-lg">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{plans.length}</div>
            <div className="text-sm text-text-muted">Coding Plans Analyzed</div>
            <Link to="/plans" className="text-xs text-primary hover:underline mt-1 inline-block">Compare Plans →</Link>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border flex items-start gap-4">
          <div className="p-3 bg-warning/10 text-warning rounded-lg">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{freeModelsCount}</div>
            <div className="text-sm text-text-muted">Free Models Available</div>
            <Link to="/models" className="text-xs text-primary hover:underline mt-1 inline-block">Find Free Models →</Link>
          </div>
        </div>
      </section>

      <section>
        <BudgetInput 
          budget={budget} 
          onChange={setBudget} 
          sortMode={sortMode} 
          onSortModeChange={setSortMode} 
        />
        <BudgetResults 
          results={results} 
          plans={plans} 
          budget={budget} 
          sortMode={sortMode} 
        />
      </section>
    </div>
  );
}
