import { useState, useMemo } from 'react';
import type { NormalizedModel, BudgetSortMode } from '../lib/types';
import { calculateBudgetResults } from '../lib/pricing';

export function useBudget(models: NormalizedModel[]) {
  const [budget, setBudget] = useState(20);
  const [sortMode, setSortMode] = useState<BudgetSortMode>('best-value');

  const results = useMemo(
    () => calculateBudgetResults(models, budget, sortMode),
    [models, budget, sortMode]
  );

  return { budget, setBudget, sortMode, setSortMode, results };
}
