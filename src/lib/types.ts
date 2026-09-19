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
}

export type ModelTierClass = 'frontier' | 'balanced' | 'economy';
export type BudgetSortMode = 'best-value' | 'frontier' | 'max-tokens';
export type FrontierLab = 'all' | 'anthropic' | 'openai' | 'google' | 'deepseek' | 'glm';
export type DisplayUnit = 'tokens' | 'requests';

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
  monthlyCost: number;
  monthlyTokens: number; // in million tokens
  monthlyRequests: number; // requests per month (using 21K token standard agent request)
  codingIndex: number | null;
  intelligenceIndex: number | null;
  costPer1kRequests: number;
  verdictBadge?: string;
  notes: string;
  url?: string;
}

export interface NormalizedModel {
  id: string;
  name: string;
  provider: string;
  modality: string;
  contextWindow: number;
  maxOutput: number;
  pricing: ModelPricing;
  blendedCost: number;
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
  estimatedTokenBudget: {
    description?: string;
    estimatedMillionTokens: number;
    assumptions: string;
  } | null;
  notes?: string;
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
