/**
 * Hardware economics engine and presets for local LLM inference vs cloud APIs and subscriptions.
 */

export interface HardwareModelRecommendation {
  name: string;
  parameterSize: string;
  quantization: string;
  tokensPerSec: number;
  vramRequiredGb: number;
  codingBenchmarkScore: number; // e.g. HumanEval / SWE-bench / Aider benchmark
  contextLimitTokens: number;
}

export interface HardwarePreset {
  id: string;
  name: string;
  shortName: string;
  category: 'apple-silicon' | 'nvidia-rig' | 'workstation';
  badge: string;
  capexUsd: number;
  memoryGb: number;
  memoryType: string;
  memoryBandwidthGbps: number;
  idlePowerWatts: number;
  loadPowerWatts: number;
  recommendedModels: HardwareModelRecommendation[];
  description: string;
  pros: string[];
  cons: string[];
}

export interface HardwareEconomicsInputs {
  presetId: string;
  customCapexUsd?: number;
  amortizationMonths: number; // e.g. 12, 24, 36, 48
  salvageValuePercent: number; // e.g. 0 to 40%
  electricityKwhCost: number; // default $0.16/kWh
  dailyInferenceHours: number; // default 3 hrs
  dailyIdleHours: number; // default 9 hrs
  monthlyTokenVolumeM: number; // default 5M tokens
  inputRatio: number; // default 0.8 (80% input, 20% output)
  cloudApiInputPerM: number;
  cloudApiOutputPerM: number;
  cloudPlanMonthlyPrice?: number;
}

export interface CrossoverPoint {
  volumeM: number;
  localCost: number;
  cloudApiCost: number;
  cloudPlanCost?: number;
}

export interface CumulativePoint {
  month: number;
  cumulativeLocal: number;
  cumulativeApi: number;
  cumulativePlan?: number;
}

export interface HardwareEconomicsResult {
  monthlyAmortizationCost: number;
  monthlyElectricityCost: number;
  totalMonthlyLocalCost: number;
  monthlyCloudApiCost: number;
  monthlyCloudPlanCost: number | null;
  monthlySavingsVsApi: number;
  monthlySavingsVsPlan: number | null;
  blendedApiRatePerM: number;
  crossoverVolumeM: number;
  paybackMonthsVsApi: number | null;
  paybackMonthsVsPlan: number | null;
  crossoverSeries: CrossoverPoint[];
  cumulativeTcoSeries: CumulativePoint[];
}

export const HARDWARE_PRESETS: HardwarePreset[] = [
  {
    id: 'mac-mini-m4-pro-64gb',
    name: 'Apple Mac Mini M4 Pro (64GB)',
    shortName: 'Mac Mini M4 Pro (64GB)',
    category: 'apple-silicon',
    badge: 'Best Value Mac',
    capexUsd: 2199,
    memoryGb: 64,
    memoryType: 'Unified LPDDR5X',
    memoryBandwidthGbps: 273,
    idlePowerWatts: 10,
    loadPowerWatts: 72,
    recommendedModels: [
      {
        name: 'Qwen 2.5 Coder 32B',
        parameterSize: '32B',
        quantization: 'Q8_0',
        tokensPerSec: 24,
        vramRequiredGb: 36,
        codingBenchmarkScore: 78.4,
        contextLimitTokens: 65536,
      },
      {
        name: 'DeepSeek-R1-Distill-Qwen-32B',
        parameterSize: '32B',
        quantization: 'Q4_K_M',
        tokensPerSec: 26,
        vramRequiredGb: 22,
        codingBenchmarkScore: 82.1,
        contextLimitTokens: 65536,
      },
      {
        name: 'Llama 3.3 70B',
        parameterSize: '70B',
        quantization: 'Q4_K_M',
        tokensPerSec: 10,
        vramRequiredGb: 44,
        codingBenchmarkScore: 74.2,
        contextLimitTokens: 32768,
      },
    ],
    description: 'Compact, near-silent engineering powerhouse with 64GB unified memory capable of comfortably running 32B models at Q8 or 70B models at Q4.',
    pros: [
      'Extremely low power consumption (10W idle / 72W load)',
      'Whisper-quiet thermals under heavy inference',
      'Small desk footprint with Thunderbolt 5 expansion',
    ],
    cons: [
      '273 GB/s bandwidth limits 70B models to ~10 t/s',
      'Memory cannot be upgraded post-purchase',
    ],
  },
  {
    id: 'mac-studio-m4-max-128gb',
    name: 'Apple Mac Studio M4 Max (128GB)',
    shortName: 'Mac Studio M4 Max (128GB)',
    category: 'apple-silicon',
    badge: 'Sweet Spot 70B',
    capexUsd: 3999,
    memoryGb: 128,
    memoryType: 'Unified LPDDR5X',
    memoryBandwidthGbps: 546,
    idlePowerWatts: 15,
    loadPowerWatts: 145,
    recommendedModels: [
      {
        name: 'Llama 3.3 70B Instruct',
        parameterSize: '70B',
        quantization: 'Q6_K',
        tokensPerSec: 22,
        vramRequiredGb: 62,
        codingBenchmarkScore: 81.6,
        contextLimitTokens: 65536,
      },
      {
        name: 'Qwen 2.5 Coder 32B',
        parameterSize: '32B',
        quantization: 'FP16',
        tokensPerSec: 38,
        vramRequiredGb: 68,
        codingBenchmarkScore: 83.0,
        contextLimitTokens: 98304,
      },
      {
        name: 'DeepSeek-R1-Distill-Llama-70B',
        parameterSize: '70B',
        quantization: 'Q4_K_M',
        tokensPerSec: 24,
        vramRequiredGb: 48,
        codingBenchmarkScore: 84.5,
        contextLimitTokens: 65536,
      },
    ],
    description: 'The golden mean for developers running 70B parameter models at high quantization with massive context windows up to 64k tokens.',
    pros: [
      '546 GB/s memory bandwidth provides snappy ~22-24 t/s on 70B models',
      'Runs unquantized 32B FP16 with massive 98k context',
      'Energy efficient (< 150W total system load)',
    ],
    cons: [
      'Higher upfront CapEx ($3,999)',
      'Still cannot run full 671B MoE models at high precision',
    ],
  },
  {
    id: 'mac-studio-m4-ultra-192gb',
    name: 'Apple Mac Studio M4 Ultra (192GB)',
    shortName: 'Mac Studio Ultra (192GB)',
    category: 'apple-silicon',
    badge: 'Ultimate Local Beast',
    capexUsd: 6499,
    memoryGb: 192,
    memoryType: 'Unified LPDDR5X',
    memoryBandwidthGbps: 1092,
    idlePowerWatts: 25,
    loadPowerWatts: 280,
    recommendedModels: [
      {
        name: 'DeepSeek-R1 671B MoE',
        parameterSize: '671B (37B active)',
        quantization: 'UD-IQ1_S / 2.22bpw',
        tokensPerSec: 16,
        vramRequiredGb: 175,
        codingBenchmarkScore: 87.8,
        contextLimitTokens: 32768,
      },
      {
        name: 'Llama 3.3 70B Instruct',
        parameterSize: '70B',
        quantization: 'FP16',
        tokensPerSec: 46,
        vramRequiredGb: 148,
        codingBenchmarkScore: 82.5,
        contextLimitTokens: 131072,
      },
      {
        name: 'Qwen 2.5 Coder 32B',
        parameterSize: '32B',
        quantization: 'FP16',
        tokensPerSec: 68,
        vramRequiredGb: 68,
        codingBenchmarkScore: 83.0,
        contextLimitTokens: 131072,
      },
    ],
    description: 'The premier local workstation capable of hosting quantized full-size MoE models (DeepSeek-R1 671B) and unquantized 70B FP16 models.',
    pros: [
      'Massive 1.09 TB/s memory bandwidth',
      'Enough unified RAM for 128k context on 70B models',
      'Supports full DeepSeek-R1 671B quantized inference locally',
    ],
    cons: [
      'Steep $6,499 capital commitment',
      'MoE quant inference requires specialized llama.cpp builds',
    ],
  },
  {
    id: 'custom-dual-rtx-5090',
    name: 'Custom Rig 2x NVIDIA RTX 5090 (64GB VRAM)',
    shortName: 'Dual RTX 5090 (64GB)',
    category: 'nvidia-rig',
    badge: 'Maximum Speed & CUDA',
    capexUsd: 4999,
    memoryGb: 64,
    memoryType: 'GDDR7 Dedicated VRAM',
    memoryBandwidthGbps: 3580,
    idlePowerWatts: 65,
    loadPowerWatts: 920,
    recommendedModels: [
      {
        name: 'Qwen 2.5 Coder 32B',
        parameterSize: '32B',
        quantization: 'FP16',
        tokensPerSec: 92,
        vramRequiredGb: 60,
        codingBenchmarkScore: 83.0,
        contextLimitTokens: 65536,
      },
      {
        name: 'Llama 3.3 70B Instruct',
        parameterSize: '70B',
        quantization: 'Q4_K_M (Tensor Parallel)',
        tokensPerSec: 68,
        vramRequiredGb: 46,
        codingBenchmarkScore: 81.2,
        contextLimitTokens: 65536,
      },
      {
        name: 'DeepSeek-R1-Distill-32B',
        parameterSize: '32B',
        quantization: 'FP16',
        tokensPerSec: 88,
        vramRequiredGb: 60,
        codingBenchmarkScore: 84.8,
        contextLimitTokens: 65536,
      },
    ],
    description: 'The enthusiast CUDA standard: blistering 90+ t/s throughput via vLLM / TensorRT-LLM with dual RTX 5090s and high-speed PCIe 5.0.',
    pros: [
      'Unmatched generation speed (68-92 tokens/second)',
      'Native CUDA, FlashAttention-3, TensorRT-LLM support',
      'Standard high-performance PC component resale value',
    ],
    cons: [
      'Very high power consumption (~920W under load)',
      'Generates significant heat and requires 1200W+ PSU and dedicated circuit',
      'VRAM capped at 64GB (cannot run 70B FP16 or 671B MoE)',
    ],
  },
  {
    id: 'single-rtx-5090',
    name: 'Custom Rig 1x NVIDIA RTX 5090 (32GB VRAM)',
    shortName: 'Single RTX 5090 (32GB)',
    category: 'nvidia-rig',
    badge: '32B CUDA Champion',
    capexUsd: 2699,
    memoryGb: 32,
    memoryType: 'GDDR7 Dedicated VRAM',
    memoryBandwidthGbps: 1790,
    idlePowerWatts: 42,
    loadPowerWatts: 540,
    recommendedModels: [
      {
        name: 'Qwen 2.5 Coder 32B',
        parameterSize: '32B',
        quantization: 'Q6_K / AWQ',
        tokensPerSec: 82,
        vramRequiredGb: 26,
        codingBenchmarkScore: 82.4,
        contextLimitTokens: 32768,
      },
      {
        name: 'DeepSeek-R1-Distill-Qwen-14B',
        parameterSize: '14B',
        quantization: 'FP16',
        tokensPerSec: 110,
        vramRequiredGb: 28,
        codingBenchmarkScore: 79.5,
        contextLimitTokens: 65536,
      },
    ],
    description: 'Blazing fast single-card workstation tailored for 14B and 32B coding models with sub-second time-to-first-token.',
    pros: [
      'Incredible 80-110 tokens/second on 14B-32B models',
      '32GB GDDR7 with 1,790 GB/s bandwidth',
      'Fits in standard mid-tower workstation chassis',
    ],
    cons: [
      'Cannot fit 70B parameter models locally',
      'High 540W peak power draw',
    ],
  },
  {
    id: 'budget-rtx-4090',
    name: 'Homelab Rig 1x NVIDIA RTX 4090 (24GB VRAM)',
    shortName: 'Homelab RTX 4090 (24GB)',
    category: 'workstation',
    badge: 'Budget Workhorse',
    capexUsd: 1799,
    memoryGb: 24,
    memoryType: 'GDDR6X Dedicated VRAM',
    memoryBandwidthGbps: 1008,
    idlePowerWatts: 35,
    loadPowerWatts: 450,
    recommendedModels: [
      {
        name: 'Qwen 2.5 Coder 14B',
        parameterSize: '14B',
        quantization: 'FP16',
        tokensPerSec: 75,
        vramRequiredGb: 22,
        codingBenchmarkScore: 78.8,
        contextLimitTokens: 32768,
      },
      {
        name: 'Qwen 2.5 Coder 32B',
        parameterSize: '32B',
        quantization: 'Q4_K_M',
        tokensPerSec: 45,
        vramRequiredGb: 20,
        codingBenchmarkScore: 80.2,
        contextLimitTokens: 16384,
      },
    ],
    description: 'Reliable, widely tested homelab inference platform for running 14B models unquantized or 32B models at 4-bit quant.',
    pros: [
      'Lower initial CapEx ($1,799)',
      'Mature software stack and widespread community support',
      'High 1 TB/s memory bandwidth delivers fast 45-75 t/s',
    ],
    cons: [
      '24GB limit restricts context length on 32B models',
      'Out of memory for 70B models',
    ],
  },
];

/**
 * Calculates monthly hardware amortization, electricity costs, and cloud comparisons.
 */
export function computeHardwareEconomics(inputs: HardwareEconomicsInputs): HardwareEconomicsResult {
  const preset = HARDWARE_PRESETS.find((p) => p.id === inputs.presetId) ?? HARDWARE_PRESETS[0];
  const capex = inputs.customCapexUsd ?? preset.capexUsd;

  // 1. Amortization with salvage value
  const netDepreciationCapEx = capex * (1 - Math.max(0, Math.min(60, inputs.salvageValuePercent)) / 100);
  const months = Math.max(1, inputs.amortizationMonths);
  const monthlyAmortizationCost = netDepreciationCapEx / months;

  // 2. Electricity calculation
  // Daily watt-hours = (idleWatts * idleHours) + (loadWatts * inferenceHours)
  const dailyWattHours =
    preset.idlePowerWatts * Math.max(0, inputs.dailyIdleHours) +
    preset.loadPowerWatts * Math.max(0, inputs.dailyInferenceHours);
  const dailyKwh = dailyWattHours / 1000;
  const daysPerMonth = 30.4375;
  const monthlyKwh = dailyKwh * daysPerMonth;
  const monthlyElectricityCost = monthlyKwh * Math.max(0, inputs.electricityKwhCost);

  // Total monthly cost of owning and running local hardware
  const totalMonthlyLocalCost = monthlyAmortizationCost + monthlyElectricityCost;

  // 3. Cloud API cost
  const inputRatio = Math.max(0, Math.min(1, inputs.inputRatio));
  const outputRatio = 1 - inputRatio;
  const blendedApiRatePerM = inputRatio * inputs.cloudApiInputPerM + outputRatio * inputs.cloudApiOutputPerM;
  const monthlyCloudApiCost = Math.max(0, inputs.monthlyTokenVolumeM) * blendedApiRatePerM;

  // 4. Cloud Plan cost
  const monthlyCloudPlanCost = inputs.cloudPlanMonthlyPrice !== undefined ? inputs.cloudPlanMonthlyPrice : null;

  // 5. Savings
  const monthlySavingsVsApi = monthlyCloudApiCost - totalMonthlyLocalCost;
  const monthlySavingsVsPlan = monthlyCloudPlanCost !== null ? monthlyCloudPlanCost - totalMonthlyLocalCost : null;

  // 6. Crossover Volume: At what monthly M tokens does Local Cost == Cloud API Cost?
  // totalMonthlyLocalCost = volumeM * blendedApiRatePerM
  // volumeM = totalMonthlyLocalCost / blendedApiRatePerM
  const crossoverVolumeM = blendedApiRatePerM > 0 ? totalMonthlyLocalCost / blendedApiRatePerM : 0;

  // 7. Payback period in months
  // Capital outlay / monthly operational savings vs cloud
  // Monthly cloud spend avoided - ongoing monthly electricity cost = net cash flow benefit
  const netMonthlyBenefitVsApi = monthlyCloudApiCost - monthlyElectricityCost;
  let paybackMonthsVsApi: number | null = null;
  if (netMonthlyBenefitVsApi > 0) {
    paybackMonthsVsApi = capex / netMonthlyBenefitVsApi;
  }

  let paybackMonthsVsPlan: number | null = null;
  if (monthlyCloudPlanCost !== null) {
    const netMonthlyBenefitVsPlan = monthlyCloudPlanCost - monthlyElectricityCost;
    if (netMonthlyBenefitVsPlan > 0) {
      paybackMonthsVsPlan = capex / netMonthlyBenefitVsPlan;
    }
  }

  // 8. Generate Crossover Volume series (0 to 30M tokens in steps)
  const crossoverSeries: CrossoverPoint[] = [];
  const maxVolume = Math.max(30, Math.ceil(Math.max(crossoverVolumeM * 1.5, inputs.monthlyTokenVolumeM * 1.5)));
  const steps = 15;
  const stepSize = maxVolume / steps;

  for (let i = 0; i <= steps; i++) {
    const vol = Number((i * stepSize).toFixed(1));
    const apiCost = Number((vol * blendedApiRatePerM).toFixed(2));
    crossoverSeries.push({
      volumeM: vol,
      localCost: Number(totalMonthlyLocalCost.toFixed(2)),
      cloudApiCost: apiCost,
      cloudPlanCost: monthlyCloudPlanCost !== null ? monthlyCloudPlanCost : undefined,
    });
  }

  // 9. Generate Cumulative TCO over 36 months
  const cumulativeTcoSeries: CumulativePoint[] = [];
  for (let m = 1; m <= 36; m++) {
    // Local cumulative: Capex upfront + monthly electricity
    const cumLocal = capex + m * monthlyElectricityCost;
    const cumApi = m * monthlyCloudApiCost;
    const cumPlan = monthlyCloudPlanCost !== null ? m * monthlyCloudPlanCost : undefined;

    cumulativeTcoSeries.push({
      month: m,
      cumulativeLocal: Number(cumLocal.toFixed(2)),
      cumulativeApi: Number(cumApi.toFixed(2)),
      cumulativePlan: cumPlan !== undefined ? Number(cumPlan.toFixed(2)) : undefined,
    });
  }

  return {
    monthlyAmortizationCost: Number(monthlyAmortizationCost.toFixed(2)),
    monthlyElectricityCost: Number(monthlyElectricityCost.toFixed(2)),
    totalMonthlyLocalCost: Number(totalMonthlyLocalCost.toFixed(2)),
    monthlyCloudApiCost: Number(monthlyCloudApiCost.toFixed(2)),
    monthlyCloudPlanCost,
    monthlySavingsVsApi: Number(monthlySavingsVsApi.toFixed(2)),
    monthlySavingsVsPlan: monthlySavingsVsPlan !== null ? Number(monthlySavingsVsPlan.toFixed(2)) : null,
    blendedApiRatePerM: Number(blendedApiRatePerM.toFixed(3)),
    crossoverVolumeM: Number(crossoverVolumeM.toFixed(2)),
    paybackMonthsVsApi: paybackMonthsVsApi !== null ? Number(paybackMonthsVsApi.toFixed(1)) : null,
    paybackMonthsVsPlan: paybackMonthsVsPlan !== null ? Number(paybackMonthsVsPlan.toFixed(1)) : null,
    crossoverSeries,
    cumulativeTcoSeries,
  };
}
