import { describe, it, expect } from 'vitest';
import {
  calculateAgentRequestCost,
  calculateBudgetResults,
  computeWeightedScore,
  computeValueScore,
  computeApplesToApples,
  buildStackCandidates,
  computeDaveStacks,
  computeMixAndMatch,
  matchesPlanModel,
  formatMillionTokens,
} from './pricing';
import type { CodingPlan, NormalizedModel, PlanTier, StackCandidate } from './types';

function model(overrides: Partial<NormalizedModel> = {}): NormalizedModel {
  return {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    modality: 'text->text',
    contextWindow: 200_000,
    maxOutput: 64_000,
    pricing: { input: 2, output: 10, cachedInput: null, cachedInputWrite: null, reasoning: null, webSearch: null },
    blendedCost: 4,
    costPer1kRequests: 14,
    benchmarks: { intelligenceIndex: 60, codingIndex: 70, agenticIndex: 50, valueScore: 175 },
    reasoning: null,
    isFree: false,
    isBatch: false,
    ...overrides,
  };
}

function tier(overrides: Partial<PlanTier> = {}): PlanTier {
  return {
    name: 'Pro',
    monthlyPrice: 20,
    limits: { fastRequests: '100' },
    models: ['Claude Sonnet 5'],
    estimatedTokenBudget: {
      description: 'Test allowance',
      estimatedMillionTokens: 10,
      assumptions: 'test',
    },
    ...overrides,
  };
}

function plan(overrides: Partial<CodingPlan> = {}): CodingPlan {
  return {
    id: 'test-plan',
    name: 'Test Plan',
    category: 'coding-ide',
    url: 'https://example.com/pricing',
    lastVerified: '2026-09-18',
    tiers: [tier()],
    gotchas: ['test gotcha'],
    tosHighlights: [],
    dataTraining: 'No training',
    ipIndemnity: false,
    ...overrides,
  };
}

function candidate(overrides: Partial<StackCandidate> = {}): StackCandidate {
  return {
    planId: 'a',
    planName: 'A',
    planCategory: 'coding-router',
    planUrl: 'https://example.com/a',
    tierName: 'Tier',
    modelName: 'Model',
    modelId: 'm',
    price: 10,
    tokens: 10,
    requests: 100,
    codingIndex: 60,
    lab: 'all',
    ...overrides,
  };
}

describe('formatMillionTokens', () => {
  it('formats thousands, millions and billions', () => {
    expect(formatMillionTokens(0.5)).toBe('500K');
    expect(formatMillionTokens(5)).toBe('5.0M');
    expect(formatMillionTokens(1500)).toBe('1.5B');
  });
});

describe('calculateAgentRequestCost', () => {
  it('prices 20k fresh input + 1k output at list rates with no cache', () => {
    const { costPerRequest, effectiveBlendedCost } = calculateAgentRequestCost(model(), 0);
    // 20k * $2/M + 1k * $10/M = 0.04 + 0.01 = 0.05
    expect(costPerRequest).toBeCloseTo(0.05, 10);
    expect(effectiveBlendedCost).toBeCloseTo((0.05 / 21000) * 1e6, 6);
  });

  it('uses the real cached input price when available', () => {
    const cached = model({
      pricing: { input: 2, output: 10, cachedInput: 0.2, cachedInputWrite: null, reasoning: null, webSearch: null },
    });
    const { costPerRequest } = calculateAgentRequestCost(cached, 0.75);
    // 5k fresh * $2/M + 15k cached * $0.2/M + 1k * $10/M = 0.01 + 0.003 + 0.01
    expect(costPerRequest).toBeCloseTo(0.023, 10);
  });

  it('assumes no caching (full input price) when cache price is unknown', () => {
    const { costPerRequest } = calculateAgentRequestCost(model(), 0.75);
    expect(costPerRequest).toBeCloseTo(0.05, 10);
  });

  it('never returns a zero cost for a free request', () => {
    const free = model({ pricing: { input: 0, output: 0, cachedInput: null, cachedInputWrite: null, reasoning: null, webSearch: null } });
    const { costPerRequest } = calculateAgentRequestCost(free, 0);
    expect(costPerRequest).toBeGreaterThan(0);
  });
});

describe('computeWeightedScore / computeValueScore', () => {
  it('weights coding 50%, agentic 30%, intelligence 20% when all present', () => {
    expect(computeWeightedScore(model())).toBeCloseTo(62, 6);
  });

  it('penalizes missing dimensions instead of renormalizing them away', () => {
    const partial = model({
      benchmarks: { intelligenceIndex: 60, codingIndex: 70, agenticIndex: null, valueScore: null },
    });
    // (0.5*70 + 0.2*60) / 0.7 * 0.9 = 60.43 < 62 (fully measured equivalent)
    expect(computeWeightedScore(partial)).toBeCloseTo(60.4286, 3);
  });

  it('computes value as quality per blended dollar', () => {
    expect(computeValueScore(model())).toBeCloseTo(1550, 6);
  });

  it('returns 0 for a model with no benchmark data', () => {
    const bare = model({ benchmarks: { intelligenceIndex: null, codingIndex: null, agenticIndex: null, valueScore: null } });
    expect(computeWeightedScore(bare)).toBe(0);
  });
});

describe('calculateBudgetResults', () => {
  const pool = [
    model({ id: 'ok', name: 'OK', blendedCost: 4 }),
    model({ id: 'weak', name: 'Weak', blendedCost: 1, benchmarks: { intelligenceIndex: 10, codingIndex: 30, agenticIndex: null, valueScore: null } }),
    model({ id: 'free', name: 'Free', blendedCost: 0, isFree: true }),
    model({ id: 'batch', name: 'Batch', blendedCost: 1, isBatch: true }),
    model({ id: 'zero', name: 'Zero', blendedCost: 0 }),
  ];

  it('excludes free, batch and zero-cost models', () => {
    const ids = calculateBudgetResults(pool, 20, 'max-tokens').map(r => r.modelId);
    expect(ids).toEqual(['weak', 'ok']);
  });

  it('best-value only ranks models with coding index >= 40', () => {
    const ids = calculateBudgetResults(pool, 20, 'best-value').map(r => r.modelId);
    expect(ids).toEqual(['ok']);
  });

  it('max-tokens ranks by raw volume', () => {
    const results = calculateBudgetResults(pool, 20, 'max-tokens');
    expect(results[0].modelId).toBe('weak');
    expect(results[0].millionTokens).toBeCloseTo(20, 6);
  });
});

describe('matchesPlanModel', () => {
  it('matches exact model ids and names', () => {
    expect(matchesPlanModel('Claude Sonnet 5', model())).toBe(true);
    expect(matchesPlanModel('claude-sonnet-5', model())).toBe(true);
  });

  it('does not match unrelated models', () => {
    const gemini = model({ id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash' });
    expect(matchesPlanModel('Claude Opus 5', gemini)).toBe(false);
  });
});

describe('computeApplesToApples', () => {
  it('produces subscription rows at the plan price and API rows at agent-request rates', () => {
    const result = computeApplesToApples([model()], [plan()], 'all', 20, 0, 0.75);
    const sub = result.options.find(o => o.type === 'subscription');
    const api = result.options.find(o => o.type === 'api');
    expect(sub).toBeDefined();
    expect(sub!.monthlyCost).toBe(20);
    expect(sub!.monthlyTokens).toBeCloseTo(10, 6);
    expect(api).toBeDefined();
    expect(api!.monthlyTokens).toBeGreaterThan(0);
  });

  it('excludes free, batch and excluded-legacy models from the API side', () => {
    const legacy = model({ id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' });
    const free = model({ id: 'x/free', name: 'Free', isFree: true });
    const result = computeApplesToApples([model(), legacy, free], [], 'all', 20, 0, 0.75);
    const ids = result.options.map(o => o.id);
    expect(ids).toContain('anthropic/claude-sonnet-5');
    expect(ids).not.toContain('openai/gpt-3.5-turbo');
    expect(ids).not.toContain('x/free');
  });
});

describe('stack candidates', () => {
  it('includes paid tiers with a positive token budget', () => {
    const candidates = buildStackCandidates([model()], [plan()], 'all');
    expect(candidates).toHaveLength(1);
    expect(candidates[0].tokens).toBe(10);
    expect(candidates[0].requests).toBeGreaterThan(0);
  });

  it('skips free tiers', () => {
    const freePlan = plan({ tiers: [tier({ monthlyPrice: 0 })] });
    expect(buildStackCandidates([model()], [freePlan], 'all')).toHaveLength(0);
  });
});

describe('computeDaveStacks', () => {
  it('stacks whole copies that fit the budget', () => {
    const stacks = computeDaveStacks([candidate({ price: 20, tokens: 10 })], 50);
    expect(stacks).toHaveLength(1);
    expect(stacks[0].qty).toBe(2);
    expect(stacks[0].totalPrice).toBe(40);
    expect(stacks[0].totalTokens).toBe(20);
  });

  it('needs at least two copies', () => {
    expect(computeDaveStacks([candidate({ price: 60, tokens: 10 })], 50)).toHaveLength(0);
  });
});

describe('computeMixAndMatch', () => {
  it('only returns bundles within budget and with distinct plans', () => {
    const candidates = [
      candidate({ planId: 'a', price: 10, tokens: 10 }),
      candidate({ planId: 'b', price: 10, tokens: 8 }),
      candidate({ planId: 'c', price: 20, tokens: 15 }),
      candidate({ planId: 'd', price: 30, tokens: 40 }),
    ];
    const bundles = computeMixAndMatch(candidates, 30, 3, 3);
    expect(bundles.length).toBeGreaterThan(0);
    for (const bundle of bundles) {
      expect(bundle.totalPrice).toBeLessThanOrEqual(30);
      expect(bundle.components.length).toBeGreaterThanOrEqual(2);
      expect(bundle.components.length).toBeLessThanOrEqual(3);
      expect(new Set(bundle.components.map(c => c.planId)).size).toBe(bundle.components.length);
      expect(bundle.totalTokens).toBe(bundle.components.reduce((sum, c) => sum + c.tokens, 0));
    }
  });
});
