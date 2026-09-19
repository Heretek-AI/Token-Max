import { describe, it, expect } from 'vitest';
import {
  calculateTeamEconomics,
  DEVELOPER_PERSONAS,
  SEAT_PROVIDERS,
  TEAM_ARCHETYPES,
} from './teams';

describe('Multi-Seat Team & Gateway Economics Engine', () => {
  it('defines valid personas with realistic ascending token volumes and costs', () => {
    expect(DEVELOPER_PERSONAS.casual.estimatedDirectApiCost).toBeLessThan(
      DEVELOPER_PERSONAS.standard.estimatedDirectApiCost
    );
    expect(DEVELOPER_PERSONAS.standard.estimatedDirectApiCost).toBeLessThan(
      DEVELOPER_PERSONAS.power.estimatedDirectApiCost
    );
    expect(DEVELOPER_PERSONAS.power.monthlyTokensMillion).toBeGreaterThan(30);
  });

  it('correctly calculates headcount totals equal to team size', () => {
    const result = calculateTeamEconomics({
      teamSize: 25,
      casualPercent: 70,
      standardPercent: 20,
      powerPercent: 10,
      selectedProviderId: 'cursor-business',
    });

    const sumHeadcount = result.personaBreakdowns.reduce((sum, r) => sum + r.count, 0);
    expect(sumHeadcount).toBe(25);
  });

  it('demonstrates that hybrid/gateway procurement achieves >40% savings on standard enterprise teams', () => {
    // 50 devs, 75% casual, 20% standard, 5% power on Cursor Business ($40/user/mo = $24,000/yr)
    const result = calculateTeamEconomics({
      teamSize: 50,
      casualPercent: 75,
      standardPercent: 20,
      powerPercent: 5,
      selectedProviderId: 'cursor-business',
    });

    expect(result.flatSeatsAnnual).toBe(24000); // 50 * $40 * 12
    expect(result.savingsPercentageVsFlat).toBeGreaterThan(40);
    expect(result.annualSavingsVsFlat).toBeGreaterThan(10000); // Saves over $10K/year
  });

  it('proves gateway is overwhelmingly superior for 100% casual teams', () => {
    const result = calculateTeamEconomics({
      teamSize: 20,
      casualPercent: 100,
      standardPercent: 0,
      powerPercent: 0,
      selectedProviderId: 'cursor-business',
    });

    // 20 * $40 = $800/mo flat seats vs 20 * ~$3.23 = ~$64/mo gateway
    expect(result.gatewayAnnual).toBeLessThan(result.flatSeatsAnnual * 0.2);
    expect(result.recommendedStrategy).toBe('gateway-all');
  });

  it('proves flat seats absorb compute value when team is 100% power agentic', () => {
    const result = calculateTeamEconomics({
      teamSize: 10,
      casualPercent: 0,
      standardPercent: 0,
      powerPercent: 100,
      selectedProviderId: 'cursor-business', // $40/user flat vs ~$66.30 discounted API
    });

    expect(result.flatSeatsMonthly).toBe(400); // 10 * $40
    expect(result.gatewayMonthly).toBeGreaterThan(result.flatSeatsMonthly);
    expect(result.recommendedStrategy).toBe('flat-seats-all');
  });

  it('validates pre-configured archetypes', () => {
    expect(TEAM_ARCHETYPES.length).toBeGreaterThanOrEqual(3);
    for (const arch of TEAM_ARCHETYPES) {
      expect(arch.casualPercent + arch.standardPercent + arch.powerPercent).toBe(100);
      expect(arch.teamSize).toBeGreaterThan(0);
    }
  });

  it('validates all seat providers', () => {
    expect(SEAT_PROVIDERS.length).toBeGreaterThanOrEqual(4);
    for (const prov of SEAT_PROVIDERS) {
      expect(prov.monthlySeatPrice).toBeGreaterThan(0);
      expect(prov.annualSeatPrice).toBeGreaterThan(0);
      expect(prov.url).toContain('https://');
    }
  });

  it('dynamically prices personas when a custom baselineModel is provided', () => {
    const cheapModel = {
      id: 'deepseek/deepseek-v4.1-flash',
      name: 'DeepSeek Flash',
      provider: 'deepseek',
      series: 'DeepSeek',
      modality: 'text->text',
      contextWindow: 128000,
      maxOutput: 8192,
      pricing: { input: 0.14, output: 0.28, cachedInput: 0.014, cachedInputWrite: null, reasoning: null, webSearch: null },
      blendedCost: 0.18,
      costPer1kRequests: 0.56,
      benchmarks: { intelligenceIndex: 55, codingIndex: 68, agenticIndex: 52, valueScore: 350 },
      reasoning: null,
      isFree: false,
      isBatch: false,
    };

    const result = calculateTeamEconomics({
      teamSize: 10,
      casualPercent: 20,
      standardPercent: 40,
      powerPercent: 40,
      selectedProviderId: 'cursor-business',
      baselineModel: cheapModel,
    });

    // On ultra-cheap DeepSeek model, direct API gateway should be far cheaper than flat seats
    expect(result.gatewayMonthly).toBeLessThan(result.flatSeatsMonthly);
    expect(result.recommendedStrategy).toBe('gateway-all');
  });

  it('strictly allocates headcount using Hamilton-Hare largest remainder without rounding leaks', () => {
    // 3 devs with 50% casual, 50% standard, 0% power
    const result = calculateTeamEconomics({
      teamSize: 3,
      casualPercent: 50,
      standardPercent: 50,
      powerPercent: 0,
      selectedProviderId: 'cursor-business',
    });

    const sumHeadcount = result.personaBreakdowns.reduce((sum, r) => sum + r.count, 0);
    expect(sumHeadcount).toBe(3);
  });
});
