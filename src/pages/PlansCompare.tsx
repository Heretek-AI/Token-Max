import { useState } from 'react';
import { usePlans } from '../hooks/usePlans';
import { useModels } from '../hooks/useModels';
import { PlanGrid } from '../components/plans/PlanGrid';
import { PlanDetail } from '../components/plans/PlanDetail';
import { PlanDiff } from '../components/plans/PlanDiff';
import { TokenTranslator } from '../components/plans/TokenTranslator';
import { SearchFilter } from '../components/shared/SearchFilter';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import type { CodingPlan } from '../lib/types';
import { Layers, ArrowUpRight, X } from 'lucide-react';

export default function PlansCompare() {
  const { plans, loading: plansLoading } = usePlans();
  const { models, loading: modelsLoading } = useModels();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<CodingPlan | null>(null);
  const [comparePlanIds, setComparePlanIds] = useState<string[]>([]);

  if (plansLoading || modelsLoading) return <LoadingSpinner />;

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'coding-ide', label: 'Coding IDEs' },
    { value: 'coding-router', label: 'Coding Routers' },
    { value: 'api-provider', label: 'API Providers' },
  ];

  const filteredPlans = plans.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleToggleCompare = (planId: string) => {
    setComparePlanIds(prev => {
      if (prev.includes(planId)) {
        return prev.filter(id => id !== planId);
      }
      if (prev.length >= 3) {
        // Keep the last 2 and append the new one
        return [...prev.slice(1), planId];
      }
      return [...prev, planId];
    });
  };

  const handleRemoveCompare = (planId: string) => {
    setComparePlanIds(prev => prev.filter(id => id !== planId));
  };

  const handleClearCompare = () => {
    setComparePlanIds([]);
  };

  const scrollToDiff = () => {
    const el = document.getElementById('plan-diff-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold mb-2 text-text">Compare Coding Plans</h1>
        <p className="text-text-muted text-sm max-w-2xl">
          Analyze pricing, true compute token yield, and fine-print gotchas across 33 AI coding tools. Select up to 3 plans for head-to-head comparison.
        </p>
      </div>

      <TokenTranslator plans={plans} models={models} />

      {/* Head-to-Head Side-by-Side Diff Section (visible when 2+ plans selected) */}
      <PlanDiff
        plans={plans}
        comparePlanIds={comparePlanIds}
        onRemovePlan={handleRemoveCompare}
        onClearAll={handleClearCompare}
      />

      <SearchFilter 
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        placeholder="Search plans by name..."
      />

      <PlanGrid 
        plans={filteredPlans} 
        onSelectPlan={(p) => setSelectedPlan(selectedPlan?.id === p.id ? null : p)}
        selectedPlanId={selectedPlan?.id}
        comparePlanIds={comparePlanIds}
        onToggleCompare={handleToggleCompare}
      />

      {selectedPlan && <PlanDetail plan={selectedPlan} />}

      {/* Floating Compare Action Bar */}
      {comparePlanIds.length > 0 && (
        <aside 
          aria-label="Plan comparison drawer"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-surface/95 backdrop-blur-md border border-primary/40 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200 max-w-[90vw]"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-bold text-text">{comparePlanIds.length} / 3</span>
              <span className="text-text-muted hidden sm:inline"> plans in compare queue</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {comparePlanIds.map(id => {
              const p = plans.find(x => x.id === id);
              if (!p) return null;
              return (
                <span 
                  key={id} 
                  className="px-2 py-1 bg-surface-alt border border-border rounded-lg text-xs font-semibold text-text flex items-center gap-1"
                >
                  <span className="truncate max-w-[90px]">{p.name}</span>
                  <button 
                    onClick={() => handleRemoveCompare(id)}
                    className="text-text-muted hover:text-danger"
                    title={`Remove ${p.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            {comparePlanIds.length >= 2 ? (
              <button
                onClick={scrollToDiff}
                className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
              >
                <span>View Diff</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-text-muted italic hidden md:inline">
                Select 1 more to view diff
              </span>
            )}

            <button
              onClick={handleClearCompare}
              className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-surface-alt transition-colors"
              title="Clear all selected"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
