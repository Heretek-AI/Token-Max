import { describe, it, expect } from 'vitest';
import { classifyTraining, classifyGotcha, getIndemnityInfo, trainingBadge } from './tos';
import type { CodingPlan } from './types';

function plan(overrides: Partial<CodingPlan> = {}): CodingPlan {
  return {
    id: 'test',
    name: 'Test',
    category: 'coding-ide',
    url: 'https://example.com',
    lastVerified: '2026-09-18',
    tiers: [{ name: 'Pro', monthlyPrice: 20, limits: { a: 'b' }, models: ['M'], estimatedTokenBudget: { description: 'd', estimatedMillionTokens: 1, assumptions: 'a' } }],
    gotchas: ['g'],
    tosHighlights: [],
    dataTraining: 'No',
    ipIndemnity: false,
    ...overrides,
  };
}

describe('classifyTraining', () => {
  it('does not treat "Not published" as no-training', () => {
    const c = classifyTraining(plan({ dataTraining: 'Not published on pricing page' }));
    expect(c.free).toBe('unknown');
    expect(c.individual).toBe('unknown');
    expect(c.enterprise).toBe('unknown');
  });

  it('does not treat "No guarantee" as no-training', () => {
    const c = classifyTraining(plan({ id: 'x', dataTraining: 'No guarantee on personal plans; Team plans shielded' }));
    expect(c.individual).not.toBe('no-training');
  });

  it('classifies an unconditional "No" as no-training', () => {
    const c = classifyTraining(plan({ dataTraining: 'No' }));
    expect(c.individual).toBe('no-training');
    expect(c.enterprise).toBe('no-training');
  });

  it('classifies tabnine-style "never occurs" as no-training, not trains', () => {
    const c = classifyTraining(plan({ id: 'tabnine', dataTraining: 'Training never occurs on customer code' }));
    expect(c.individual).toBe('no-training');
  });

  it('applies curated overrides for mixed-tier policies', () => {
    const copilot = classifyTraining(plan({ id: 'github-copilot', dataTraining: 'Opt-out available (individual); excluded on Business/Enterprise' }));
    expect(copilot.free).toBe('trains');
    expect(copilot.individual).toBe('opt-out');
    expect(copilot.enterprise).toBe('no-training');
  });
});

describe('getIndemnityInfo', () => {
  it('labels boolean true as full indemnity', () => {
    expect(getIndemnityInfo(plan({ ipIndemnity: true })).label).toBe('Full Indemnity');
  });

  it('labels z-ai-style strings as enterprise only', () => {
    expect(getIndemnityInfo(plan({ ipIndemnity: 'Enterprise Team contracts only' })).label).toBe('Enterprise Only');
  });

  it('labels an unknown string as unclear rather than none', () => {
    expect(getIndemnityInfo(plan({ ipIndemnity: 'Full indemnity on all paid plans' })).label).toBe('Full Indemnity');
  });
});

describe('classifyGotcha', () => {
  it('classifies reseller/suspension gotchas as restrictions, not IP legal', () => {
    const c = classifyGotcha('Subscriptions are only sold directly via cursor.com; resellers are unauthorized and may be suspended');
    expect(c.category).toBe('restrictions');
    expect(c.severity).toBe('critical');
  });

  it('catches "suspension" as well as "suspend"', () => {
    const c = classifyGotcha('Using third-party software/tools against Antigravity OAuth breaches the ToS and can lead to account suspension');
    expect(c.category).toBe('restrictions');
    expect(c.severity).toBe('critical');
  });

  it('does not match "ip" inside "subscriptions"', () => {
    const c = classifyGotcha('Max Mode and fast-request tiers exist only for grandfathered legacy subscriptions');
    expect(c.category).not.toBe('ip-legal');
  });

  it('classifies non-refundable clauses as billing', () => {
    const c = classifyGotcha('Subscriptions are non-refundable once purchased');
    expect(c.category).toBe('billing');
    expect(c.severity).toBe('warning');
  });

  it('classifies account sharing bans as restrictions', () => {
    const c = classifyGotcha('Account sharing and multi-user access are prohibited');
    expect(c.category).toBe('restrictions');
    expect(c.severity).toBe('critical');
  });
});

describe('trainingBadge', () => {
  it('maps statuses to tones', () => {
    expect(trainingBadge('no-training').tone).toBe('success');
    expect(trainingBadge('trains').tone).toBe('danger');
    expect(trainingBadge('opt-out').tone).toBe('warning');
    expect(trainingBadge('unknown').tone).toBe('muted');
  });
});
