import { useState } from 'react';
import { usePlans } from '../hooks/usePlans';
import { useModels } from '../hooks/useModels';
import { PlanGrid } from '../components/plans/PlanGrid';
import { PlanDetail } from '../components/plans/PlanDetail';
import { TokenTranslator } from '../components/plans/TokenTranslator';
import { SearchFilter } from '../components/shared/SearchFilter';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import type { CodingPlan } from '../lib/types';

export default function PlansCompare() {
  const { plans, loading: plansLoading } = usePlans();
  const { models, loading: modelsLoading } = useModels();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<CodingPlan | null>(null);

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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Compare Coding Plans</h1>
        <p className="text-text-muted">Analyze features, limits, and gotchas of popular AI coding tools.</p>
      </div>

      <TokenTranslator plans={plans} models={models} />

      <SearchFilter 
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        placeholder="Search plans..."
      />

      <PlanGrid 
        plans={filteredPlans} 
        onSelectPlan={(p) => setSelectedPlan(selectedPlan?.id === p.id ? null : p)}
        selectedPlanId={selectedPlan?.id}
      />

      {selectedPlan && <PlanDetail plan={selectedPlan} />}
    </div>
  );
}
