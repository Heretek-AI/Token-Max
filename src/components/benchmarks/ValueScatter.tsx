import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import type { NormalizedModel } from '../../lib/types';
import { getProviderColor, computeWeightedScore } from '../../lib/pricing';

interface ValueScatterProps {
  models: NormalizedModel[];
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface p-3 border border-border rounded-lg shadow-lg">
        <p className="font-bold text-text mb-1">{data.name}</p>
        <p className="text-sm text-text-muted capitalize mb-2">{data.provider}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-text-muted">Cost:</span>
          <span className="font-medium text-right">${data.cost.toFixed(2)}/M</span>
          <span className="text-text-muted">Score:</span>
          <span className="font-medium text-right">{data.score.toFixed(1)}</span>
        </div>
      </div>
    );
  }
  return null;
}

export function ValueScatter({ models }: ValueScatterProps) {
  const data = models
    .filter(m => m.benchmarks.codingIndex !== null && m.blendedCost > 0 && !m.isBatch)
    .map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      cost: m.blendedCost,
      score: computeWeightedScore(m),
      fill: getProviderColor(m.provider),
    }))
    .filter(d => d.score > 0);

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm mb-8 h-[500px]">
      <h3 className="text-lg font-bold mb-1">Quality vs. Cost</h3>
      <p className="text-sm text-text-muted mb-6">Log scale. Higher and further left is better value.</p>
      
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            type="number" 
            dataKey="cost" 
            name="Cost" 
            scale="log" 
            domain={['auto', 'auto']}
            tickFormatter={(val) => `$${val}`}
            label={{ value: 'Blended Cost ($/1M Tokens)', position: 'insideBottom', offset: -10, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-text-muted)"
          />
          <YAxis 
            type="number" 
            dataKey="score" 
            name="Score" 
            domain={['auto', 100]}
            label={{ value: 'Weighted Benchmark Score', angle: -90, position: 'insideLeft', offset: 0, fill: 'var(--color-text-muted)' }}
            stroke="var(--color-text-muted)"
          />
          <ZAxis type="category" dataKey="name" name="Model" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Scatter name="Models" data={data} fill="#8884d8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
