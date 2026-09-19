export interface ModelPricing {
  input: number;
  output: number;
  cachedInput: number | null;
  cachedInputWrite: number | null;
  reasoning: number | null;
  webSearch: number | null;
}

export interface ModelBenchmarks {
  intelligenceIndex: number | null;
  codingIndex: number | null;
  agenticIndex: number | null;
  valueScore: number | null;
  benchmarkSource?: 'artificial-analysis' | 'openrouter' | null;
}

export type ModelTierClass = 'frontier' | 'balanced' | 'economy';
export type BudgetSortMode = 'best-value' | 'frontier' | 'max-tokens';
/** Cost basis for Budget yields: agentic (20:1 + prompt cache) or legacy chat (3:1). */
export type BlendMode = 'agentic' | 'chat';
export type FrontierLab = 'all' | 'anthropic' | 'openai' | 'google' | 'deepseek' | 'glm';
export type DisplayUnit = 'tokens' | 'requests';
export type CacheRate = 0 | 0.75 | 0.90;

export type StackingPolicy = 'allowed' | 'silent' | 'prohibited' | 'unknown';

export interface ApplesToApplesOption {
  id: string;
  name: string;
  provider: string;
  lab: FrontierLab;
  type: 'api' | 'subscription';
  category?: 'coding-ide' | 'coding-router' | 'api-provider';
  planId?: string;
  planName?: string;
  tierName?: string;
  modelId?: string;
  monthlyCost: number;
  monthlyTokens: number; // in million tokens
  monthlyRequests: number; // requests per month (using 21K token standard agent request)
  codingIndex: number | null;
  intelligenceIndex: number | null;
  costPer1kRequests: number;
  verdictBadge?: string;
  notes: string;
  url?: string;
  /** Subscriptions are normalized to the budget (tokens-per-dollar x budget); APIs are actual spend. */
  yieldBasis?: 'normalized' | 'actual';
  /** Native plan monthly token allowance (unnormalized) for subscriptions. */
  rawMonthlyTokens?: number;
  /** Native plan monthly agent request allowance (unnormalized) for subscriptions. */
  rawMonthlyRequests?: number;
}

export type EngineMode = 'standard' | 'mix' | 'dave';

export interface StackCandidate {
  planId: string;
  planName: string;
  planCategory: 'coding-ide' | 'coding-router' | 'api-provider';
  planUrl: string;
  tierName: string;
  modelName: string | null;
  modelId: string | null;
  price: number;
  tokens: number;
  requests: number;
  codingIndex: number | null;
  lab: FrontierLab;
  stackingPolicy: StackingPolicy;
  stackingPolicyNote?: string;
}

export interface StackComponent {
  planId: string;
  planName: string;
  tierName: string;
  modelName: string;
  price: number;
  tokens: number; // raw tier monthly million tokens
  requests: number; // raw tier monthly agent requests
  url: string;
}

export interface MixBundle {
  id: string;
  components: StackComponent[];
  totalPrice: number;
  totalTokens: number; // million tokens
  totalRequests: number;
  bestCodingIndex: number | null;
}

export interface DaveStack {
  id: string;
  planName: string;
  tierName: string;
  modelName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  unitTokens: number; // million tokens per single copy
  totalTokens: number; // million tokens
  totalRequests: number;
  url: string;
  codingIndex: number | null;
  stackingPolicy: StackingPolicy;
  stackingPolicyNote?: string;
}

export interface NormalizedModel {
  id: string;
  name: string;
  provider: string;
  /**
   * Canonical model family (GPT, Claude, Gemini, Grok, Qwen, DeepSeek,
   * Llama, GLM, Kimi, Mistral, or "other"). Catalog is capped at the
   * top-3 ranked models per series within the last 365 days.
   */
  series: string;
  /** ISO release date (YYYY-MM-DD) when known, else null. */
  releasedAt?: string | null;
  /** Release timestamp in unix seconds when reported by OpenRouter. */
  createdUnix?: number | null;
  /** True when no intelligence/coding/agentic benchmark coverage exists yet. */
  unbenchmarked?: boolean;
  modality: string;
  contextWindow: number;
  maxOutput: number;
  pricing: ModelPricing;
  blendedCost: number;
  agentBlendedCost?: number;
  costPer1kRequests: number;
  benchmarks: ModelBenchmarks;
  tierClass?: ModelTierClass;
  reasoning: {
    mandatory: boolean;
    defaultEnabled: boolean;
    supportedEfforts: string[];
  } | null;
  isFree: boolean;
  isBatch: boolean;
}

export interface PlanTier {
  name: string;
  monthlyPrice: number | null;
  annualPrice?: number | null;
  limits: Record<string, any>;
  models?: string[];
  modelAllowances?: Record<string, number>;
  estimatedTokenBudget: {
    description?: string;
    estimatedMillionTokens: number;
    midpointEstimate?: number;
    optimisticEstimate?: number;
    assumptions: string;
    estimateMeta?: {
      sourceUrl?: string;
      sourceQuote?: string;
      sourceType: 'official' | 'derived' | 'research' | 'community';
      confidence: 'high' | 'medium' | 'low';
      verifiedAt: string;
      basisModel?: string;
      cacheAssumption?: string;
    };
  } | null;
  notes?: string;
}

export interface WorkloadItem {
  modelId: string;
  modelName: string;
  share: number; // fraction 0 to 1
  tokensMillion: number;
  costPpu: number; // direct pay-per-use cost for this model
}

export interface PoolDrainRow {
  modelName: string;
  share: number;
  costPpu: number;
  effectiveAllowance: number;
  fractionConsumed: number;
  coveredCost: number;
  overageCost: number;
  isSupported?: boolean;
}

export interface PoolDrainResult {
  planId: string;
  planName: string;
  tierName: string;
  monthlyPrice: number;
  poolUtilizedPercent: number;
  totalDirectCost: number;
  coveredDirectCost: number;
  overageCost: number;
  totalPlanCost: number; // monthlyPrice + overageCost
  savings: number; // totalDirectCost - totalPlanCost
  isCapped: boolean; // whether overage occurred
  rows: PoolDrainRow[];
  supportedModelsCount?: number;
  totalModelsCount?: number;
  coverageType?: 'full' | 'partial' | 'none';
}

export interface CodingPlan {
  id: string;
  name: string;
  category: 'coding-ide' | 'coding-router' | 'api-provider';
  url: string;
  lastVerified: string;
  tiers: PlanTier[];
  gotchas: string[];
  tosHighlights: string[];
  dataTraining: string;
  ipIndemnity: string | boolean;
  stackingPolicy?: StackingPolicy;
  stackingPolicyNote?: string;
}

export interface BudgetResult {
  modelId: string;
  modelName: string;
  provider: string;
  millionTokens: number;
  requests1k: number;
  codingIndex: number | null;
  intelligenceIndex: number | null;
  valueScore: number | null;
  blendedCost: number;
  /** Cost used for the yield: agentBlendedCost (agentic) or blendedCost (chat). */
  effectiveCost: number;
  costBasis: BlendMode;
  tierClass?: ModelTierClass;
}

export interface AABenchmark {
  slug: string;
  name: string;
  releaseDate: string | null;
  creator: string;
  intelligenceIndex: number | null;
  codingIndex: number | null;
  agenticIndex: number | null;
  pricing: {
    input: number;
    output: number;
    cachedInput: number | null;
  };
  performance: {
    outputTokensPerSec: number | null;
    ttft: number | null;
    e2eResponseTime: number | null;
  };
  indexCost: number | null;
}
