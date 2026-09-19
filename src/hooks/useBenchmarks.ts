import { useState, useEffect } from 'react';
import type { AABenchmark } from '../lib/types';

export function useBenchmarks() {
  const [benchmarks, setBenchmarks] = useState<AABenchmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/benchmarks.json`)
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(data => { setBenchmarks(Array.isArray(data) ? data : data.benchmarks || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { benchmarks, loading };
}
