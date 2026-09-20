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
  calculateTimeBlendedCost,
  calculatePoolDrain,
  getEffectiveCacheMultiplier,
} from './pricing';
import type { CodingPlan, NormalizedModel, PlanTier, StackCandidate } from './types';

function model(overrides: Partial<NormalizedModel> = {}): NormalizedModel {
  return {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    series: 'Claude',
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
    stackingPolicy: 'silent',
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

  it('prices the explicit cache-write share at the published write rate', () => {
    const cached = model({
      pricing: { input: 2, output: 10, cachedInput: 0.2, cachedInputWrite: 2.5, reasoning: null, webSearch: null },
    });
    const { costPerRequest } = calculateAgentRequestCost(cached, 0.75, 0.2);
    // 5k fresh * $2/M + 12k reads * $0.2/M + 3k writes * $2.5/M + 1k * $10/M
    expect(costPerRequest).toBeCloseTo(0.0299, 10);
  });

  it('falls back to 1.25x input for writes when no write price is published', () => {
    const { costPerRequest } = calculateAgentRequestCost(model(), 0.75, 1);
    // 5k fresh * $2/M + 15k writes * $2.50/M + 1k output * $10/M
    expect(costPerRequest).toBeCloseTo(0.0575, 10);
  });

  it('defaults to zero write share so steady-state reads are unchanged', () => {
    const cached = model({
      pricing: { input: 2, output: 10, cachedInput: 0.2, cachedInputWrite: 2.5, reasoning: null, webSearch: null },
    });
    const noWrites = calculateAgentRequestCost(cached, 0.75, 0);
    const readOnly = calculateAgentRequestCost(cached, 0.75);
    expect(noWrites.costPerRequest).toBeCloseTo(readOnly.costPerRequest, 12);
    expect(noWrites.costPerRequest).toBeCloseTo(0.023, 10);
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

describe('calculateBudgetResults blend modes', () => {
  const agenticModel = model({
    id: 'agentic',
    blendedCost: 4,
    agentBlendedCost: 2,
  });

  it('defaults to the agentic blend and uses agentBlendedCost for yields', () => {
    const [result] = calculateBudgetResults([agenticModel], 20, 'max-tokens');
    expect(result.costBasis).toBe('agentic');
    expect(result.effectiveCost).toBe(2);
    expect(result.millionTokens).toBeCloseTo(10, 6);
    expect(result.requests1k).toBeCloseTo((10 * 1_000_000) / 21000, 6);
  });

  it('chat blend uses the legacy 3:1 cost and request math', () => {
    const [result] = calculateBudgetResults([agenticModel], 20, 'max-tokens', 'chat');
    expect(result.costBasis).toBe('chat');
    expect(result.effectiveCost).toBe(4);
    expect(result.millionTokens).toBeCloseTo(5, 6);
    expect(result.requests1k).toBeCloseTo((20 / 14) * 1000, 6);
  });

  it('falls back to the list blend when agentBlendedCost is missing or zero', () => {
    const missing = model({ id: 'missing', blendedCost: 1, agentBlendedCost: undefined });
    const zeroAgent = model({ id: 'zero-agent', blendedCost: 1, agentBlendedCost: 0 });
    const results = calculateBudgetResults([missing, zeroAgent], 20, 'max-tokens');
    expect(results).toHaveLength(2);
    expect(results.every(r => r.effectiveCost === 1)).toBe(true);
    expect(results[0].millionTokens).toBeCloseTo(20, 6);
  });

  it('yields more tokens under the agentic blend than the chat blend', () => {
    const agentic = calculateBudgetResults([agenticModel], 20, 'max-tokens')[0];
    const chat = calculateBudgetResults([agenticModel], 20, 'max-tokens', 'chat')[0];
    expect(agentic.millionTokens).toBeGreaterThan(chat.millionTokens);
  });
});

describe('matchesPlanModel', () => {
  it('matches exact model ids and names', () => {
    expect(matchesPlanModel('Claude Sonnet 5', model())).toBe(true);
    expect(matchesPlanModel('claude-sonnet-5', model())).toBe(true);
  });

  it('matches models with vendor branding prefixes and parenthetical notes', () => {
    const grok = model({ id: 'x-ai/grok-4.5', name: 'xAI: Grok 4.5' });
    expect(matchesPlanModel('Cursor Grok 4.5', grok)).toBe(true);

    const seedLite = model({ id: 'bytedance-seed/seed-2.0-lite', name: 'ByteDance: Seed 2.0 Lite' });
    expect(matchesPlanModel('Dola-Seed-2.0-Lite', seedLite)).toBe(true);

    const glm = model({ id: 'z-ai/glm-5.3', name: 'Z.ai: GLM 5.3' });
    expect(matchesPlanModel('GLM-5.3 (Reasoning)', glm)).toBe(true);
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

  it('uses per-model token budgets over the tier pool when both models are listed', () => {
    // Test with real OpenRouter model names (vendor prefix and spaces)
    const flashModel = model({ id: 'z-ai/glm-5.3-flash', name: 'Z.ai: GLM 5.3 Flash' });
    const glmModel = model({ id: 'z-ai/glm-5.3', name: 'Z.ai: GLM 5.3' });
    const subPlan = plan({
      id: 'z-ai',
      name: 'Z.ai GLM Coding Plan',
      url: 'https://example.com/pricing',
      tiers: [
        tier({
          monthlyPrice: 168,
          models: ['GLM-5.3', 'GLM-5.3-Flash'],
          perModelTokenBudgets: {
            'glm-5.3': { estimatedMillionTokens: 2927, basis: 'official-table' },
            'glm-5.3-flash': { estimatedMillionTokens: 8864, basis: 'official-table' },
          },
          estimatedTokenBudget: { description: 'pool', estimatedMillionTokens: 2927, assumptions: 't' },
        }),
      ],
    } as Partial<CodingPlan>);
    const result = computeApplesToApples([glmModel, flashModel], [subPlan], 'all', 200, 0, 0.75);
    const rows = result.options.filter(o => o.type === 'subscription');
    const glmRow = rows.find(o => o.modelId === 'z-ai/glm-5.3');
    const flashRow = rows.find(o => o.modelId === 'z-ai/glm-5.3-flash');
    expect(glmRow).toBeDefined();
    expect(flashRow).toBeDefined();
    // Per-model native yields: GLM-5.3 drains at pool basis, Flash at 3.03x
    expect(glmRow!.rawMonthlyTokens).toBe(2927);
    expect(flashRow!.rawMonthlyTokens).toBe(8864);
    // Dedicated drain flags
    expect(glmRow!.isDedicatedDrain).toBe(true);
    expect(flashRow!.isDedicatedDrain).toBe(true);
    expect(flashRow!.drainBasis).toBe('official-table');
    // Requests scale with each model's resolved token capacity
    expect(flashRow!.rawMonthlyRequests).toBeGreaterThan(glmRow!.rawMonthlyRequests!);
    expect(flashRow!.monthlyRequests).toBeGreaterThan(glmRow!.monthlyRequests);
    // Normalized at $200 budget: tokensPerDollar * budget
    expect(glmRow!.monthlyTokens).toBeCloseTo((2927 / 168) * 200, 4);
    expect(flashRow!.monthlyTokens).toBeCloseTo((8864 / 168) * 200, 4);
  });

  it('falls back to the tier pool when no per-model entry matches', () => {
    const otherModel = model({ id: 'other/solo-model', name: 'Solo Model' });
    const subPlan = plan({
      tiers: [
        tier({
          monthlyPrice: 20,
          models: ['Solo Model'],
          perModelTokenBudgets: { 'claude sonnet': { estimatedMillionTokens: 99, basis: 'official-table' } },
          estimatedTokenBudget: { description: 'pool', estimatedMillionTokens: 10, assumptions: 't' },
        }),
      ],
    } as Partial<CodingPlan>);
    const result = computeApplesToApples([otherModel], [subPlan], 'all', 20, 0, 0.75);
    const sub = result.options.find(o => o.type === 'subscription');
    expect(sub!.rawMonthlyTokens).toBe(10);
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
    // Knapsack optimum at $30: A ($10, 10M) + C ($20, 15M) = 25M beats the
    // greedy A + B = 18M and the single D (not a bundle).
    expect(bundles[0].totalTokens).toBe(25);
    for (const bundle of bundles) {
      expect(bundle.totalPrice).toBeLessThanOrEqual(30);
      expect(bundle.components.length).toBeGreaterThanOrEqual(2);
      expect(bundle.components.length).toBeLessThanOrEqual(3);
      expect(new Set(bundle.components.map(c => c.planId)).size).toBe(bundle.components.length);
      expect(bundle.totalTokens).toBe(bundle.components.reduce((sum, c) => sum + c.tokens, 0));
    }
  });
});

describe('calculateTimeBlendedCost', () => {
  it('applies 80/20 off-peak 50% discount to deepseek models', () => {
    const dsModel = model({ id: 'deepseek/deepseek-v4.1-flash', provider: 'deepseek', blendedCost: 1.0 });
    const blended = calculateTimeBlendedCost(dsModel, 0.8);
    // 0.8 * 0.5 + 0.2 * 1.0 = 0.60 multiplier
    expect(blended).toBeCloseTo(0.60, 4);
  });

  it('leaves standard models unchanged', () => {
    const antModel = model({ id: 'anthropic/claude-sonnet-5', provider: 'anthropic', blendedCost: 4.0 });
    expect(calculateTimeBlendedCost(antModel, 0.8)).toBe(4.0);
  });
});

describe('calculatePoolDrain', () => {
  it('drains pool within budget when usage is under quota', () => {
    const testPlan = plan();
    const testTier = tier({
      monthlyPrice: 20,
      models: ['DeepSeek Flash', 'Claude Sonnet'],
      estimatedTokenBudget: { estimatedMillionTokens: 100, assumptions: 'test' }
    });
    const workload = [
      { modelId: 'deepseek-flash', modelName: 'DeepSeek Flash', share: 0.7, tokensMillion: 50, costPpu: 5 },
      { modelId: 'claude-sonnet', modelName: 'Claude Sonnet', share: 0.3, tokensMillion: 10, costPpu: 8 },
    ];
    const result = calculatePoolDrain(testPlan, testTier, workload);
    expect(result.isCapped).toBe(false);
    expect(result.overageCost).toBe(0);
    expect(result.totalPlanCost).toBe(20);
    expect(result.totalDirectCost).toBe(13);
    expect(result.poolUtilizedPercent).toBeLessThanOrEqual(100);
    expect(result.coverageType).toBe('full');
  });

  it('correctly calculates pay-per-use overage when usage exceeds plan allowance', () => {
    const testPlan = plan();
    // A tier with modelAllowances: e.g. OpenCode Go style with $15 allowance for expensive models
    const testTier = tier({
      monthlyPrice: 10,
      models: ['Claude Opus'],
      modelAllowances: { 'claude': 15 },
      estimatedTokenBudget: { estimatedMillionTokens: 50, assumptions: 'test' }
    });
    const workload = [
      { modelId: 'claude-opus', modelName: 'Claude Opus', share: 1.0, tokensMillion: 20, costPpu: 30 }
    ];
    const result = calculatePoolDrain(testPlan, testTier, workload);
    expect(result.isCapped).toBe(true);
    expect(result.coveredDirectCost).toBe(15);
    expect(result.overageCost).toBe(15); // 30 - 15 = 15 overage
    expect(result.totalPlanCost).toBe(25); // 10 sub + 15 overage
    expect(result.savings).toBe(5); // 30 direct - 25 plan
    expect(result.coverageType).toBe('full');
  });

  it('routes unsupported models entirely to direct pay-per-use overage', () => {
    const testPlan = plan();
    // Tier only supports Claude Sonnet
    const testTier = tier({
      monthlyPrice: 20,
      models: ['Claude Sonnet'],
      estimatedTokenBudget: { estimatedMillionTokens: 100, assumptions: 'test' }
    });
    // Workload includes unsupported DeepSeek Flash
    const workload = [
      { modelId: 'deepseek-flash', modelName: 'DeepSeek Flash', share: 0.5, tokensMillion: 50, costPpu: 10 },
      { modelId: 'claude-sonnet', modelName: 'Claude Sonnet', share: 0.5, tokensMillion: 5, costPpu: 5 },
    ];
    const result = calculatePoolDrain(testPlan, testTier, workload);
    // DeepSeek is unsupported, so it cannot be absorbed by the plan pool
    expect(result.coverageType).toBe('partial');
    expect(result.supportedModelsCount).toBe(1);
    expect(result.totalModelsCount).toBe(2);
    expect(result.overageCost).toBeGreaterThanOrEqual(10); // At least DeepSeek's $10 goes to overage
  });
});

describe('Adversarial Edge Cases & Guardrails', () => {
  it('correctly grants 0.0 multiplier when cachedInput is 0 (100% free cache reads)', () => {
    const freeCacheModel = model({
      pricing: { input: 3, output: 15, cachedInput: 0, cachedInputWrite: null, reasoning: null, webSearch: null },
    });
    expect(getEffectiveCacheMultiplier(freeCacheModel)).toBe(0);
  });

  it('respects real zero input price without falling back to blended cost', () => {
    const freePromptModel = model({
      blendedCost: 5,
      pricing: { input: 0, output: 10, cachedInput: null, cachedInputWrite: null, reasoning: null, webSearch: null },
    });
    const { costPerRequest } = calculateAgentRequestCost(freePromptModel, 0);
    // 20k fresh input * $0 + 1k output * $10/M = 1k * 10 / 1e6 = $0.01
    expect(costPerRequest).toBeCloseTo(0.01, 4);
  });

  it('matchesPlanModel rejects empty strings, whitespace, and short junk', () => {
    const testModel = model();
    expect(matchesPlanModel('', testModel)).toBe(false);
    expect(matchesPlanModel('   ', testModel)).toBe(false);
    expect(matchesPlanModel('--', testModel)).toBe(false);
    expect(matchesPlanModel('Claude Sonnet 5', testModel)).toBe(true);
  });

  it('safely handles NaN and non-positive budget in knapsack and Dave stacks', () => {
    const candidates: StackCandidate[] = [
      {
        planId: 'p1',
        planName: 'Plan 1',
        planCategory: 'coding-ide',
        planUrl: 'https://example.com',
        tierName: 'Pro',
        modelName: 'Model 1',
        modelId: 'm1',
        price: 20,
        tokens: 10,
        requests: 500,
        codingIndex: 75,
        lab: 'all',
        stackingPolicy: 'allowed',
      },
    ];

    expect(computeMixAndMatch(candidates, NaN)).toEqual([]);
    expect(computeMixAndMatch(candidates, -50)).toEqual([]);
    expect(computeMixAndMatch(candidates, 0)).toEqual([]);

    expect(computeDaveStacks(candidates, NaN)).toEqual([]);
    expect(computeDaveStacks(candidates, -50)).toEqual([]);
    expect(computeDaveStacks(candidates, 0)).toEqual([]);

    expect(calculateBudgetResults([model()], NaN)).toEqual([]);
    expect(calculateBudgetResults([model()], -10)).toEqual([]);
  });
});

