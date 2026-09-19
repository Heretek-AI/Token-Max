import { useState, useEffect } from 'react';
import type { NormalizedModel } from '../lib/types';

export function useModels() {
  const [models, setModels] = useState<NormalizedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/models.json`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load models'))
      .then(data => { setModels(Array.isArray(data) ? data : data.models || []); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  return { models, loading, error };
}
