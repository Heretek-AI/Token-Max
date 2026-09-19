import { describe, it, expect } from 'vitest';
import { HARDWARE_PRESETS, computeHardwareEconomics } from './hardware';

describe('hardware economics engine', () => {
  it('loads all hardware presets with valid specs', () => {
    expect(HARDWARE_PRESETS.length).toBeGreaterThanOrEqual(6);
    for (const preset of HARDWARE_PRESETS) {
      expect(preset.capexUsd).toBeGreaterThan(1000);
      expect(preset.memoryGb).toBeGreaterThanOrEqual(24);
      expect(preset.memoryBandwidthGbps).toBeGreaterThan(200);
      expect(preset.idlePowerWatts).toBeGreaterThan(0);
      expect(preset.loadPowerWatts).toBeGreaterThan(preset.idlePowerWatts);
      expect(preset.recommendedModels.length).toBeGreaterThan(0);
      for (const model of preset.recommendedModels) {
        expect(model.tokensPerSec).toBeGreaterThan(0);
        expect(model.vramRequiredGb).toBeLessThanOrEqual(preset.memoryGb);
      }
    }
  });

  it('calculates monthly amortization with salvage value correctly', () => {
    // Mac Mini M4 Pro $2,199 over 24 months with 20% salvage value
    // Net depreciation = $2,199 * 0.8 = $1,759.20
    // Monthly = $1,759.20 / 24 = $73.30
    const result = computeHardwareEconomics({
      presetId: 'mac-mini-m4-pro-64gb',
      amortizationMonths: 24,
      salvageValuePercent: 20,
      electricityKwhCost: 0.16,
      dailyInferenceHours: 3,
      dailyIdleHours: 9,
      monthlyTokenVolumeM: 5,
      inputRatio: 0.8,
      cloudApiInputPerM: 3.0,
      cloudApiOutputPerM: 15.0,
    });

    expect(result.monthlyAmortizationCost).toBe(73.3);
    expect(result.totalMonthlyLocalCost).toBeGreaterThan(result.monthlyAmortizationCost);
  });

  it('calculates electricity costs accurately', () => {
    // Mac Mini: 10W idle * 9h + 72W load * 3h = 90 + 216 = 306 Wh/day = 0.306 kWh/day
    // Monthly kWh = 0.306 * 30.4375 = 9.313875 kWh
    // Cost @ $0.16/kWh = $1.49
    const result = computeHardwareEconomics({
      presetId: 'mac-mini-m4-pro-64gb',
      amortizationMonths: 24,
      salvageValuePercent: 20,
      electricityKwhCost: 0.16,
      dailyInferenceHours: 3,
      dailyIdleHours: 9,
      monthlyTokenVolumeM: 5,
      inputRatio: 0.8,
      cloudApiInputPerM: 3.0,
      cloudApiOutputPerM: 15.0,
    });

    expect(result.monthlyElectricityCost).toBeCloseTo(1.49, 1);
  });

  it('computes crossover token volume accurately', () => {
    // Blended rate = 0.8 * 3.0 + 0.2 * 15.0 = 2.4 + 3.0 = $5.40/M
    // If local monthly cost is ~$74.79, crossover = 74.79 / 5.40 = ~13.85M tokens
    const result = computeHardwareEconomics({
      presetId: 'mac-mini-m4-pro-64gb',
      amortizationMonths: 24,
      salvageValuePercent: 20,
      electricityKwhCost: 0.16,
      dailyInferenceHours: 3,
      dailyIdleHours: 9,
      monthlyTokenVolumeM: 15,
      inputRatio: 0.8,
      cloudApiInputPerM: 3.0,
      cloudApiOutputPerM: 15.0,
    });

    expect(result.blendedApiRatePerM).toBe(5.4);
    expect(result.crossoverVolumeM).toBeGreaterThan(10);
    expect(result.crossoverVolumeM).toBeLessThan(18);

    // At 15M tokens, cloud API costs 15 * 5.4 = $81.00
    expect(result.monthlyCloudApiCost).toBe(81.0);
    // Net savings should be positive
    expect(result.monthlySavingsVsApi).toBeGreaterThan(0);
  });

  it('handles subscription comparison and payback period', () => {
    const result = computeHardwareEconomics({
      presetId: 'mac-studio-m4-max-128gb',
      amortizationMonths: 36,
      salvageValuePercent: 25,
      electricityKwhCost: 0.18,
      dailyInferenceHours: 4,
      dailyIdleHours: 8,
      monthlyTokenVolumeM: 20,
      inputRatio: 0.75,
      cloudApiInputPerM: 3.0,
      cloudApiOutputPerM: 15.0,
      cloudPlanMonthlyPrice: 40,
    });

    expect(result.monthlyCloudPlanCost).toBe(40);
    expect(result.paybackMonthsVsApi).not.toBeNull();
    expect(result.crossoverSeries.length).toBeGreaterThan(10);
    expect(result.cumulativeTcoSeries.length).toBe(36);
    expect(result.cumulativeTcoSeries[0].cumulativeLocal).toBeGreaterThan(3999);
  });

  it('handles cheap API scenario where local never pays back', () => {
    // DeepSeek-V3 API: $0.14 input, $0.28 output
    // CapEx $4,999 dual RTX rig at low volume (1M tokens) will not pay back quickly
    const result = computeHardwareEconomics({
      presetId: 'custom-dual-rtx-5090',
      amortizationMonths: 24,
      salvageValuePercent: 10,
      electricityKwhCost: 0.2,
      dailyInferenceHours: 6,
      dailyIdleHours: 12,
      monthlyTokenVolumeM: 1,
      inputRatio: 0.8,
      cloudApiInputPerM: 0.14,
      cloudApiOutputPerM: 0.28,
    });

    // Cloud cost at 1M = ~$0.17/mo. Local electricity alone is ~$40/mo!
    // Net benefit is negative, so paybackMonthsVsApi should be null
    expect(result.paybackMonthsVsApi).toBeNull();
    expect(result.monthlySavingsVsApi).toBeLessThan(0);
  });
});
