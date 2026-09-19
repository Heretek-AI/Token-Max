import { useState, useEffect } from 'react';
import type { CodingPlan } from '../lib/types';

export function usePlans() {
  const [plans, setPlans] = useState<CodingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/plans.json`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load plans'))
      .then(data => {
        const rawList = Array.isArray(data) ? data : data.plans || [];
        const validPlans = rawList.filter((p: any) => p && p.id && Array.isArray(p.tiers));
        setPlans(validPlans);
        setLoading(false);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  return { plans, loading, error };
}
