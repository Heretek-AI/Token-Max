import { useState, useEffect } from 'react';
import type { CodingPlan } from '../lib/types';

export function usePlans() {
  const [plans, setPlans] = useState<CodingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/plans.json`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load plans'))
      .then(data => { setPlans(Array.isArray(data) ? data : data.plans || []); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  return { plans, loading, error };
}
