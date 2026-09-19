import type { NormalizedModel, BudgetResult, BudgetSortMode } from './types';

export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  if (price < 0.01) return `$${price.toFixed(4)}`;
  if (price < 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

export function formatMillionTokens(mt: number): string {
  if (mt >= 1000) return `${(mt / 1000).toFixed(1)}B`;
  if (mt >= 1) return `${mt.toFixed(1)}M`;
  return `${(mt * 1000).toFixed(0)}K`;
}

export function calculateBudgetResults(
  models: NormalizedModel[],
  budget: number,
  sortMode: BudgetSortMode = 'best-value'
): BudgetResult[] {
  const eligible = models
    .filter(m => !m.isFree && !m.isBatch && m.blendedCost > 0)
    .map(m => {
      const codingIndex = m.benchmarks?.codingIndex ?? null;
      const intelligenceIndex = m.benchmarks?.intelligenceIndex ?? null;
      const valueScore = codingIndex != null && m.blendedCost > 0 
        ? (codingIndex / m.blendedCost) * 10 
        : null;

      return {
        modelId: m.id,
        modelName: m.name,
        provider: m.provider,
        millionTokens: budget / m.blendedCost,
        requests1k: (budget / (m.costPer1kRequests || 1)) * 1000,
        codingIndex,
        intelligenceIndex,
        valueScore,
        blendedCost: m.blendedCost,
        tierClass: m.tierClass || 'balanced',
      };
    });

  if (sortMode === 'frontier') {
    // Rank pure coding capability (Coding Index first, then Intelligence Index)
    return eligible
      .filter(m => m.tierClass === 'frontier' || (m.codingIndex && m.codingIndex >= 70))
      .sort((a, b) => {
        const scoreA = a.codingIndex ?? a.intelligenceIndex ?? 0;
        const scoreB = b.codingIndex ?? b.intelligenceIndex ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.blendedCost - b.blendedCost;
      });
  }

  if (sortMode === 'best-value') {
    // Rank quality per dollar, prioritizing models with strong verified coding scores
    return eligible
      .filter(m => m.codingIndex != null && m.codingIndex >= 40)
      .sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0));
  }

  // max-tokens (raw token volume)
  return eligible.sort((a, b) => b.millionTokens - a.millionTokens);
}

export function computeWeightedScore(model: NormalizedModel): number {
  const weights = {
    codingIndex: 0.35,
    agenticIndex: 0.30,
    intelligenceIndex: 0.25,
  };
  const b = model.benchmarks;
  let score = 0;
  let totalWeight = 0;
  if (b.codingIndex != null) { score += b.codingIndex * weights.codingIndex; totalWeight += weights.codingIndex; }
  if (b.agenticIndex != null) { score += b.agenticIndex * weights.agenticIndex; totalWeight += weights.agenticIndex; }
  if (b.intelligenceIndex != null) { score += b.intelligenceIndex * weights.intelligenceIndex; totalWeight += weights.intelligenceIndex; }
  return totalWeight > 0 ? score / totalWeight : 0;
}

export function computeValueScore(model: NormalizedModel): number {
  const quality = computeWeightedScore(model);
  const cost = model.blendedCost;
  if (cost === 0) return Infinity;
  return (quality / cost) * 100;
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    openai: '#10a37f',
    anthropic: '#d4a27f',
    google: '#4285f4',
    meta: '#0668E1',
    deepseek: '#536dfe',
    qwen: '#ff6f00',
    mistral: '#ff7000',
    'together-ai': '#6366f1',
    groq: '#f97316',
    fireworks: '#ef4444',
    inception: '#8b5cf6',
    sakana: '#06b6d4',
  };
  return colors[provider] || '#94a3b8';
}
