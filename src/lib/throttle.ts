import {
  type ThrottleProfile,
  type ThrottleStatus,
  THROTTLE_PROFILES,
} from './throttle-profiles';

export type TurnCadence = 'rapid' | 'standard' | 'deep';

export interface CadenceDefinition {
  id: TurnCadence;
  label: string;
  secondsPerTurn: number;
  turnsPerHourPerAgent: number;
  description: string;
}

export const CADENCE_DEFINITIONS: Record<TurnCadence, CadenceDefinition> = {
  rapid: {
    id: 'rapid',
    label: 'Rapid Autonomous Loop',
    secondsPerTurn: 30,
    turnsPerHourPerAgent: 120,
    description: '1 turn every 30s per agent (autonomous test-fix or multi-agent execution)',
  },
  standard: {
    id: 'standard',
    label: 'Standard Interactive Pair',
    secondsPerTurn: 120,
    turnsPerHourPerAgent: 30,
    description: '1 turn every 2m per agent (developer review, diff inspection, and verification)',
  },
  deep: {
    id: 'deep',
    label: 'Deep Architectural Reasoning',
    secondsPerTurn: 300,
    turnsPerHourPerAgent: 12,
    description: '1 turn every 5m per agent (large-repo indexing and extended thinking)',
  },
};

export interface SprintSimulationParams {
  concurrency: number; // 1 to 10
  sprintDurationHours: number; // 1 to 8
  turnPace: TurnCadence;
  /** Percentage of monthly fast requests already consumed before sprint starts (0 to 90, default 20) */
  priorMonthlyUsagePercent?: number;
}

export interface SimulationTimelinePoint {
  minute: number;
  timeLabel: string;
  cumulativeTurns: number;
  rollingWindowTurns: number;
  instantStatus: ThrottleStatus;
  queueDelaySec: number;
}

export interface SimulationResult {
  profile: ThrottleProfile;
  status: ThrottleStatus;
  survivalHours: number;
  timeToFirstThrottle: string | null;
  throttleReason: string | null;
  totalTurnsRequested: number;
  fastTurnsCompleted: number;
  slowTurnsCompleted: number;
  blockedTurns: number;
  /** Turns billed as paid overage when a payg-overage profile crossed its quota ceiling. */
  overageTurns: number;
  effectiveThroughputPercent: number;
  headroomScore: number; // 0 to 100
  timeline: SimulationTimelinePoint[];
}

function formatMinutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Severity rank so the sprint's overall status always reflects the worst outcome. */
const STATUS_SEVERITY: Record<ThrottleStatus, number> = { smooth: 0, queued: 1, overage: 2, blocked: 3 };

/**
 * Runs a discrete time-step simulation (step = 5 minutes) of an intensive coding sprint
 * against a given throttle profile.
 */
export function simulateSprintThrottle(
  profile: ThrottleProfile,
  params: SprintSimulationParams
): SimulationResult {
  const { concurrency, sprintDurationHours, turnPace, priorMonthlyUsagePercent = 20 } = params;
  const safePace = turnPace in CADENCE_DEFINITIONS ? turnPace : 'standard';
  const cadence = CADENCE_DEFINITIONS[safePace];
  const safeDuration = Number.isFinite(sprintDurationHours) && sprintDurationHours > 0 ? sprintDurationHours : 1;
  const safeConcurrency = Number.isFinite(concurrency) && concurrency > 0 ? Math.round(concurrency) : 1;

  const stepMinutes = 5;
  const totalMinutes = Math.max(stepMinutes, Math.round(safeDuration * 60));
  const turnsPerMinutePerAgent = 60 / cadence.secondsPerTurn;
  const turnsPerStepPerAgent = turnsPerMinutePerAgent * stepMinutes;
  const turnsPerStep = turnsPerStepPerAgent * safeConcurrency;

  // Monthly fast request starting balance
  let remainingMonthlyFast = profile.monthlyFastRequests !== null
    ? Math.max(0, Math.round(profile.monthlyFastRequests * (1 - priorMonthlyUsagePercent / 100)))
    : null;

  // History buffer for rolling window check (stores turns completed per minute)
  // Window length in minutes
  const rollingWindowMinutes = profile.rollingWindowHours !== null
    ? profile.rollingWindowHours * 60
    : null;
  const rollingWindowHistory: { minute: number; turns: number }[] = [];

  let overallStatus: ThrottleStatus = 'smooth';
  let firstThrottleMinute: number | null = null;
  let firstThrottleReason: string | null = null;

  let fastTurnsCompleted = 0;
  let slowTurnsCompleted = 0;
  let blockedTurns = 0;
  let cumulativeTurns = 0;
  // Deferred turns from prior queue delays (VULN-12): a queued step cannot
  // magically complete its full turn allocation; the backlog spills into
  // later steps and reduces throughput realistically.
  let deferredTurns = 0;
  let overageTurns = 0;

  const timeline: SimulationTimelinePoint[] = [
    {
      minute: 0,
      timeLabel: '0h 00m',
      cumulativeTurns: 0,
      rollingWindowTurns: 0,
      instantStatus: 'smooth',
      queueDelaySec: 0,
    },
  ];

  // Immediate concurrency check: if parallel agents exceed the profile's max concurrency
  const hasConcurrencyViolation = safeConcurrency > profile.maxConcurrency;

  for (let currentMinute = stepMinutes; currentMinute <= totalMinutes; currentMinute += stepMinutes) {
    // Queue-delay backlog reduces the turns actually executable this step.
    // A 30s/turn slow-queue delay over a 5-minute step caps the step at
    // floor(step / delay) full-speed-equivalent allocations; the deficit is
    // deferred, not silently completed (VULN-12).
    let turnsAttempted = turnsPerStep;
    let stepStatus: ThrottleStatus = 'smooth';
    let stepDelay = 0;

    if (deferredTurns > 0) {
      if (profile.exhaustionBehavior === 'hard-block') {
        // Blocked turns never recover; drop the backlog.
        deferredTurns = 0;
      } else if (profile.slowQueueDelaySec > 0) {
        const executableRatio = Math.min(1, (stepMinutes * 60) / (profile.slowQueueDelaySec * turnsPerStepPerAgent * safeConcurrency * safeConcurrency));
        const executable = Math.max(1, Math.floor(turnsPerStep * executableRatio));
        turnsAttempted = Math.min(turnsPerStep, executable);
        deferredTurns = Math.max(0, deferredTurns - (turnsPerStep - turnsAttempted));
        stepStatus = 'queued';
        stepDelay = profile.slowQueueDelaySec;
      }
    }

    // 1. Check instantaneous concurrency
    if (hasConcurrencyViolation) {
      if (profile.exhaustionBehavior === 'hard-block') {
        stepStatus = 'blocked';
        if (!firstThrottleReason) {
          firstThrottleReason = `Concurrency ceiling hit: ${safeConcurrency} parallel agents exceed limit of ${profile.maxConcurrency}`;
        }
      } else {
        stepStatus = 'queued';
        stepDelay = profile.slowQueueDelaySec * (safeConcurrency - profile.maxConcurrency);
        if (!firstThrottleReason) {
          firstThrottleReason = `Concurrency queued: ${safeConcurrency} agents exceed limit of ${profile.maxConcurrency}, queuing excess requests`;
        }
      }
    }

    // 2. Check rolling window if applicable
    let turnsInRollingWindow = 0;
    if (rollingWindowMinutes !== null) {
      const windowStart = currentMinute - rollingWindowMinutes;
      // Filter out turns outside window
      while (rollingWindowHistory.length > 0 && rollingWindowHistory[0].minute <= windowStart) {
        rollingWindowHistory.shift();
      }
      turnsInRollingWindow = rollingWindowHistory.reduce((sum, item) => sum + item.turns, 0);

      if (profile.rollingWindowTurns !== null && turnsInRollingWindow + turnsAttempted > profile.rollingWindowTurns) {
        if (profile.exhaustionBehavior === 'hard-block') {
          stepStatus = 'blocked';
          if (!firstThrottleReason) {
            firstThrottleReason = `Rolling ${profile.rollingWindowHours}h window exhausted: reached ceiling of ${profile.rollingWindowTurns} turns`;
          }
        } else if (profile.exhaustionBehavior === 'slow-queue') {
          stepStatus = 'queued';
          stepDelay = Math.max(stepDelay, profile.slowQueueDelaySec);
          if (!firstThrottleReason) {
            firstThrottleReason = `Rolling ${profile.rollingWindowHours}h window exceeded: degraded to slow queue`;
          }
        } else if (profile.exhaustionBehavior === 'payg-overage') {
          // PAYG profiles never block; excess turns bill as paid overage (VULN-03).
          stepStatus = 'overage';
          if (!firstThrottleReason) {
            firstThrottleReason = `Rolling ${profile.rollingWindowHours}h window exceeded: excess turns continue as paid overage`;
          }
        }
      }
    }

    // 3. Check monthly fast request pool if applicable
    if (remainingMonthlyFast !== null) {
      if (remainingMonthlyFast < turnsAttempted) {
        if (profile.exhaustionBehavior === 'slow-queue') {
          stepStatus = 'queued';
          stepDelay = Math.max(stepDelay, profile.slowQueueDelaySec);
          if (!firstThrottleReason) {
            firstThrottleReason = `Monthly fast pool exhausted (${profile.monthlyFastRequests} reqs): dropped to slow queue`;
          }
        } else if (profile.exhaustionBehavior === 'hard-block') {
          stepStatus = 'blocked';
          if (!firstThrottleReason) {
            firstThrottleReason = `Monthly fast pool exhausted (${profile.monthlyFastRequests} reqs): sprint blocked`;
          }
        } else if (profile.exhaustionBehavior === 'payg-overage') {
          if (!firstThrottleReason) {
            firstThrottleReason = `Monthly pool exhausted (${profile.monthlyFastRequests} reqs): excess turns continue as paid overage`;
          }
          stepStatus = 'overage';
        }
      }
    }

    // Process turns for this step
    if (stepStatus === 'blocked') {
      blockedTurns += turnsAttempted;
      if (STATUS_SEVERITY['blocked'] > STATUS_SEVERITY[overallStatus]) {
        overallStatus = 'blocked';
      }
      if (firstThrottleMinute === null) {
        firstThrottleMinute = currentMinute;
      }
    } else if (stepStatus === 'overage') {
      // Served beyond quota — turns complete but bill as paid overage (VULN-03).
      overageTurns += turnsAttempted;
      cumulativeTurns += turnsAttempted;
      rollingWindowHistory.push({ minute: currentMinute, turns: turnsAttempted });
      if (remainingMonthlyFast !== null) {
        remainingMonthlyFast = Math.max(0, remainingMonthlyFast - turnsAttempted);
      }
      if (STATUS_SEVERITY['overage'] > STATUS_SEVERITY[overallStatus]) {
        overallStatus = 'overage';
      }
      if (firstThrottleMinute === null) {
        firstThrottleMinute = currentMinute;
      }
    } else if (stepStatus === 'queued') {
      // Queue degradation defers the un-executable share of this step's turns.
      const deferred = Math.max(0, turnsAttempted - Math.max(1, Math.floor(turnsPerStep * 0.7)));
      deferredTurns += deferred;
      slowTurnsCompleted += turnsAttempted;
      cumulativeTurns += turnsAttempted;
      if (profile.exhaustionBehavior === 'payg-overage') {
        overageTurns += turnsAttempted;
      }
      rollingWindowHistory.push({ minute: currentMinute, turns: turnsAttempted });
      if (remainingMonthlyFast !== null) {
        remainingMonthlyFast = Math.max(0, remainingMonthlyFast - turnsAttempted);
      }
      if (STATUS_SEVERITY['queued'] > STATUS_SEVERITY[overallStatus]) {
        overallStatus = 'queued';
      }
      if (firstThrottleMinute === null) {
        firstThrottleMinute = currentMinute;
      }
    } else {
      // Smooth step
      fastTurnsCompleted += turnsAttempted;
      cumulativeTurns += turnsAttempted;
      if (profile.exhaustionBehavior === 'payg-overage' && firstThrottleReason !== null) {
        // Once a PAYG ceiling was crossed, all subsequent turns bill as overage.
        overageTurns += turnsAttempted;
      }
      rollingWindowHistory.push({ minute: currentMinute, turns: turnsAttempted });
      if (remainingMonthlyFast !== null) {
        remainingMonthlyFast = Math.max(0, remainingMonthlyFast - turnsAttempted);
      }
    }

    timeline.push({
      minute: currentMinute,
      timeLabel: formatMinutesToHours(currentMinute),
      cumulativeTurns: Math.round(cumulativeTurns),
      rollingWindowTurns: Math.round(turnsInRollingWindow + (stepStatus === 'blocked' ? 0 : turnsAttempted)),
      instantStatus: stepStatus,
      queueDelaySec: stepDelay,
    });
  }

  const totalTurnsRequested = Math.round(turnsPerStep * (totalMinutes / stepMinutes));
  const survivalMinutes = firstThrottleMinute !== null ? firstThrottleMinute : totalMinutes;
  const survivalHours = Number((survivalMinutes / 60).toFixed(1));

  // Calculate effective throughput percentage
  const effectiveThroughputPercent = totalTurnsRequested > 0
    ? Math.round(((fastTurnsCompleted + slowTurnsCompleted * 0.7) / totalTurnsRequested) * 100)
    : 100;

  // Headroom score (0-100)
  let headroomScore = 100;
  if (overallStatus === 'blocked') {
    // Score based on how far into the sprint we survived before hard block
    headroomScore = totalMinutes > 0 ? Math.max(5, Math.round((survivalMinutes / totalMinutes) * 40)) : 5;
  } else if (overallStatus === 'queued') {
    // Survived, but experienced queue delays
    const slowFraction = slowTurnsCompleted / (fastTurnsCompleted + slowTurnsCompleted || 1);
    headroomScore = Math.round(50 + (1 - slowFraction) * 40);
  } else {
    // Fully smooth: deduct minor points if running close to concurrency or window capacity
    let capacityPressure = 0;
    if (profile.rollingWindowTurns !== null && profile.rollingWindowTurns > 0 && rollingWindowMinutes !== null) {
      const peakWindowTurns = Math.max(...timeline.map((t) => t.rollingWindowTurns));
      capacityPressure = Math.min(1, peakWindowTurns / profile.rollingWindowTurns);
    }
    headroomScore = Math.max(90, Math.round(100 - capacityPressure * 10));
  }

  return {
    profile,
    status: overallStatus,
    survivalHours,
    timeToFirstThrottle: firstThrottleMinute !== null
      ? `${formatMinutesToHours(firstThrottleMinute)} (Turn ~${Math.round((firstThrottleMinute / totalMinutes) * totalTurnsRequested)})`
      : null,
    throttleReason: firstThrottleReason,
    totalTurnsRequested,
    fastTurnsCompleted: Math.round(fastTurnsCompleted),
    slowTurnsCompleted: Math.round(slowTurnsCompleted),
    blockedTurns: Math.round(blockedTurns),
    effectiveThroughputPercent: Math.min(100, Math.max(0, effectiveThroughputPercent)),
    headroomScore: Math.min(100, Math.max(0, headroomScore)),
    overageTurns: Math.round(overageTurns),
    timeline,
  };
}

/**
 * Simulates all registered profiles against the requested sprint parameters and ranks them.
 */
export function simulateAllProfiles(params: SprintSimulationParams): SimulationResult[] {
  const results = THROTTLE_PROFILES.map((profile) => simulateSprintThrottle(profile, params));

  // Sort order:
  // 1. Smooth before Queued before Overage before Blocked
  // 2. Higher headroom score
  // 3. Longer survival hours
  // 4. Lower monthly price
  return results.sort((a, b) => {
    const statusWeight = { smooth: 4, queued: 3, overage: 2, blocked: 1 };
    if (statusWeight[a.status] !== statusWeight[b.status]) {
      return statusWeight[b.status] - statusWeight[a.status];
    }
    if (b.headroomScore !== a.headroomScore) {
      return b.headroomScore - a.headroomScore;
    }
    if (b.survivalHours !== a.survivalHours) {
      return b.survivalHours - a.survivalHours;
    }
    const priceA = a.profile.monthlyPrice ?? 999;
    const priceB = b.profile.monthlyPrice ?? 999;
    return priceA - priceB;
  });
}
