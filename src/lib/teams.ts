import type { NormalizedModel } from './types';
import { calculateAgentRequestCost } from './pricing';

export type DeveloperPersonaId = 'casual' | 'standard' | 'power';

export interface DeveloperPersona {
  id: DeveloperPersonaId;
  name: string;
  description: string;
  monthlyCompletions: number;
  monthlyChats: number;
  monthlyAgentTurns: number;
  monthlyTokensMillion: number;
  /** Estimated monthly cost on direct pay-as-you-go API (e.g. OpenRouter / DeepSeek / Sonnet blend) */
  estimatedDirectApiCost: number;
}

export const DEVELOPER_PERSONAS: Record<DeveloperPersonaId, DeveloperPersona> = {
  casual: {
    id: 'casual',
    name: 'Casual / Autocomplete Dev',
    description: 'Relies primarily on tab code completion with occasional quick syntax chats. Light daily usage.',
    monthlyCompletions: 600,
    monthlyChats: 40,
    monthlyAgentTurns: 20,
    monthlyTokensMillion: 2.0,
    estimatedDirectApiCost: 3.80, // ~$3.80/mo
  },
  standard: {
    id: 'standard',
    name: 'Interactive Pair Programmer',
    description: 'Active conversational coding, unit test generation, and pull request diff reviews.',
    monthlyCompletions: 1200,
    monthlyChats: 200,
    monthlyAgentTurns: 250,
    monthlyTokensMillion: 8.5,
    estimatedDirectApiCost: 16.50, // ~$16.50/mo
  },
  power: {
    id: 'power',
    name: 'Autonomous Agent Power User',
    description: 'Executes parallel subagent loops, repo-wide refactorings, and multi-file framework migrations.',
    monthlyCompletions: 2000,
    monthlyChats: 500,
    monthlyAgentTurns: 1200,
    monthlyTokensMillion: 36.0,
    estimatedDirectApiCost: 78.00, // ~$78.00/mo
  },
};

export interface SeatProvider {
  id: string;
  name: string;
  monthlySeatPrice: number;
  annualSeatPrice: number; // per user per year
  tierName: string;
  url: string;
}

export const SEAT_PROVIDERS: SeatProvider[] = [
  {
    id: 'cursor-business',
    name: 'Cursor Business',
    monthlySeatPrice: 40,
    annualSeatPrice: 384, // $32/mo billed annually
    tierName: 'Business',
    url: 'https://cursor.com/pricing',
  },
  {
    id: 'github-copilot-business',
    name: 'GitHub Copilot Business',
    monthlySeatPrice: 19,
    annualSeatPrice: 228,
    tierName: 'Business',
    url: 'https://github.com/features/copilot',
  },
  {
    id: 'claude-code-team',
    name: 'Claude Code Team',
    monthlySeatPrice: 30,
    annualSeatPrice: 300,
    tierName: 'Team',
    url: 'https://claude.com/pricing',
  },
  {
    id: 'windsurf-teams',
    name: 'Windsurf Teams',
    monthlySeatPrice: 40,
    annualSeatPrice: 360,
    tierName: 'Teams',
    url: 'https://codeium.com/windsurf',
  },
];

export interface TeamArchetype {
  id: string;
  name: string;
  description: string;
  teamSize: number;
  casualPercent: number;
  standardPercent: number;
  powerPercent: number;
}

export const TEAM_ARCHETYPES: TeamArchetype[] = [
  {
    id: 'enterprise-org',
    name: 'Enterprise Engineering Org',
    description: '50 engineers. Majority use inline completions with a focused core of senior agent power users.',
    teamSize: 50,
    casualPercent: 75,
    standardPercent: 20,
    powerPercent: 5,
  },
  {
    id: 'growth-startup',
    name: 'Growth-Stage Tech Company',
    description: '25 engineers. Balanced mix of interactive pair programming and specialized agent workflows.',
    teamSize: 25,
    casualPercent: 60,
    standardPercent: 30,
    powerPercent: 10,
  },
  {
    id: 'ai-native-squad',
    name: 'AI-Native Autonomous Squad',
    description: '10 engineers. Heavy autonomous agent execution across the entire team.',
    teamSize: 10,
    casualPercent: 20,
    standardPercent: 40,
    powerPercent: 40,
  },
];

export interface TeamEconomicsParams {
  teamSize: number;
  casualPercent: number;
  standardPercent: number;
  powerPercent: number;
  selectedProviderId: string;
  sharedPromptCacheDiscount?: number; // e.g. 0.15 (15% savings from shared team repo caching)
  baselineModel?: NormalizedModel;
}

export interface PersonaCostBreakdown {
  persona: DeveloperPersona;
  count: number;
  directApiCostPerUser: number;
  totalDirectApiCost: number;
  totalFlatSeatCost: number;
  hybridStrategyAssigned: 'flat-seat' | 'gateway-api';
  hybridCost: number;
}

export interface TeamEconomicsResult {
  teamSize: number;
  provider: SeatProvider;
  personaBreakdowns: PersonaCostBreakdown[];
  // Monthly costs
  flatSeatsMonthly: number;
  gatewayMonthly: number;
  hybridMonthly: number;
  // Annual costs
  flatSeatsAnnual: number;
  gatewayAnnual: number;
  hybridAnnual: number;
  // Net savings of Hybrid vs Flat Seats
  annualSavingsVsFlat: number;
  savingsPercentageVsFlat: number;
  recommendedStrategy: 'hybrid' | 'gateway-all' | 'flat-seats-all';
  recommendationSummary: string;
}

function computePersonaApiCost(p: DeveloperPersona, model?: NormalizedModel): number {
  if (!model) return p.estimatedDirectApiCost;
  const inPrice = model.pricing.input ?? model.blendedCost * 0.75;
  const outPrice = model.pricing.output ?? model.blendedCost * 1.75;
  // Never fabricate a discount for an unknown cache price (invariant I):
  // an unknown cache rate is priced at full input, matching
  // getEffectiveCacheMultiplier's "no caching" convention.
  const cachedPrice = model.pricing.cachedInput ?? inPrice;
  const { costPerRequest } = calculateAgentRequestCost(model, 0.75);

  const agentCost = p.monthlyAgentTurns * costPerRequest;
  const chatCost = p.monthlyChats * (
    (10_000 * 0.25 * inPrice / 1e6) +
    (10_000 * 0.75 * cachedPrice / 1e6) +
    (500 * outPrice / 1e6)
  );
  const compCost = p.monthlyCompletions * (
    (500 * inPrice / 1e6) +
    (100 * outPrice / 1e6)
  );

  return Math.max(0.5, agentCost + chatCost + compCost);
}

export function calculateTeamEconomics(params: TeamEconomicsParams): TeamEconomicsResult {
  const {
    teamSize,
    casualPercent,
    standardPercent,
    powerPercent,
    selectedProviderId,
    sharedPromptCacheDiscount = 0.15,
    baselineModel,
  } = params;

  const provider = SEAT_PROVIDERS.find((p) => p.id === selectedProviderId) || SEAT_PROVIDERS[0];

  // Calculate actual headcounts using Largest Remainder (Hamilton-Hare) Method
  // to ensure sum of headcounts strictly equals teamSize without rounding distortion
  const totalPercent = casualPercent + standardPercent + powerPercent || 100;
  const rawCasual = (teamSize * casualPercent) / totalPercent;
  const rawStandard = (teamSize * standardPercent) / totalPercent;
  const rawPower = (teamSize * powerPercent) / totalPercent;

  let floorCasual = Math.floor(rawCasual);
  let floorStandard = Math.floor(rawStandard);
  let floorPower = Math.floor(rawPower);

  let remainder = teamSize - (floorCasual + floorStandard + floorPower);
  const diffs = [
    { type: 'casual', rem: rawCasual - floorCasual },
    { type: 'standard', rem: rawStandard - floorStandard },
    { type: 'power', rem: rawPower - floorPower },
  ].sort((a, b) => b.rem - a.rem);

  for (let i = 0; i < remainder; i++) {
    if (diffs[i].type === 'casual') floorCasual++;
    else if (diffs[i].type === 'standard') floorStandard++;
    else if (diffs[i].type === 'power') floorPower++;
  }

  const casualCount = floorCasual;
  const standardCount = floorStandard;
  const powerCount = floorPower;

  const personas = [
    { p: DEVELOPER_PERSONAS.casual, count: casualCount },
    { p: DEVELOPER_PERSONAS.standard, count: standardCount },
    { p: DEVELOPER_PERSONAS.power, count: powerCount },
  ];

  const personaBreakdowns: PersonaCostBreakdown[] = personas.map(({ p, count }) => {
    const rawApiCost = computePersonaApiCost(p, baselineModel);
    // Shared prompt caching reduces direct API spend for teams
    const discountedApiCost = rawApiCost * (1 - sharedPromptCacheDiscount);
    const totalDirectApi = count * discountedApiCost;
    const totalFlatSeat = count * provider.monthlySeatPrice;

    // Hybrid rule:
    // If a persona's direct API cost exceeds the seat price (power devs), give them a flat seat.
    // Otherwise, route them through the pooled API gateway.
    const isPowerCostAdvantage = discountedApiCost > provider.monthlySeatPrice;
    const assignedStrategy = isPowerCostAdvantage ? 'flat-seat' : 'gateway-api';
    const hybridCost = isPowerCostAdvantage ? totalFlatSeat : totalDirectApi;

    return {
      persona: p,
      count,
      directApiCostPerUser: Number(discountedApiCost.toFixed(2)),
      totalDirectApiCost: Number(totalDirectApi.toFixed(2)),
      totalFlatSeatCost: Number(totalFlatSeat.toFixed(2)),
      hybridStrategyAssigned: assignedStrategy,
      hybridCost: Number(hybridCost.toFixed(2)),
    };
  });

  const flatSeatsMonthly = teamSize * provider.monthlySeatPrice;
  const gatewayMonthly = personaBreakdowns.reduce((sum, r) => sum + r.totalDirectApiCost, 0);
  const hybridMonthly = personaBreakdowns.reduce((sum, r) => sum + r.hybridCost, 0);

  const flatSeatsAnnual = flatSeatsMonthly * 12;
  const gatewayAnnual = gatewayMonthly * 12;
  const hybridAnnual = hybridMonthly * 12;

  const annualSavingsVsFlat = Math.max(0, flatSeatsAnnual - hybridAnnual);
  const savingsPercentageVsFlat = flatSeatsAnnual > 0
    ? Math.round((annualSavingsVsFlat / flatSeatsAnnual) * 100)
    : 0;

  let recommendedStrategy: 'hybrid' | 'gateway-all' | 'flat-seats-all' = 'hybrid';
  let recommendationSummary = '';

  if (hybridAnnual < flatSeatsAnnual && hybridAnnual < gatewayAnnual) {
    recommendedStrategy = 'hybrid';
    recommendationSummary = `Deploy Hybrid: Provision ${powerCount} flat seat licenses for power agentic developers (where the vendor absorbs compute) and route ${casualCount + standardCount} casual/standard developers through a pooled API gateway.`;
  } else if (gatewayAnnual <= hybridAnnual && gatewayAnnual < flatSeatsAnnual) {
    recommendedStrategy = 'gateway-all';
    recommendationSummary = `Deploy 100% Centralized API Gateway: Team usage is predominantly casual, making raw pay-as-you-go tokens far cheaper than any flat seat subscriptions.`;
  } else {
    recommendedStrategy = 'flat-seats-all';
    recommendationSummary = `Deploy 100% Flat Seat Subscriptions: Heavy autonomous agent usage across the entire team makes vendor-absorbed flat seats the most cost-effective procurement model.`;
  }

  return {
    teamSize,
    provider,
    personaBreakdowns,
    flatSeatsMonthly: Number(flatSeatsMonthly.toFixed(2)),
    gatewayMonthly: Number(gatewayMonthly.toFixed(2)),
    hybridMonthly: Number(hybridMonthly.toFixed(2)),
    flatSeatsAnnual: Number(flatSeatsAnnual.toFixed(2)),
    gatewayAnnual: Number(gatewayAnnual.toFixed(2)),
    hybridAnnual: Number(hybridAnnual.toFixed(2)),
    annualSavingsVsFlat: Number(annualSavingsVsFlat.toFixed(2)),
    savingsPercentageVsFlat,
    recommendedStrategy,
    recommendationSummary,
  };
}
