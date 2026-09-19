import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DataFreshness() {
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/last-updated.json`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.timestamp) {
          const date = new Date(data.timestamp);
          setLastUpdated(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
        }
      })
      .catch(() => {});
  }, []);

  if (!lastUpdated) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-alt px-2.5 py-1 rounded-full border border-border">
      <Clock className="w-3.5 h-3.5" />
      <span>Updated: {lastUpdated}</span>
    </div>
  );
}
