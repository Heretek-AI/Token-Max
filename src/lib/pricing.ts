import type { 
  NormalizedModel, 
  BudgetResult, 
  BudgetSortMode,
  FrontierLab,
  CodingPlan,
  PlanTier,
  ApplesToApplesOption
} from './types';

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
    'z-ai': '#0256FF',
    '~z-ai': '#0256FF',
  };
  return colors[provider] || '#94a3b8';
}

export function detectModelLab(model: NormalizedModel): FrontierLab {
  const id = model.id.toLowerCase();
  const prov = model.provider.toLowerCase();
  if (prov.includes('anthropic') || id.includes('claude') || id.includes('anthropic')) return 'anthropic';
  if (prov.includes('openai') || id.includes('openai') || id.includes('gpt') || id.includes('codex') || id.includes('o1') || id.includes('o3') || id.includes('o4')) return 'openai';
  if (prov.includes('google') || id.includes('gemini') || id.includes('google')) return 'google';
  if (prov.includes('deepseek') || id.includes('deepseek')) return 'deepseek';
  if (prov.includes('z-ai') || prov.includes('zhipu') || id.includes('glm') || id.includes('z-ai')) return 'glm';
  return 'all';
}

export function detectPlanLabs(plan: CodingPlan, tier: PlanTier): FrontierLab[] {
  const labs = new Set<FrontierLab>();
  const text = `${plan.id} ${plan.name} ${(tier.models || []).join(' ')}`.toLowerCase();
  
  if (text.includes('claude') || text.includes('anthropic')) labs.add('anthropic');
  if (text.includes('gpt') || text.includes('openai') || text.includes('codex') || text.includes('o1') || text.includes('o3') || text.includes('o4')) labs.add('openai');
  if (text.includes('gemini') || text.includes('google') || text.includes('antigravity') || text.includes('jules')) labs.add('google');
  if (text.includes('deepseek')) labs.add('deepseek');
  if (text.includes('glm') || text.includes('z-ai') || text.includes('zhipu')) labs.add('glm');
  
  return Array.from(labs);
}

export interface ApplesToApplesResult {
  options: ApplesToApplesOption[];
  bestApi: ApplesToApplesOption | null;
  bestSubscription: ApplesToApplesOption | null;
  bestWorkhorse: ApplesToApplesOption | null;
  arbitrageCallout: {
    winnerType: 'subscription' | 'api' | 'even';
    multiplier: number;
    headline: string;
    description: string;
  } | null;
}

export function computeApplesToApples(
  models: NormalizedModel[],
  plans: CodingPlan[],
  lab: FrontierLab,
  budget: number,
  minCodingIndex: number = 0
): ApplesToApplesResult {
  const excludedPatterns = [
    'nemo', 'granite', 'lunaris', 'hermes', 'gemma-1', 'llama-2', 'gpt-3.5',
    'claude-2', 'claude-1', 'gemini-1.0', 'command-r', 'dbrx'
  ];

  // 1. Filter API models
  const cleanModels = models.filter(m => {
    if (m.isFree || m.isBatch || m.blendedCost <= 0) return false;
    const lower = m.id.toLowerCase();
    if (excludedPatterns.some(pat => lower.includes(pat))) return false;
    if (lab !== 'all' && detectModelLab(m) !== lab) return false;
    if (minCodingIndex > 0 && (m.benchmarks?.codingIndex || 0) < minCodingIndex) return false;
    return true;
  });

  const apiOptions: ApplesToApplesOption[] = cleanModels.map(m => {
    const monthlyTokens = budget / m.blendedCost;
    // Standard agentic prompt: 20k in, 1k out (~21k tokens)
    const costPerRequest = 0.021 * m.blendedCost;
    const monthlyRequests = Math.round(budget / (costPerRequest > 0 ? costPerRequest : 0.01));
    const modelLab = detectModelLab(m);

    return {
      id: m.id,
      name: m.name,
      provider: m.provider,
      lab: modelLab,
      type: 'api',
      category: 'api-provider',
      monthlyCost: budget,
      monthlyTokens,
      monthlyRequests,
      codingIndex: m.benchmarks?.codingIndex ?? null,
      intelligenceIndex: m.benchmarks?.intelligenceIndex ?? null,
      costPer1kRequests: m.costPer1kRequests,
      notes: `Pay-as-you-go API @ $${m.blendedCost.toFixed(2)}/M blended tokens`,
    };
  });

  // 2. Filter Subscription Plans
  const subscriptionOptions: ApplesToApplesOption[] = [];

  for (const plan of plans) {
    for (const tier of plan.tiers || []) {
      if (tier.monthlyPrice === null || tier.monthlyPrice <= 0) continue;
      
      const planLabs = detectPlanLabs(plan, tier);
      if (lab !== 'all' && !planLabs.includes(lab)) continue;

      // Plan price should be relevant to budget (between 25% and 250% of budget)
      if (tier.monthlyPrice > budget * 2.5 || tier.monthlyPrice < budget * 0.25) continue;

      const baseTokens = tier.estimatedTokenBudget?.estimatedMillionTokens || 0;
      let rawRequests = 0;
      if (tier.limits?.fastRequests && typeof tier.limits.fastRequests === 'number') {
        rawRequests = tier.limits.fastRequests;
      } else if (tier.limits?.fiveHourCredits && typeof tier.limits.fiveHourCredits === 'number') {
        rawRequests = tier.limits.fiveHourCredits * 6; // ~6 rolling blocks/day * 30 days conservative
      } else {
        rawRequests = Math.round((baseTokens * 1_000_000) / 21_000);
      }

      // Normalize yield to the user's budget so developer can compare true value per dollar
      const tokensPerDollar = baseTokens / tier.monthlyPrice;
      const requestsPerDollar = rawRequests / tier.monthlyPrice;
      const normalizedTokens = tokensPerDollar * budget;
      const normalizedRequests = Math.round(requestsPerDollar * budget);

      subscriptionOptions.push({
        id: `${plan.id}-${tier.name}`,
        name: `${plan.name} (${tier.name})`,
        provider: plan.name,
        lab: planLabs[0] || 'all',
        type: 'subscription',
        category: plan.category,
        planId: plan.id,
        planName: plan.name,
        tierName: tier.name,
        monthlyCost: tier.monthlyPrice,
        monthlyTokens: normalizedTokens,
        monthlyRequests: normalizedRequests,
        codingIndex: null, // Subscriptions offer multiple models
        intelligenceIndex: null,
        costPer1kRequests: (tier.monthlyPrice / (rawRequests || 1)) * 1000,
        notes: tier.estimatedTokenBudget?.description || `Includes ${tier.models?.slice(0, 2).join(', ')}`,
        url: plan.url,
      });
    }
  }

  // Combine and sort by total monthly tokens delivered
  const allOptions = [...apiOptions, ...subscriptionOptions].sort((a, b) => b.monthlyTokens - a.monthlyTokens);

  // Identify standout picks
  const sortedApis = [...apiOptions].sort((a, b) => {
    // Prioritize high coding capability first, then volume
    const scoreA = a.codingIndex || 0;
    const scoreB = b.codingIndex || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.monthlyTokens - a.monthlyTokens;
  });
  const bestApi = sortedApis.length > 0 ? sortedApis[0] : null;

  const sortedSubs = [...subscriptionOptions].sort((a, b) => b.monthlyTokens - a.monthlyTokens);
  const bestSubscription = sortedSubs.length > 0 ? sortedSubs[0] : null;

  // Best workhorse: model with coding index >= 68 and high token output
  const workhorseCandidates = apiOptions
    .filter(o => o.codingIndex !== null && o.codingIndex >= 68)
    .sort((a, b) => b.monthlyTokens - a.monthlyTokens);
  const bestWorkhorse = workhorseCandidates.length > 0 ? workhorseCandidates[0] : null;

  // Calculate Arbitrage Verdict
  let arbitrageCallout: ApplesToApplesResult['arbitrageCallout'] = null;

  if (bestSubscription && bestApi) {
    const subTokens = bestSubscription.monthlyTokens;
    const apiTokens = bestApi.monthlyTokens;
    const labName = lab === 'anthropic' ? 'Claude' 
      : lab === 'openai' ? 'OpenAI' 
      : lab === 'google' ? 'Gemini' 
      : lab === 'deepseek' ? 'DeepSeek' 
      : lab === 'glm' ? 'GLM' 
      : 'Frontier Models';

    if (subTokens >= apiTokens * 1.25) {
      const multiplier = Number((subTokens / (apiTokens || 1)).toFixed(1));
      arbitrageCallout = {
        winnerType: 'subscription',
        multiplier,
        headline: `Coding Subscription Wins for ${labName} (${multiplier}x Compute)`,
        description: `Subscribing to ${bestSubscription.name} yields ~${formatMillionTokens(subTokens)} tokens (~${bestSubscription.monthlyRequests.toLocaleString()} requests), beating direct ${bestApi.name} API (~${formatMillionTokens(apiTokens)} tokens) for $${budget}/mo.`,
      };
    } else if (apiTokens >= subTokens * 1.25) {
      const multiplier = Number((apiTokens / (subTokens || 1)).toFixed(1));
      arbitrageCallout = {
        winnerType: 'api',
        multiplier,
        headline: `Direct API Wins for ${labName} (${multiplier}x Compute)`,
        description: `Direct pay-per-token API for ${bestApi.name} delivers ~${formatMillionTokens(apiTokens)} tokens (~${bestApi.monthlyRequests.toLocaleString()} requests), outperforming coding subscriptions (~${formatMillionTokens(subTokens)} tokens) for $${budget}/mo.`,
      };
    } else {
      arbitrageCallout = {
        winnerType: 'even',
        multiplier: 1.0,
        headline: `Balanced Value for ${labName}`,
        description: `Both direct API (${bestApi.name}) and subscriptions (${bestSubscription.name}) offer comparable compute near ${formatMillionTokens(subTokens)} tokens for $${budget}/mo.`,
      };
    }
  }

  return {
    options: allOptions,
    bestApi,
    bestSubscription,
    bestWorkhorse,
    arbitrageCallout,
  };
}
