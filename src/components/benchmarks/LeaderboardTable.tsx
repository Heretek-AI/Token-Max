import { useState, useMemo } from 'react';
import type { NormalizedModel } from '../../lib/types';
import { computeWeightedScore, computeValueScore } from '../../lib/pricing';
import { ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';

interface LeaderboardTableProps {
  models: NormalizedModel[];
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

interface LeaderboardHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  align?: 'left' | 'right';
}

function LeaderboardHeader({ label, sortKey, sortConfig, onSort, align = 'right' }: LeaderboardHeaderProps) {
  const getSortIcon = () => {
    if (!sortConfig || sortConfig.key !== sortKey) return <ArrowUpDown className="w-3 h-3 text-text-muted" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  return (
    <th 
      className={`px-4 py-3 font-medium cursor-pointer hover:bg-surface-alt/80 select-none group text-${align}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}>
        <span className="group-hover:text-primary transition-colors">{label}</span>
        {getSortIcon()}
      </div>
    </th>
  );
}

export function LeaderboardTable({ models }: LeaderboardTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'weighted', direction: 'desc' });

  const sortedModels = useMemo(() => {
    let sortableModels = models.filter(m => m.benchmarks.codingIndex !== null || m.benchmarks.intelligenceIndex !== null);
    
    sortableModels.sort((a, b) => {
      let aValue: number = 0;
      let bValue: number = 0;

      if (sortConfig?.key === 'intelligence') {
        aValue = a.benchmarks.intelligenceIndex ?? -1;
        bValue = b.benchmarks.intelligenceIndex ?? -1;
      } else if (sortConfig?.key === 'coding') {
        aValue = a.benchmarks.codingIndex ?? -1;
        bValue = b.benchmarks.codingIndex ?? -1;
      } else if (sortConfig?.key === 'agentic') {
        aValue = a.benchmarks.agenticIndex ?? -1;
        bValue = b.benchmarks.agenticIndex ?? -1;
      } else if (sortConfig?.key === 'weighted') {
        aValue = computeWeightedScore(a);
        bValue = computeWeightedScore(b);
      } else if (sortConfig?.key === 'cost') {
        aValue = a.blendedCost;
        bValue = b.blendedCost;
      } else if (sortConfig?.key === 'value') {
        aValue = computeValueScore(a);
        bValue = computeValueScore(b);
      }

      if (aValue < bValue) return sortConfig?.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig?.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortableModels;
  }, [models, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (key === 'cost') direction = 'asc'; // lowest cost is "best" initially
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="grim-card grim-card-glow rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="thead-sticky bg-surface-alt border-b border-border text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium w-12">Rank</th>
              <th className="px-4 py-3 font-medium">Model</th>
              <LeaderboardHeader label="Intelligence" sortKey="intelligence" sortConfig={sortConfig} onSort={requestSort} />
              <LeaderboardHeader label="Coding" sortKey="coding" sortConfig={sortConfig} onSort={requestSort} />
              <LeaderboardHeader label="Agentic" sortKey="agentic" sortConfig={sortConfig} onSort={requestSort} />
              <LeaderboardHeader label="Weighted Score" sortKey="weighted" sortConfig={sortConfig} onSort={requestSort} />
              <LeaderboardHeader label="Blended Cost" sortKey="cost" sortConfig={sortConfig} onSort={requestSort} />
              <LeaderboardHeader label="Value Score" sortKey="value" sortConfig={sortConfig} onSort={requestSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedModels.map((m, i) => (
              <tr key={m.id} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-4 py-3 text-text-muted font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-text">{m.name}</td>
                <td className="px-4 py-3 text-right">{m.benchmarks.intelligenceIndex?.toFixed(1) || '-'}</td>
                <td className="px-4 py-3 text-right">{m.benchmarks.codingIndex?.toFixed(1) || '-'}</td>
                <td className="px-4 py-3 text-right">{m.benchmarks.agenticIndex?.toFixed(1) || '-'}</td>
                <td className="px-4 py-3 text-right font-bold text-primary">{computeWeightedScore(m).toFixed(1)}</td>
                <td className="px-4 py-3 text-right">{m.blendedCost === 0 ? 'Free' : `$${m.blendedCost.toFixed(2)}`}</td>
                <td className="px-4 py-3 text-right font-medium">{computeValueScore(m) === Infinity ? '∞' : computeValueScore(m).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
