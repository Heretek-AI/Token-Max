import type { 
  NormalizedModel, 
  BudgetResult,
  BudgetSortMode,
  BlendMode,
  FrontierLab,
  CodingPlan,
  PlanTier,
  ApplesToApplesOption,
  CacheRate,
  StackCandidate,
  StackComponent,
  MixBundle,
  DaveStack,
  WorkloadItem,
  PoolDrainResult,
  PoolDrainRow
} from './types';
import {
  AGENT_REQUEST_INPUT_TOKENS,
  AGENT_REQUEST_OUTPUT_TOKENS,
  STANDARD_AGENT_REQUEST_TOKENS,
  DEFAULT_CACHE_RATE,
  CACHE_WRITE_PREMIUM,
  TIME_OF_DAY_BLEND,
} from './estimate-constants';

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

/**
 * Single source of truth for coding-quality thresholds used across the app.
 * - economy:   minimum for value ranking (capable budget models)
 * - value:     "best value" workhorse tab
 * - workhorse: production-grade agent models
 * - frontier:  top-tier frontier models
 */
export const QUALITY = {
  economy: 40,
  value: 50,
  workhorse: 65,
  frontier: 75,
} as const;

/**
 * Agentic effective cost: the persisted `agentBlendedCost` (20K-in/1K-out at
 * 75% cache) with a safe fallback to the legacy 3:1 list blend when a model
 * was ingested before agentBlendedCost existed.
 */
export function getAgentBlendedCost(model: NormalizedModel): number {
  const agent = model.agentBlendedCost;
  if (agent != null && agent > 0) return agent;
  return model.blendedCost;
}

/** Cost basis for token yields: agentic by default, legacy chat (3:1) on request. */
export function getEffectiveBlendCost(model: NormalizedModel, blendMode: BlendMode = 'agentic'): number {
  return blendMode === 'agentic' ? getAgentBlendedCost(model) : model.blendedCost;
}

export function calculateBudgetResults(
  models: NormalizedModel[],
  budget: number,
  sortMode: BudgetSortMode = 'best-value',
  blendMode: BlendMode = 'agentic'
): BudgetResult[] {
  if (!Number.isFinite(budget) || budget <= 0) return [];
  const eligible = models
    .filter(m => !m.isFree && !m.isBatch && getEffectiveBlendCost(m, blendMode) > 0)
    .map(m => {
      const codingIndex = m.benchmarks?.codingIndex ?? null;
      const intelligenceIndex = m.benchmarks?.intelligenceIndex ?? null;
      const valueScore = m.blendedCost > 0 && codingIndex != null
        ? computeValueScore(m)
        : null;
      const effectiveCost = getEffectiveBlendCost(m, blendMode);
      const millionTokens = budget / effectiveCost;
      // Agentic yields are expressed in normalized 21K agent requests; chat
      // yields keep the legacy 3K (2K-in/1K-out) request definition.
      const requests1k = blendMode === 'agentic'
        ? (millionTokens * 1_000_000) / STANDARD_AGENT_REQUEST_TOKENS
        : (budget / (m.costPer1kRequests || 1)) * 1000;

      return {
        modelId: m.id,
        modelName: m.name,
        provider: m.provider,
        millionTokens,
        requests1k,
        codingIndex,
        intelligenceIndex,
        valueScore,
        blendedCost: m.blendedCost,
        effectiveCost,
        costBasis: blendMode,
        tierClass: m.tierClass || 'balanced',
      };
    });

  if (sortMode === 'frontier') {
    // Rank pure coding capability (Coding Index first, then Intelligence Index)
    return eligible
      .filter(m => m.tierClass === 'frontier' || (m.codingIndex && m.codingIndex >= QUALITY.frontier))
      .sort((a, b) => {
        const scoreA = a.codingIndex ?? a.intelligenceIndex ?? 0;
        const scoreB = b.codingIndex ?? b.intelligenceIndex ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.effectiveCost - b.effectiveCost;
      });
  }

  if (sortMode === 'best-value') {
    // Rank quality per dollar, prioritizing models with strong verified coding scores
    return eligible
      .filter(m => m.codingIndex != null && m.codingIndex >= QUALITY.economy)
      .sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0));
  }

  // max-tokens (raw token volume)
  return eligible.sort((a, b) => b.millionTokens - a.millionTokens);
}

/**
 * Weighted quality score: 50% coding, 30% agentic, 20% intelligence.
 * Requires a coding index; missing dimensions are penalized rather than
 * renormalized so models with partial benchmark coverage cannot leapfrog
 * fully-measured models.
 */
export function computeWeightedScore(model: NormalizedModel): number {
  const b = model.benchmarks;
  if (b.codingIndex == null) return 0;
  let score = b.codingIndex * 0.5;
  let weight = 0.5;
  let dims = 1;
  if (b.agenticIndex != null) { score += b.agenticIndex * 0.3; weight += 0.3; dims++; }
  if (b.intelligenceIndex != null) { score += b.intelligenceIndex * 0.2; weight += 0.2; dims++; }
  const penalty = dims === 3 ? 1 : dims === 2 ? 0.9 : 0.75;
  return (score / weight) * penalty;
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
  return colors[provider] || 'hsl(0 15% 55%)';
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

/**
 * Effective cache-read multiplier for a model, derived from the real upstream
 * cached-input price when available. When no cache price is known we assume no
 * caching (1.0) instead of fabricating a discount.
 */
export function getEffectiveCacheMultiplier(model: NormalizedModel): number {
  const input = model.pricing.input;
  const cached = model.pricing.cachedInput;
  if (input > 0 && cached != null && cached >= 0) {
    return Math.min(1, cached / input);
  }
  return 1;
}

export function matchesPlanModel(planModelName: string, model: NormalizedModel): boolean {
  // Strip common tool-specific prefixes or parenthetical aliases
  const cleanPlan = planModelName
    .replace(/^cursor\s+/i, '')
    .replace(/^dola-/i, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim();

  const normPlan = cleanPlan.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normPlan.length < 3) return false;
  const normName = model.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normId = model.id.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normName.length < 3 && normId.length < 3) return false;

  // Exact model match takes top priority
  const modelShortId = model.id.includes('/')
    ? model.id.split('/')[1].toLowerCase().replace(/[^a-z0-9]/g, '')
    : normId;
  if (normName === normPlan || normId === normPlan || modelShortId === normPlan) return true;

  // Prevent base models like "glm-5.3" from matching variant "flash", "flashx", "mini", etc. when the plan does not specify the variant
  const variants = ['flash', 'mini', 'nano', 'micro', 'lite', 'small'];
  for (const v of variants) {
    if (!normPlan.includes(v) && (normName.includes(v) || normId.includes(v))) {
      return false;
    }
  }

  return normName.includes(normPlan) || normId.includes(normPlan) || (normName.length >= 4 && normPlan.includes(normName));
}

export function calculateAgentRequestCost(
  model: NormalizedModel,
  cacheRate: CacheRate = DEFAULT_CACHE_RATE,
  cacheWriteShare: number = 0
): { costPerRequest: number; effectiveBlendedCost: number } {
  const inPrice = model.pricing.input ?? model.blendedCost * 0.75;
  const outPrice = model.pricing.output ?? model.blendedCost * 1.75;
  const cacheMult = getEffectiveCacheMultiplier(model);

  // Standard Agent Request (see docs/TOKEN_ESTIMATE_VALIDATION.md).
  // `cacheWriteShare` models the fraction of cached context written on this
  // request at the provider's cache-write rate (Anthropic charges 1.25x input
  // for the 5-minute TTL). The default 0 keeps the steady-state read model;
  // opt in when estimating cold prefixes or short-lived cache windows.
  const writeShare = Math.min(1, Math.max(0, cacheWriteShare));
  const freshInputTokens = AGENT_REQUEST_INPUT_TOKENS * (1 - cacheRate);
  const cachedInputTokens = AGENT_REQUEST_INPUT_TOKENS * cacheRate;
  const writtenInputTokens = cachedInputTokens * writeShare;
  const readInputTokens = cachedInputTokens - writtenInputTokens;
  const writePrice = model.pricing.cachedInputWrite ?? inPrice * CACHE_WRITE_PREMIUM;

  const cost = (freshInputTokens * inPrice / 1e6) +
               (readInputTokens * inPrice * cacheMult / 1e6) +
               (writtenInputTokens * writePrice / 1e6) +
               (AGENT_REQUEST_OUTPUT_TOKENS * outPrice / 1e6);

  const safeCost = cost > 0 ? cost : 0.0001;
  const effectiveBlendedCost = (safeCost / STANDARD_AGENT_REQUEST_TOKENS) * 1e6;

  return { costPerRequest: safeCost, effectiveBlendedCost };
}

export function computeApplesToApples(
  models: NormalizedModel[],
  plans: CodingPlan[],
  lab: FrontierLab,
  budget: number,
  minCodingIndex: number = 0,
  cacheRate: CacheRate = DEFAULT_CACHE_RATE
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
    const { costPerRequest, effectiveBlendedCost } = calculateAgentRequestCost(m, cacheRate);
    const monthlyRequests = Math.round(budget / costPerRequest);
    const monthlyTokens = (monthlyRequests * STANDARD_AGENT_REQUEST_TOKENS) / 1e6;
    const modelLab = detectModelLab(m);

    return {
      id: m.id,
      name: m.name,
      provider: m.provider,
      lab: modelLab,
      type: 'api',
      category: 'api-provider',
      modelId: m.id,
      monthlyCost: budget,
      monthlyTokens,
      monthlyRequests,
      codingIndex: m.benchmarks?.codingIndex ?? null,
      intelligenceIndex: m.benchmarks?.intelligenceIndex ?? null,
      costPer1kRequests: costPerRequest * 1000,
      notes: `Pay-as-you-go API @ $${effectiveBlendedCost.toFixed(2)}/M effective (${Math.round(cacheRate * 100)}% cache)`,
      yieldBasis: 'actual',
    };
  });

  // 2. Filter Subscription Plans
  const subscriptionOptions: ApplesToApplesOption[] = [];

  for (const plan of plans) {
    // Per-tier, per-model breakdown: attach real benchmark scores to subscription rows.
    // For a given (plan, matched model), surface only the tier whose price is closest
    // to the site budget so the same model isn't duplicated across a plan's tiers.
    const matchedByModel = new Map<string, { model: NormalizedModel; tier: PlanTier; planModelName: string }>();
    const unmatchedTiers: { tier: PlanTier; tokensPerDollar: number; rawRequests: number }[] = [];

    for (const tier of plan.tiers || []) {
      if (tier.monthlyPrice === null || tier.monthlyPrice <= 0) continue;
      if (tier.monthlyPrice > budget * 2.5 || tier.monthlyPrice < budget * 0.25) continue;

      const baseTokens = tier.estimatedTokenBudget?.estimatedMillionTokens || 0;
      const rawRequests = tierRawRequests(tier, baseTokens);
      const tokensPerDollar = baseTokens / tier.monthlyPrice;

      const tierMatches: { model: NormalizedModel; planModelName: string }[] = [];
      const tierMatchIds = new Set<string>();
      for (const planModelName of tier.models || []) {
        // Forward matching only here: a plan model name like "GLM-5.3-Flash"
        // must not match the shorter "GLM-5.3" (reverse-substring would steal
        // the tier's entry and drop the Flash row entirely). Each catalog
        // model may be claimed at most once per tier.
        const lower = planModelName.toLowerCase();
        const match =
          cleanModels.find(
            m =>
              !tierMatchIds.has(m.id) &&
              (m.name.toLowerCase().includes(lower) || m.id.toLowerCase().includes(lower))
          ) ??
          cleanModels.find(
            m => !tierMatchIds.has(m.id) && matchesPlanModel(planModelName, m)
          ) ??
          null;
        if (match) {
          tierMatchIds.add(match.id);
          tierMatches.push({ model: match, planModelName });
        }
      }

      if (tierMatches.length === 0) {
        unmatchedTiers.push({ tier, tokensPerDollar, rawRequests });
        continue;
      }

      for (const { model, planModelName } of tierMatches) {
        const existing = matchedByModel.get(model.id);
        const closer =
          !existing ||
          Math.abs((tier.monthlyPrice as number) - budget) <
          Math.abs((existing.tier.monthlyPrice as number) - budget);
        if (closer) matchedByModel.set(model.id, { model, tier, planModelName });
      }
    }

    for (const { model, tier, planModelName } of matchedByModel.values()) {
      const planLabs = detectPlanLabs(plan, tier);
      if (lab !== 'all' && !planLabs.includes(lab)) continue;

      if (tier.monthlyPrice === null || tier.monthlyPrice <= 0) continue;
      if (tier.monthlyPrice > budget * 2.5 || tier.monthlyPrice < budget * 0.25) continue;

      // Per-model yield: tokens if the entire quota drains exclusively on this model,
      // falling back to the tier pool when no per-model entry is published.
      const resolved = resolveTierModelBudget(tier, model.name, model.id, planModelName);
      const baseTokens = resolved.tokens || 0;
      const rawRequests = tierRawRequests(tier, baseTokens);
      const tokensPerDollar = baseTokens / tier.monthlyPrice;
      const requestsPerDollar = rawRequests / tier.monthlyPrice;
      const normalizedTokens = tokensPerDollar * budget;
      const normalizedRequests = Math.round(requestsPerDollar * budget);
      const isDedicatedDrain = Boolean(resolved.basis);
      const poolBasisNote = resolved.basis
        ? ` · ${resolved.basis} yield assuming all quota drained exclusively on ${model.name}`
        : null;

      subscriptionOptions.push({
        id: `${plan.id}-${tier.name}-${model.id}`,
        name: model.name,
        provider: plan.name,
        lab: planLabs[0] || 'all',
        type: 'subscription',
        category: plan.category,
        planId: plan.id,
        planName: plan.name,
        tierName: tier.name,
        modelId: model.id,
        monthlyCost: tier.monthlyPrice,
        monthlyTokens: normalizedTokens,
        monthlyRequests: normalizedRequests,
        rawMonthlyTokens: baseTokens,
        rawMonthlyRequests: rawRequests,
        isDedicatedDrain,
        drainBasis: resolved.basis,
        codingIndex: model.benchmarks?.codingIndex ?? null,
        intelligenceIndex: model.benchmarks?.intelligenceIndex ?? null,
        costPer1kRequests: (tier.monthlyPrice / (rawRequests || 1)) * 1000,
        notes: (tier.estimatedTokenBudget?.description || `Included in ${tier.name} tier`) + (poolBasisNote ?? ''),
        url: plan.url,
        yieldBasis: 'normalized',
      });
    }

    // Fallback rows for tiers whose model strings matched nothing in the catalog.
    // When minCodingIndex > 0, do NOT leak unbenchmarked / unmatched tiers into quality-filtered leaderboards.
    if (minCodingIndex === 0) {
      for (const { tier } of unmatchedTiers) {
        const planLabs = detectPlanLabs(plan, tier);
        if (lab !== 'all' && !planLabs.includes(lab)) continue;

        if (tier.monthlyPrice === null || tier.monthlyPrice <= 0) continue;
        if (tier.monthlyPrice > budget * 2.5 || tier.monthlyPrice < budget * 0.25) continue;

        const baseTokens = tier.estimatedTokenBudget?.estimatedMillionTokens || 0;
        const rawRequests = tierRawRequests(tier);
        const tokensPerDollar = baseTokens / tier.monthlyPrice;
        const requestsPerDollar = rawRequests / tier.monthlyPrice;
        const normalizedTokens = tokensPerDollar * budget;
        const normalizedRequests = Math.round(requestsPerDollar * budget);

        subscriptionOptions.push({
          id: `${plan.id}-${tier.name}`,
          name: `${tier.models?.[0] || plan.name} +${(tier.models?.length || 1) - 1} suite`,
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
          rawMonthlyTokens: baseTokens,
          rawMonthlyRequests: rawRequests,
          codingIndex: null,
          intelligenceIndex: null,
          costPer1kRequests: (tier.monthlyPrice / (rawRequests || 1)) * 1000,
          notes: tier.estimatedTokenBudget?.description || `Includes ${tier.models?.slice(0, 2).join(', ')}`,
          url: plan.url,
          yieldBasis: 'normalized',
        });
      }
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

  // Best workhorse: model with a production-grade coding index and high token output
  const workhorseCandidates = apiOptions
    .filter(o => o.codingIndex !== null && o.codingIndex >= QUALITY.workhorse)
    .sort((a, b) => b.monthlyTokens - a.monthlyTokens);
  const bestWorkhorse = workhorseCandidates.length > 0 ? workhorseCandidates[0] : null;

  // Calculate Arbitrage Verdict — quality-matched so we compare like with like.
  let arbitrageCallout: ApplesToApplesResult['arbitrageCallout'] = null;

  if (bestSubscription) {
    const subTokens = bestSubscription.monthlyTokens;
    const subCI = bestSubscription.codingIndex;

    // Prefer the exact same model on the API side; otherwise the nearest
    // capability match (never the absolute best API model).
    let matchedApi = bestSubscription.modelId
      ? apiOptions.find(o => o.id === bestSubscription.modelId)
      : undefined;
    if (!matchedApi && subCI != null) {
      matchedApi = apiOptions
        .filter(o => o.codingIndex != null)
        .sort((a, b) =>
          Math.abs((a.codingIndex as number) - subCI) - Math.abs((b.codingIndex as number) - subCI) ||
          b.monthlyTokens - a.monthlyTokens
        )[0];
    }
    const apiOption = matchedApi ?? bestApi;

    if (apiOption) {
      const apiTokens = apiOption.monthlyTokens;
      const labName = lab === 'anthropic' ? 'Claude' 
        : lab === 'openai' ? 'OpenAI' 
        : lab === 'google' ? 'Gemini' 
        : lab === 'deepseek' ? 'DeepSeek' 
        : lab === 'glm' ? 'GLM' 
        : 'Frontier Models';

      const qualityGap = subCI != null && apiOption.codingIndex != null
        ? Math.abs(subCI - apiOption.codingIndex)
        : null;
      const qualityNote = matchedApi && bestSubscription.modelId === apiOption.id
        ? `same model (${apiOption.name})`
        : qualityGap != null
        ? `nearest-quality API match (CI ±${qualityGap.toFixed(1)})`
        : 'nearest available API match';

      if (subTokens >= apiTokens * 1.25) {
        const multiplier = Number((subTokens / (apiTokens || 1)).toFixed(1));
        arbitrageCallout = {
          winnerType: 'subscription',
          multiplier,
          headline: `Coding Subscription Wins for ${labName} (${multiplier}x Compute)`,
          description: `${bestSubscription.planName} (${bestSubscription.tierName}) running ${bestSubscription.name} yields ~${formatMillionTokens(subTokens)} normalized tokens (~${bestSubscription.monthlyRequests.toLocaleString()} requests), beating direct ${apiOption.name} API (~${formatMillionTokens(apiTokens)} tokens) for $${budget}/mo. Compared as ${qualityNote}.`,
        };
      } else if (apiTokens >= subTokens * 1.25) {
        const multiplier = Number((apiTokens / (subTokens || 1)).toFixed(1));
        arbitrageCallout = {
          winnerType: 'api',
          multiplier,
          headline: `Direct API Wins for ${labName} (${multiplier}x Compute)`,
          description: `Direct pay-per-token API for ${apiOption.name} delivers ~${formatMillionTokens(apiTokens)} tokens (~${apiOption.monthlyRequests.toLocaleString()} requests), outperforming coding subscriptions (~${formatMillionTokens(subTokens)} normalized tokens) for $${budget}/mo. Compared as ${qualityNote}.`,
        };
      } else {
        arbitrageCallout = {
          winnerType: 'even',
          multiplier: 1.0,
          headline: `Balanced Value for ${labName}`,
          description: `Both direct API (${apiOption.name}) and subscriptions (${bestSubscription.planName} running ${bestSubscription.name}) offer comparable compute near ${formatMillionTokens(subTokens)} tokens for $${budget}/mo. Compared as ${qualityNote}.`,
        };
      }
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

// ---------------------------------------------------------------------------
// Subscription stacking helpers (Mix & Match + Dangerous Dave Mode)
// ---------------------------------------------------------------------------

const EXCLUDED_STACK_PATTERNS = [
  'nemo', 'granite', 'lunaris', 'hermes', 'gemma-1', 'llama-2', 'gpt-3.5',
  'claude-2', 'claude-1', 'gemini-1.0', 'command-r', 'dbrx'
];

/**
 * Monthly agent-request estimate for a tier. Vendor request caps are stored as
 * human-readable strings, so only numeric fastRequests are honored; otherwise
 * we derive requests from the token budget at the standard 21K request size.
 * Credits (Z.ai, Alibaba, etc.) are consumed per token and are NOT requests.
 */
function tierRawRequests(tier: PlanTier, baseTokens?: number): number {
  const fastRequests = tier.limits?.fastRequests;
  if (typeof fastRequests === 'number') {
    return fastRequests;
  }
  const monthlyTokens = baseTokens ?? (tier.estimatedTokenBudget?.estimatedMillionTokens || 0);
  return Math.round((monthlyTokens * 1_000_000) / STANDARD_AGENT_REQUEST_TOKENS);
}

export function buildStackCandidates(
  models: NormalizedModel[],
  plans: CodingPlan[],
  lab: FrontierLab
): StackCandidate[] {
  const cleanModels = models.filter(m => {
    if (m.isFree || m.isBatch || m.blendedCost <= 0) return false;
    const lower = m.id.toLowerCase();
    return !EXCLUDED_STACK_PATTERNS.some(pat => lower.includes(pat));
  });

  const candidates: StackCandidate[] = [];

  for (const plan of plans) {
    let best: { tier: PlanTier; modelName: string | null; modelId: string | null; codingIndex: number | null; tokens: number; score: number } | null = null;

    for (const tier of plan.tiers || []) {
      if (tier.monthlyPrice === null || tier.monthlyPrice <= 0) continue;
      const baseTokens = tier.estimatedTokenBudget?.estimatedMillionTokens || 0;
      if (baseTokens <= 0) continue;

      const planLabs = detectPlanLabs(plan, tier);
      if (lab !== 'all' && !planLabs.includes(lab)) continue;

      let match: NormalizedModel | null = null;
      let matchedPlanModelName: string | null = null;
      for (const planModelName of tier.models || []) {
        if (EXCLUDED_STACK_PATTERNS.some(pat => planModelName.toLowerCase().includes(pat))) continue;
        const found = cleanModels.find(m => matchesPlanModel(planModelName, m));
        if (found && (!match || (found.benchmarks?.codingIndex || 0) > (match.benchmarks?.codingIndex || 0))) {
          match = found;
          matchedPlanModelName = planModelName;
        }
      }

      // Resolve model-specific token budget when available; fall back to tier baseline
      const resolved = resolveTierModelBudget(tier, match ? match.name : null, match ? match.id : null, matchedPlanModelName);
      const effectiveTokens = resolved.tokens > 0 ? resolved.tokens : baseTokens;

      // Rank tiers by tokens-per-dollar; a small 10% preference for tiers with
      // a benchmark-matched model breaks near-ties without overriding value.
      const tokensPerDollar = effectiveTokens / (tier.monthlyPrice as number);
      const score = tokensPerDollar * (match ? 1.0 : 0.9);

      if (!best || score > best.score) {
        best = {
          tier,
          modelName: match ? match.name : (tier.models?.[0] || plan.name),
          modelId: match ? match.id : null,
          codingIndex: match?.benchmarks?.codingIndex ?? null,
          tokens: effectiveTokens,
          score,
        };
      }
    }

    if (best) {
      const price = best.tier.monthlyPrice as number;
      const tokens = best.tokens;
      const stackingPolicy = plan.stackingPolicy ?? 'unknown';
      candidates.push({
        planId: plan.id,
        planName: plan.name,
        planCategory: plan.category,
        planUrl: plan.url,
        tierName: best.tier.name,
        modelName: best.modelName,
        modelId: best.modelId,
        price,
        tokens,
        requests: tierRawRequests(best.tier, tokens),
        codingIndex: best.codingIndex,
        lab: detectPlanLabs(plan, best.tier)[0] || 'all',
        stackingPolicy,
        stackingPolicyNote: plan.stackingPolicyNote,
      });
    }
  }

  return candidates;
}

export function computeDaveStacks(candidates: StackCandidate[], budget: number): DaveStack[] {
  if (!Number.isFinite(budget) || budget <= 0) return [];
  const stacks: DaveStack[] = [];
  for (const c of candidates) {
    if (!c.price || c.price <= 0) continue;
    const qty = Math.floor(budget / c.price);
    if (!Number.isFinite(qty) || qty < 2) continue;
    stacks.push({
      id: `dave-${c.planId}-${c.tierName}`.replace(/\s+/g, '-'),
      planName: c.planName,
      tierName: c.tierName,
      modelName: c.modelName || 'Included Model Suite',
      qty,
      unitPrice: c.price,
      totalPrice: qty * c.price,
      unitTokens: c.tokens,
      totalTokens: qty * c.tokens,
      totalRequests: Math.round(qty * c.requests),
      url: c.planUrl,
      codingIndex: c.codingIndex,
      stackingPolicy: c.stackingPolicy,
      stackingPolicyNote: c.stackingPolicyNote,
    });
  }
  return stacks.sort((a, b) => b.totalTokens - a.totalTokens).slice(0, 8);
}

export function computeMixAndMatch(
  candidates: StackCandidate[],
  budget: number,
  maxSubs: number = 3,
  topBundles: number = 3
): MixBundle[] {
  if (!Number.isFinite(budget) || budget <= 0 || candidates.length === 0) return [];

  // Bounded knapsack over whole-dollar cents: maximize total tokens using at
  // most maxSubs distinct plans within the budget. States are keyed by
  // (subs used, spend) so a high-token single plan cannot shadow a multi-plan
  // bundle at the same spend. One tier per plan (candidates are already deduped).
  const cap = Math.round(budget * 100);
  if (!Number.isFinite(cap) || cap <= 0) return [];
  type State = { tokens: number; picks: number[] };
  let states = new Map<string, State>();
  states.set('0|0', { tokens: 0, picks: [] });

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const price = Math.round(c.price * 100);
    if (price <= 0 || price > cap) continue;
    const next = new Map(states);
    for (const [key, state] of states) {
      const sep = key.indexOf('|');
      const count = Number(key.slice(0, sep));
      const spend = Number(key.slice(sep + 1));
      if (count + 1 > maxSubs) continue;
      const newSpend = spend + price;
      if (newSpend > cap) continue;
      const tokens = state.tokens + c.tokens;
      const newKey = `${count + 1}|${newSpend}`;
      const existing = next.get(newKey);
      if (!existing || tokens > existing.tokens) {
        next.set(newKey, { tokens, picks: [...state.picks, i] });
      }
    }
    states = next;
  }

  const ranked = [...states.values()]
    .filter(state => state.picks.length >= 2)
    .sort((a, b) => b.tokens - a.tokens);

  const seen = new Set<string>();
  const bundles: StackCandidate[][] = [];
  for (const state of ranked) {
    const picked = state.picks.map(i => candidates[i]);
    const key = picked.map(c => c.planId).sort().join('+');
    if (seen.has(key)) continue;
    seen.add(key);
    bundles.push(picked);
    if (bundles.length >= topBundles) break;
  }

  return bundles.map(bundle => {
    const components: StackComponent[] = bundle.map(c => ({
      planId: c.planId,
      planName: c.planName,
      tierName: c.tierName,
      modelName: c.modelName || 'Included Model Suite',
      price: c.price,
      tokens: c.tokens,
      requests: c.requests,
      url: c.planUrl,
    }));
    components.sort((a, b) => b.tokens - a.tokens);
    const bestCodingIndex = Math.max(...bundle.map(c => c.codingIndex ?? -1));
    return {
      id: bundle.map(c => `${c.planId}-${c.tierName}`.replace(/\s+/g, '-')).join('+'),
      components,
      totalPrice: bundle.reduce((sum, c) => sum + c.price, 0),
      totalTokens: bundle.reduce((sum, c) => sum + c.tokens, 0),
      totalRequests: Math.round(bundle.reduce((sum, c) => sum + c.requests, 0)),
      bestCodingIndex: bestCodingIndex >= 0 ? bestCodingIndex : null,
    };
  });
}

/**
 * Resolve token budget for a (tier, model) pair. Prefers the per-model entry
 * (when the whole quota is drained exclusively on that model); falls back to
 * the tier-level pool. Returns the three estimate bases plus the basis label
 * used for the leaderboard note.
 */
export function resolveTierModelBudget(
  tier: PlanTier,
  modelName: string | null,
  modelId?: string | null,
  planModelName?: string | null
): { tokens: number; midpoint: number; optimistic: number; basis: string | null } {
  const tb = tier.estimatedTokenBudget;
  const fallback = {
    tokens: tb?.estimatedMillionTokens ?? 0,
    midpoint: tb?.midpointEstimate ?? tb?.estimatedMillionTokens ?? 0,
    optimistic: tb?.optimisticEstimate ?? tb?.estimatedMillionTokens ?? 0,
    basis: null as string | null,
  };
  if (!modelName && !modelId && !planModelName) return fallback;

  // Support both tier.perModelTokenBudgets and nested perModelTokenBudgets if present
  const pmb = tier.perModelTokenBudgets ?? (tb as unknown as { perModelTokenBudgets?: PlanTier['perModelTokenBudgets'] })?.perModelTokenBudgets;
  if (!pmb || Object.keys(pmb).length === 0) return fallback;

  const normPlan = (planModelName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normName = (modelName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normId = (modelId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const variants = ['flash', 'mini', 'nano', 'micro', 'lite', 'small'];

  // Longest key first so "glm-5.3-flash" wins over the shorter "glm-5.3".
  const keys = Object.keys(pmb).sort((a, b) => b.length - a.length);
  const key = keys.find(k => {
    const normKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normKey.length < 2) return false;

    // Variant guard: prevent base model key from matching flash target, or vice versa
    for (const v of variants) {
      const keyHasVariant = normKey.includes(v);
      const targetHasVariant =
        (normPlan.length >= 2 && normPlan.includes(v)) ||
        (normName.length >= 2 && normName.includes(v)) ||
        (normId.length >= 2 && normId.includes(v));
      if (keyHasVariant !== targetHasVariant) return false;
    }

    return (
      (normPlan.length >= 2 && (normPlan.includes(normKey) || normKey.includes(normPlan))) ||
      (normId.length >= 2 && (normId.includes(normKey) || normKey.includes(normId))) ||
      (normName.length >= 2 && normName.includes(normKey))
    );
  });

  if (!key) return fallback;
  const entry = pmb[key];
  return {
    tokens: entry.estimatedMillionTokens,
    midpoint: entry.midpointEstimate ?? entry.estimatedMillionTokens,
    optimistic: entry.optimisticEstimate ?? entry.estimatedMillionTokens,
    basis: entry.basis ?? 'per-model',
  };
}

/**
 * Calculates time-of-day blended cost for models with documented off-peak discounts
 * (e.g. DeepSeek 50% discount off-peak, Z.ai 50% discount off-peak).
 * Reads the shared blend shares from estimate-constants (default 80% off-peak, 20% peak).
 */
export function calculateTimeBlendedCost(
  model: NormalizedModel,
  offPeakShare: number = TIME_OF_DAY_BLEND.offPeakShare
): number {
  const baseCost = model.agentBlendedCost ?? model.blendedCost;
  const prov = (model.provider || '').toLowerCase();
  const id = (model.id || '').toLowerCase();
  const hasTimeDiscount = prov.includes('deepseek') || prov.includes('z-ai') || id.includes('deepseek') || id.includes('glm');
  if (!hasTimeDiscount) return baseCost;

  const peakShare = 1 - offPeakShare;
  // 50% off-peak discount: effective multiplier = offPeakShare * 0.5 + peakShare * 1.0
  const timeMultiplier = offPeakShare * 0.5 + peakShare * 1.0;
  return baseCost * timeMultiplier;
}

/**
 * Multi-Model Pool Drain Engine:
 * Simulates a subscription tier's quota consumption across an arbitrary mix of models.
 * Drains the subscription pool (100%) sequentially. Usage exceeding the pool spills
 * over into direct pay-per-use rates (overage).
 */
export function calculatePoolDrain(
  plan: CodingPlan,
  tier: PlanTier,
  workload: WorkloadItem[],
  estimateBasis: 'conservative' | 'midpoint' | 'optimistic' = 'conservative'
): PoolDrainResult {
  const monthlyPrice = tier.monthlyPrice ?? 0;
  const tb = tier.estimatedTokenBudget;
  const budgetTokens = tb
    ? estimateBasis === 'optimistic'
      ? (tb.optimisticEstimate ?? tb.estimatedMillionTokens)
      : estimateBasis === 'midpoint'
      ? (tb.midpointEstimate ?? tb.estimatedMillionTokens)
      : tb.estimatedMillionTokens
    : 0;

  const totalDirectCost = workload.reduce((sum, item) => sum + item.costPpu, 0);

  // Model support check: if tier has a restricted model list, verify whether item is supported
  const isItemSupported = (item: WorkloadItem): boolean => {
    if (tier.modelAllowances) {
      const matchKey = Object.keys(tier.modelAllowances).find(k =>
        item.modelId.toLowerCase().includes(k.toLowerCase()) ||
        item.modelName.toLowerCase().includes(k.toLowerCase())
      );
      if (matchKey) return true;
    }
    if (tier.perModelTokenBudgets) {
      const matchKey = Object.keys(tier.perModelTokenBudgets).find(k =>
        item.modelId.toLowerCase().includes(k.toLowerCase()) ||
        item.modelName.toLowerCase().includes(k.toLowerCase())
      );
      if (matchKey) return true;
    }
    if (tier.models && tier.models.length > 0) {
      return tier.models.some(planModelName =>
        matchesPlanModel(planModelName, { id: item.modelId, name: item.modelName } as NormalizedModel)
      );
    }
    return true;
  };

  // Greedy knapsack sorting:
  // Supported models are processed first, sorted by highest unit cost ($/M) to maximize absorbed value.
  // Unsupported models are placed last and spill directly into overage.
  const sortedWorkload = [...workload].sort((a, b) => {
    const aSupported = isItemSupported(a);
    const bSupported = isItemSupported(b);
    if (aSupported !== bSupported) return aSupported ? -1 : 1;
    const aRate = a.tokensMillion > 0 ? a.costPpu / a.tokensMillion : 0;
    const bRate = b.tokensMillion > 0 ? b.costPpu / b.tokensMillion : 0;
    return bRate - aRate;
  });

  let remainingPoolFraction = 1.0;
  let totalFractionConsumed = 0;
  const rows: PoolDrainRow[] = [];
  let supportedCount = 0;

  for (const item of sortedWorkload) {
    const supported = isItemSupported(item);
    if (supported) supportedCount++;

    let allowance = 0;
    if (supported) {
      if (tier.modelAllowances) {
        const matchKey = Object.keys(tier.modelAllowances).find(k =>
          item.modelId.toLowerCase().includes(k.toLowerCase()) ||
          item.modelName.toLowerCase().includes(k.toLowerCase())
        );
        if (matchKey) {
          allowance = tier.modelAllowances[matchKey];
        }
      }

      if (allowance <= 0) {
        const resolved = resolveTierModelBudget(tier, item.modelName, item.modelId);
        const modelTokens =
          estimateBasis === 'optimistic'
            ? (resolved.optimistic || resolved.tokens)
            : estimateBasis === 'midpoint'
            ? (resolved.midpoint || resolved.tokens)
            : resolved.tokens;

        const effectiveTokens = modelTokens > 0 ? modelTokens : budgetTokens;
        const impliedRatePerMillion = item.tokensMillion > 0 ? item.costPpu / item.tokensMillion : 1.0;

        if (effectiveTokens > 0) {
          allowance = effectiveTokens * impliedRatePerMillion;
        } else {
          allowance = monthlyPrice;
        }
      }
    }

    const fraction = allowance > 0 ? item.costPpu / allowance : 0;
    totalFractionConsumed += fraction;

    const usedFraction = Math.min(fraction, Math.max(0, remainingPoolFraction));
    remainingPoolFraction = Math.max(0, remainingPoolFraction - usedFraction);

    const coveredCost = usedFraction * allowance;
    const overageCost = Math.max(0, item.costPpu - coveredCost);

    rows.push({
      modelName: item.modelName,
      share: item.share,
      costPpu: item.costPpu,
      effectiveAllowance: allowance,
      fractionConsumed: fraction,
      coveredCost,
      overageCost,
      isSupported: supported,
    });
  }

  const coveredDirectCost = rows.reduce((sum, r) => sum + r.coveredCost, 0);
  const overageCost = rows.reduce((sum, r) => sum + r.overageCost, 0);
  const totalPlanCost = monthlyPrice + overageCost;
  const savings = totalDirectCost - totalPlanCost;
  const coverageType: 'full' | 'partial' | 'none' =
    supportedCount === workload.length ? 'full' : supportedCount > 0 ? 'partial' : 'none';

  return {
    planId: plan.id,
    planName: plan.name,
    tierName: tier.name,
    monthlyPrice,
    poolUtilizedPercent: Math.round(totalFractionConsumed * 100),
    totalDirectCost,
    coveredDirectCost,
    overageCost,
    totalPlanCost,
    savings,
    isCapped: totalFractionConsumed > 1.0 || supportedCount < workload.length,
    rows,
    supportedModelsCount: supportedCount,
    totalModelsCount: workload.length,
    coverageType,
  };
}

