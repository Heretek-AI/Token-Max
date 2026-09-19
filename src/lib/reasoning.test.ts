import { describe, it, expect } from 'vitest';
import {
  calculateReasoningCost,
  calculateMonthlyReasoningWorkload,
  REASONING_EFFORT_SPECS,
  PLAN_ABSORPTION_POLICIES,
} from './reasoning';
import type { NormalizedModel } from './types';

describe('Extended Thinking & Reasoning Token Engine', () => {
  const dummySonnet: NormalizedModel = {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    series: 'Claude',
    modality: 'text->text',
    contextWindow: 200000,
    maxOutput: 8192,
    pricing: {
      input: 3.0,
      output: 15.0,
      cachedInput: 0.3,
      cachedInputWrite: 3.75,
      reasoning: null,
      webSearch: null,
    },
    blendedCost: 6.0,
    agentBlendedCost: 1.5,
    costPer1kRequests: 30.0,
    benchmarks: {
      intelligenceIndex: 88,
      codingIndex: 85,
      agenticIndex: 84,
      valueScore: 78,
    },
    reasoning: {
      mandatory: false,
      defaultEnabled: false,
      supportedEfforts: ['low', 'medium', 'high', 'max'],
    },
    isFree: false,
    isBatch: false,
  };

  const dummyR1: NormalizedModel = {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'deepseek',
    series: 'DeepSeek',
    modality: 'text->text',
    contextWindow: 128000,
    maxOutput: 8192,
    pricing: {
      input: 0.55,
      output: 2.19,
      cachedInput: 0.14,
      cachedInputWrite: null,
      reasoning: 2.19,
      webSearch: null,
    },
    blendedCost: 0.96,
    agentBlendedCost: 0.28,
    costPer1kRequests: 5.8,
    benchmarks: {
      intelligenceIndex: 86,
      codingIndex: 83,
      agenticIndex: 82,
      valueScore: 92,
    },
    reasoning: {
      mandatory: true,
      defaultEnabled: true,
      supportedEfforts: ['low', 'medium', 'high'],
    },
    isFree: false,
    isBatch: false,
  };

  it('correctly maps reasoning effort token tiers', () => {
    expect(REASONING_EFFORT_SPECS.off.tokens).toBe(0);
    expect(REASONING_EFFORT_SPECS.low.tokens).toBe(2000);
    expect(REASONING_EFFORT_SPECS.medium.tokens).toBe(8000);
    expect(REASONING_EFFORT_SPECS.high.tokens).toBe(24000);
    expect(REASONING_EFFORT_SPECS.max.tokens).toBe(48000);
  });

  it('produces zero reasoning cost when effort is off', () => {
    const result = calculateReasoningCost(dummySonnet, 0.75, 'off');
    expect(result.reasoningTokens).toBe(0);
    expect(result.reasoningCost).toBe(0);
    expect(result.inflationMultiplier).toBe(1.0);
    expect(result.totalCost).toBe(result.baseCost);
  });

  it('calculates significant cost inflation on Claude Sonnet at medium effort', () => {
    // 8,000 reasoning tokens at $15/M = 8000 * 15 / 1e6 = $0.12 reasoning cost
    const result = calculateReasoningCost(dummySonnet, 0.75, 'medium');
    expect(result.reasoningTokens).toBe(8000);
    expect(result.reasoningCost).toBeCloseTo(0.12, 4);
    expect(result.inflationMultiplier).toBeGreaterThan(4.0);
  });

  it('calculates massive inflation at high effort (24,000 tokens)', () => {
    // 24,000 reasoning tokens at $15/M = 24000 * 15 / 1e6 = $0.36 reasoning cost
    const result = calculateReasoningCost(dummySonnet, 0.75, 'high');
    expect(result.reasoningTokens).toBe(24000);
    expect(result.reasoningCost).toBeCloseTo(0.36, 4);
    expect(result.inflationMultiplier).toBeGreaterThan(10.0);
  });

  it('demonstrates DeepSeek-R1 economic efficiency even with reasoning', () => {
    // DeepSeek R1 reasoning tokens are $2.19/M output
    const sonnetMedium = calculateReasoningCost(dummySonnet, 0.75, 'medium');
    const r1Medium = calculateReasoningCost(dummyR1, 0.75, 'medium');

    expect(r1Medium.reasoningCost).toBeLessThan(sonnetMedium.reasoningCost * 0.2); // >80% cheaper
  });

  it('computes monthly aggregated workload spend with reasoning tax', () => {
    const workload = calculateMonthlyReasoningWorkload(dummySonnet, 1000, 0.75, 'medium');
    expect(workload.turns).toBe(1000);
    expect(workload.reasoningTokensMillion).toBe(8.0);
    expect(workload.monthlyReasoningTax).toBeCloseTo(120.0, 1); // 1000 * $0.12 = $120/mo extra
    expect(workload.monthlyTotalCost).toBe(workload.monthlyBaseCost + workload.monthlyReasoningTax);
  });

  it('validates plan absorption policies and ranks correctly', () => {
    expect(PLAN_ABSORPTION_POLICIES.length).toBeGreaterThanOrEqual(7);

    const cursor = PLAN_ABSORPTION_POLICIES.find((p) => p.planId === 'cursor-pro');
    expect(cursor?.absorptionType).toBe('full-absorption');
    expect(cursor?.absorptionScore).toBeGreaterThanOrEqual(90);

    const anthropicApi = PLAN_ABSORPTION_POLICIES.find((p) => p.planId === 'anthropic-api-thinking');
    expect(anthropicApi?.absorptionType).toBe('pass-through');
    expect(anthropicApi?.absorptionScore).toBeLessThanOrEqual(40);
  });
});
