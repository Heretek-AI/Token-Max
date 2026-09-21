import { describe, it, expect } from 'vitest';
import {
  simulateSprintThrottle,
  simulateAllProfiles,
  CADENCE_DEFINITIONS,
} from './throttle';
import { THROTTLE_PROFILES, type ThrottleProfile } from './throttle-profiles';

describe('Throttle Simulation Engine', () => {
  const getProfile = (id: string): ThrottleProfile => {
    const found = THROTTLE_PROFILES.find((p) => p.id === id);
    if (!found) throw new Error(`Profile ${id} not found`);
    return found;
  };

  it('correctly reports cadence definitions', () => {
    expect(CADENCE_DEFINITIONS.rapid.turnsPerHourPerAgent).toBe(120);
    expect(CADENCE_DEFINITIONS.standard.turnsPerHourPerAgent).toBe(30);
    expect(CADENCE_DEFINITIONS.deep.turnsPerHourPerAgent).toBe(12);
  });

  it('flags immediate concurrency queue when parallel agents exceed profile limit', () => {
    const cursor = getProfile('cursor-pro');
    // 3 parallel agents on Cursor Pro (maxConcurrency = 1)
    const result = simulateSprintThrottle(cursor, {
      concurrency: 3,
      sprintDurationHours: 1,
      turnPace: 'standard',
    });

    expect(result.status).toBe('queued');
    expect(result.timeToFirstThrottle).toContain('5m');
    expect(result.throttleReason).toContain('Concurrency queued');
    expect(result.slowTurnsCompleted).toBeGreaterThan(0);
  });

  it('smoothly completes a solo standard sprint on Cursor Pro without exhausting fast requests', () => {
    const cursor = getProfile('cursor-pro');
    // 1 agent, 2 hours, standard pace (30 turns/hour = 60 turns total)
    // Starting with 500 fast requests and 20% prior usage = 400 available
    const result = simulateSprintThrottle(cursor, {
      concurrency: 1,
      sprintDurationHours: 2,
      turnPace: 'standard',
      priorMonthlyUsagePercent: 20,
    });

    expect(result.status).toBe('smooth');
    expect(result.survivalHours).toBe(2);
    expect(result.timeToFirstThrottle).toBeNull();
    expect(result.fastTurnsCompleted).toBe(60);
    expect(result.slowTurnsCompleted).toBe(0);
    expect(result.blockedTurns).toBe(0);
    expect(result.headroomScore).toBeGreaterThanOrEqual(90);
  });

  it('detects rolling 5-hour pool cliff on Claude Code Pro under rapid pace', () => {
    const claudeCode = getProfile('claude-code-pro');
    // 1 agent, rapid pace (120 turns/hour)
    // Claude Code Pro has 60 rolling turns per 5h window
    const result = simulateSprintThrottle(claudeCode, {
      concurrency: 1,
      sprintDurationHours: 4,
      turnPace: 'rapid',
    });

    expect(result.status).toBe('blocked');
    // 120 turns/h = 10 turns every 5 min. 60 turns reached around 30 minutes!
    expect(result.survivalHours).toBeLessThanOrEqual(1.0);
    expect(result.blockedTurns).toBeGreaterThan(0);
    expect(result.throttleReason).toContain('Rolling 5h window exhausted');
  });

  it('allows Claude Code Pro to complete when turn cadence is deep thinking', () => {
    const claudeCode = getProfile('claude-code-pro');
    // 1 agent, deep pace (12 turns/hour) for 4 hours = 48 turns < 60 turns
    const result = simulateSprintThrottle(claudeCode, {
      concurrency: 1,
      sprintDurationHours: 4,
      turnPace: 'deep',
    });

    expect(result.status).toBe('smooth');
    expect(result.survivalHours).toBe(4);
    expect(result.blockedTurns).toBe(0);
    expect(result.timeToFirstThrottle).toBeNull();
  });

  it('demonstrates DeepSeek API high concurrency resilience', () => {
    const deepseekFlash = getProfile('deepseek-api-flash');
    // 8 parallel agents, 4 hours, rapid pace (8 * 120 * 4 = 3,840 turns)
    const result = simulateSprintThrottle(deepseekFlash, {
      concurrency: 8,
      sprintDurationHours: 4,
      turnPace: 'rapid',
    });

    expect(result.status).toBe('smooth');
    expect(result.survivalHours).toBe(4);
    expect(result.fastTurnsCompleted).toBe(3840);
    expect(result.blockedTurns).toBe(0);
    expect(result.headroomScore).toBe(100);
  });

  it('detects monthly fast request pool exhaustion and degrades to slow queue', () => {
    const cursor = getProfile('cursor-pro');
    // 1 agent, 4 hours, rapid pace (120 turns/h * 4h = 480 turns)
    // Starting with 80% consumed (only 100 fast requests remaining)
    const result = simulateSprintThrottle(cursor, {
      concurrency: 1,
      sprintDurationHours: 4,
      turnPace: 'rapid',
      priorMonthlyUsagePercent: 80, // 100 fast reqs left
    });

    expect(result.status).toBe('queued');
    expect(result.slowTurnsCompleted).toBeGreaterThan(0);
    expect(result.throttleReason).toContain('Monthly fast pool exhausted');
  });

  it('ranks profiles with smooth plans ahead of blocked plans in simulateAllProfiles', () => {
    const results = simulateAllProfiles({
      concurrency: 4,
      sprintDurationHours: 4,
      turnPace: 'standard',
    });

    expect(results.length).toBe(THROTTLE_PROFILES.length);

    // Verify first result is smooth or queued, and blocked ones are ranked lower
    const firstBlockedIndex = results.findIndex((r) => r.status === 'blocked');
    const lastSmoothIndex = results.findLastIndex((r) => r.status === 'smooth');

    if (firstBlockedIndex !== -1 && lastSmoothIndex !== -1) {
      expect(lastSmoothIndex).toBeLessThan(firstBlockedIndex);
    }
  });
});

describe('Payg-overage simulation (VULN-03)', () => {
  const getProfile = (id: string): ThrottleProfile => {
    const found = THROTTLE_PROFILES.find((p) => p.id === id);
    if (!found) throw new Error(`Profile ${id} not found`);
    return found;
  };

  it('flags Google AI Pro as paid overage instead of infinitely smooth under saturating load', () => {
    const googlePro = getProfile('google-ai-pro');
    // 8 agents at rapid cadence burn through the 90-turn / 5h window fast.
    const result = simulateSprintThrottle(googlePro, {
      concurrency: 8,
      sprintDurationHours: 4,
      turnPace: 'rapid',
    });

    expect(result.status).toBe('overage');
    expect(result.overageTurns).toBeGreaterThan(0);
    expect(result.throttleReason).not.toBeNull();
  });

  it('never shows overage for plans that simply survive the sprint', () => {
    const claudeCode = getProfile('claude-code-pro');
    const result = simulateSprintThrottle(claudeCode, {
      concurrency: 1,
      sprintDurationHours: 2,
      turnPace: 'deep',
    });
    expect(result.status).toBe('smooth');
    expect(result.overageTurns).toBe(0);
  });
});
