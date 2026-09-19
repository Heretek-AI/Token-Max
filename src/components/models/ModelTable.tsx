import { useState, useMemo } from 'react';
import type { NormalizedModel } from '../../lib/types';
import { PricingBadge } from './PricingBadge';
import { getProviderColor, computeValueScore } from '../../lib/pricing';
import { ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';

interface ModelTableProps {
  models: NormalizedModel[];
}

type SortKey = keyof NormalizedModel | 'codingIndex' | 'valueScore' | 'input' | 'output';

type SortConfig = {
  key: SortKey;
  direction: 'asc' | 'desc';
} | null;

interface TableHeaderProps {
  label: string;
  sortKey: SortKey;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}

function TableHeader({ label, sortKey, sortConfig, onSort, align = 'left' }: TableHeaderProps) {
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

export function ModelTable({ models }: ModelTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const sortedModels = useMemo(() => {
    let sortableModels = [...models];
    if (sortConfig !== null) {
      sortableModels.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'codingIndex') {
          aValue = a.benchmarks.codingIndex ?? -1;
          bValue = b.benchmarks.codingIndex ?? -1;
        } else if (sortConfig.key === 'valueScore') {
          aValue = computeValueScore(a);
          bValue = computeValueScore(b);
        } else if (sortConfig.key === 'input') {
          aValue = a.pricing.input;
          bValue = b.pricing.input;
        } else if (sortConfig.key === 'output') {
          aValue = a.pricing.output;
          bValue = b.pricing.output;
        } else {
          aValue = a[sortConfig.key as keyof NormalizedModel];
          bValue = b[sortConfig.key as keyof NormalizedModel];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableModels;
  }, [models, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'desc'; // default to desc for most things
    if (key === 'name' || key === 'provider') direction = 'asc';
    
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
          <thead className="bg-surface-alt border-b border-border text-text-muted">
            <tr>
              <TableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={requestSort} />
              <TableHeader label="Provider" sortKey="provider" sortConfig={sortConfig} onSort={requestSort} />
              <TableHeader label="Input $/M" sortKey="input" sortConfig={sortConfig} onSort={requestSort} align="right" />
              <TableHeader label="Output $/M" sortKey="output" sortConfig={sortConfig} onSort={requestSort} align="right" />
              <TableHeader label="Blended $/M" sortKey="blendedCost" sortConfig={sortConfig} onSort={requestSort} align="right" />
              <TableHeader label="Context" sortKey="contextWindow" sortConfig={sortConfig} onSort={requestSort} align="right" />
              <TableHeader label="Coding Index" sortKey="codingIndex" sortConfig={sortConfig} onSort={requestSort} align="right" />
              <TableHeader label="Value Score" sortKey="valueScore" sortConfig={sortConfig} onSort={requestSort} align="right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedModels.map((m) => (
              <tr key={m.id} className="hover:bg-surface-alt/50 transition-colors">
                <td className="px-4 py-3 font-medium text-text">{m.name}</td>
                <td className="px-4 py-3">
                  <span 
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${getProviderColor(m.provider)}20`,
                      color: getProviderColor(m.provider)
                    }}
                  >
                    {m.provider}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <PricingBadge price={m.pricing.input} />
                </td>
                <td className="px-4 py-3 text-right">
                  <PricingBadge price={m.pricing.output} />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {m.blendedCost === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    `$${m.blendedCost.toFixed(2)}`
                  )}
                </td>
                <td className="px-4 py-3 text-right text-text-muted">
                  {(m.contextWindow / 1000).toFixed(0)}K
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {m.benchmarks.codingIndex ? m.benchmarks.codingIndex.toFixed(0) : '-'}
                </td>
                <td className="px-4 py-3 text-right text-primary font-bold">
                  {computeValueScore(m) === Infinity ? '∞' : computeValueScore(m).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
