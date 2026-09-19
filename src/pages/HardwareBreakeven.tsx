import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModels } from '../hooks/useModels';
import { usePlans } from '../hooks/usePlans';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  HARDWARE_PRESETS,
  computeHardwareEconomics,
  type HardwarePreset,
} from '../lib/hardware';
import { formatPrice } from '../lib/pricing';
import {
  Cpu,
  Zap,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Share2,
  Check,
  Flame,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
} from 'recharts';

export default function HardwareBreakeven() {
  const { models, loading: modelsLoading } = useModels();
  const { plans, loading: plansLoading } = usePlans();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial params
  const initialPresetId = searchParams.get('preset') || 'mac-mini-m4-pro-64gb';
  const initialAmortization = Math.min(48, Math.max(6, Number(searchParams.get('amortization')) || 24));
  const initialSalvage = Math.min(50, Math.max(0, Number(searchParams.get('salvage')) || 20));
  const initialKwhCost = Math.min(1.0, Math.max(0.01, Number(searchParams.get('kwh')) || 0.16));
  const initialDailyInference = Math.min(24, Math.max(1, Number(searchParams.get('infHours')) || 3));
  const initialDailyIdle = Math.min(24, Math.max(0, Number(searchParams.get('idleHours')) || 9));
  const initialVolumeM = Math.min(100, Math.max(0.5, Number(searchParams.get('volume')) || 6));
  const initialInputRatio = Math.min(0.95, Math.max(0.5, Number(searchParams.get('inputRatio')) || 0.8));
  const initialApiId = searchParams.get('api') || 'anthropic/claude-3.7-sonnet';
  const initialPlanId = searchParams.get('plan') || 'cursor-pro';

  // State
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPresetId);
  const [customCapex, setCustomCapex] = useState<number | null>(null);
  const [amortizationMonths, setAmortizationMonths] = useState<number>(initialAmortization);
  const [salvagePercent, setSalvagePercent] = useState<number>(initialSalvage);
  const [electricityKwhCost, setElectricityKwhCost] = useState<number>(initialKwhCost);
  const [dailyInferenceHours, setDailyInferenceHours] = useState<number>(initialDailyInference);
  const [dailyIdleHours, setDailyIdleHours] = useState<number>(initialDailyIdle);
  const [monthlyTokenVolumeM, setMonthlyTokenVolumeM] = useState<number>(initialVolumeM);
  const [inputRatio, setInputRatio] = useState<number>(initialInputRatio);
  const [selectedApiId, setSelectedApiId] = useState<string>(initialApiId);
  const [selectedPlanTierId, setSelectedPlanTierId] = useState<string>(initialPlanId);
  const [activeChartTab, setActiveChartTab] = useState<'crossover' | 'tco'>('crossover');
  const [copied, setCopied] = useState<boolean>(false);

  // Active preset
  const currentPreset: HardwarePreset = useMemo(() => {
    return HARDWARE_PRESETS.find((p) => p.id === selectedPresetId) ?? HARDWARE_PRESETS[0];
  }, [selectedPresetId]);

  // Model lookup for API pricing
  const apiModel = useMemo(() => {
    const directMatch = models.find((m) => m.id === selectedApiId);
    if (directMatch) return directMatch;
    // Fallback search
    return (
      models.find((m) => m.id.includes('sonnet') || m.id.includes('claude-3-7')) ??
      models[0] ?? {
        id: 'anthropic/claude-3.7-sonnet',
        name: 'Claude 3.7 Sonnet',
        pricing: { input: 0.000003, output: 0.000015 },
      }
    );
  }, [models, selectedApiId]);

  const cloudApiInputPerM = (apiModel.pricing?.input ?? 0.000003) * 1_000_000;
  const cloudApiOutputPerM = (apiModel.pricing?.output ?? 0.000015) * 1_000_000;

  // Plan tiers list
  const planTiersList = useMemo(() => {
    const list: { id: string; label: string; monthlyPrice: number }[] = [];
    for (const p of plans) {
      for (const t of p.tiers) {
        if (t.monthlyPrice !== null && t.monthlyPrice > 0) {
          list.push({
            id: `${p.id}-${t.name.toLowerCase().replace(/\s+/g, '-')}`,
            label: `${p.name} - ${t.name} ($${t.monthlyPrice}/mo)`,
            monthlyPrice: t.monthlyPrice,
          });
        }
      }
    }
    return list;
  }, [plans]);

  const currentPlanTier = useMemo(() => {
    return planTiersList.find((pt) => pt.id === selectedPlanTierId) ?? planTiersList[0] ?? null;
  }, [planTiersList, selectedPlanTierId]);

  // Economics computation
  const economics = useMemo(() => {
    return computeHardwareEconomics({
      presetId: currentPreset.id,
      customCapexUsd: customCapex !== null ? customCapex : currentPreset.capexUsd,
      amortizationMonths,
      salvageValuePercent: salvagePercent,
      electricityKwhCost,
      dailyInferenceHours,
      dailyIdleHours,
      monthlyTokenVolumeM,
      inputRatio,
      cloudApiInputPerM,
      cloudApiOutputPerM,
      cloudPlanMonthlyPrice: currentPlanTier?.monthlyPrice,
    });
  }, [
    currentPreset,
    customCapex,
    amortizationMonths,
    salvagePercent,
    electricityKwhCost,
    dailyInferenceHours,
    dailyIdleHours,
    monthlyTokenVolumeM,
    inputRatio,
    cloudApiInputPerM,
    cloudApiOutputPerM,
    currentPlanTier,
  ]);

  // Share URL
  const handleShare = () => {
    const params = new URLSearchParams();
    params.set('preset', selectedPresetId);
    params.set('amortization', String(amortizationMonths));
    params.set('salvage', String(salvagePercent));
    params.set('kwh', String(electricityKwhCost));
    params.set('infHours', String(dailyInferenceHours));
    params.set('idleHours', String(dailyIdleHours));
    params.set('volume', String(monthlyTokenVolumeM));
    params.set('inputRatio', String(inputRatio));
    params.set('api', selectedApiId);
    if (selectedPlanTierId) params.set('plan', selectedPlanTierId);

    setSearchParams(params, { replace: true });
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSelectedPresetId('mac-mini-m4-pro-64gb');
    setCustomCapex(null);
    setAmortizationMonths(24);
    setSalvagePercent(20);
    setElectricityKwhCost(0.16);
    setDailyInferenceHours(3);
    setDailyIdleHours(9);
    setMonthlyTokenVolumeM(6);
    setInputRatio(0.8);
    setSelectedApiId('anthropic/claude-3.7-sonnet');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  if (modelsLoading || plansLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative border border-steel-700/60 rounded-xl p-6 sm:p-8 steel-surface overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider font-display rounded border border-primary/40 bg-primary/10 text-primary-light flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Silicon vs Cloud Reality Check
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider font-display rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Offline Air-Gap
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-text uppercase tracking-wider">
              Local Hardware vs Cloud Breakeven Calculator
            </h1>
            <p className="text-text-muted text-sm sm:text-base leading-relaxed">
              Model upfront CapEx depreciation, residual salvage resale, active inference electricity OpEx, memory bandwidth constraints, and generation throughput. Unmask whether owning Apple Silicon or an NVIDIA rig is truly cheaper than cloud APIs and subscriptions.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider font-display rounded border border-steel-600 bg-surface-alt hover:bg-steel-700/50 text-text transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? 'Link Copied' : 'Share Config'}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider font-display rounded border border-steel-700 hover:border-steel-600 bg-void-900 text-text-muted hover:text-text transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hardware Presets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-display text-text flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Step 1: Choose Hardware Architecture Preset
          </h2>
          <span className="text-xs text-text-muted font-mono">
            {HARDWARE_PRESETS.length} Curated Workstations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HARDWARE_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPresetId(preset.id);
                  setCustomCapex(null);
                }}
                className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-[0_0_16px_hsl(0_70%_40%_/0.2)] ring-1 ring-primary'
                    : 'border-steel-700/60 bg-surface hover:border-steel-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-steel-800 text-steel-300 border border-steel-700">
                      {preset.badge}
                    </span>
                    <span className="text-base font-bold font-mono text-primary-light">
                      ${preset.capexUsd.toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-text mb-1">
                    {preset.name}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 mb-3">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-steel-700/40 grid grid-cols-3 gap-1 text-[11px] font-mono text-steel-400">
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase">VRAM</span>
                    <span className="font-bold text-text">{preset.memoryGb} GB</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase">Bandwidth</span>
                    <span className="font-bold text-text">{preset.memoryBandwidthGbps} GB/s</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-text-muted uppercase">TDP Load</span>
                    <span className="font-bold text-amber-400">{preset.loadPowerWatts}W</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Controls & Cost Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration Sliders & Selectors */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-steel-700/60 rounded-xl p-5 bg-surface space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider font-display text-text flex items-center gap-2 border-b border-steel-700/60 pb-3">
              <Cpu className="w-4 h-4 text-primary" />
              Hardware & Financial Assumptions
            </h3>

            {/* CapEx Overrides */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-text-muted">Hardware Initial CapEx</span>
                <span className="font-bold text-primary-light">
                  ${(customCapex !== null ? customCapex : currentPreset.capexUsd).toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="100"
                value={customCapex !== null ? customCapex : currentPreset.capexUsd}
                onChange={(e) => setCustomCapex(Number(e.target.value))}
                className="w-full accent-primary bg-steel-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Amortization Months */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-text-muted">Depreciation Timeline</span>
                <span className="font-bold text-text">{amortizationMonths} Months ({Math.round(amortizationMonths / 12 * 10) / 10} yrs)</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 36, 48].map((m) => (
                  <button
                    key={m}
                    onClick={() => setAmortizationMonths(m)}
                    className={`py-1.5 text-xs font-mono font-semibold rounded border transition-colors ${
                      amortizationMonths === m
                        ? 'border-primary bg-primary/20 text-primary-light'
                        : 'border-steel-700 bg-void-900 text-steel-400 hover:text-text'
                    }`}
                  >
                    {m} mo
                  </button>
                ))}
              </div>
            </div>

            {/* Salvage Resale Value */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-text-muted">Residual Resale Value (Salvage)</span>
                <span className="font-bold text-text">{salvagePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={salvagePercent}
                onChange={(e) => setSalvagePercent(Number(e.target.value))}
                className="w-full accent-primary bg-steel-800 rounded-lg cursor-pointer h-1.5"
              />
              <p className="text-[10px] text-text-muted mt-1 font-mono">
                Deducts expected hardware resale value after {amortizationMonths} months of depreciation.
              </p>
            </div>

            {/* Electricity Rate & Usage */}
            <div className="pt-2 border-t border-steel-700/40 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-text-muted">Electricity Rate ($/kWh)</span>
                  <span className="font-bold text-amber-400">${electricityKwhCost.toFixed(2)}/kWh</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.01"
                  value={electricityKwhCost}
                  onChange={(e) => setElectricityKwhCost(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-steel-800 rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-text-muted">Active Load</span>
                    <span className="font-bold text-text">{dailyInferenceHours}h / day</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={dailyInferenceHours}
                    onChange={(e) => setDailyInferenceHours(Number(e.target.value))}
                    className="w-full accent-primary bg-steel-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                    <span className="text-text-muted">Idle Power</span>
                    <span className="font-bold text-text">{dailyIdleHours}h / day</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="18"
                    step="1"
                    value={dailyIdleHours}
                    onChange={(e) => setDailyIdleHours(Number(e.target.value))}
                    className="w-full accent-primary bg-steel-800 rounded-lg cursor-pointer h-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Workload & Targets */}
          <div className="border border-steel-700/60 rounded-xl p-5 bg-surface space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider font-display text-text flex items-center gap-2 border-b border-steel-700/60 pb-3">
              <Zap className="w-4 h-4 text-blood-400" />
              Workload & Cloud Baselines
            </h3>

            {/* Monthly Token Volume */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-text-muted">Monthly Workload Volume</span>
                <span className="font-bold text-primary-light">{monthlyTokenVolumeM}M Tokens/mo</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="40"
                step="0.5"
                value={monthlyTokenVolumeM}
                onChange={(e) => setMonthlyTokenVolumeM(Number(e.target.value))}
                className="w-full accent-primary bg-steel-800 rounded-lg cursor-pointer h-1.5"
              />
              <div className="flex justify-between text-[10px] text-text-muted font-mono mt-1">
                <span>0.5M (Casual)</span>
                <span>10M (Power Dev)</span>
                <span>40M (Heavy Agent Swarm)</span>
              </div>
            </div>

            {/* Input:Output Ratio */}
            <div>
              <div className="flex justify-between text-xs mb-1.5 font-mono">
                <span className="text-text-muted">Input : Output Ratio</span>
                <span className="font-bold text-text">{Math.round(inputRatio * 100)}% Input : {Math.round((1 - inputRatio) * 100)}% Output</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="0.95"
                step="0.05"
                value={inputRatio}
                onChange={(e) => setInputRatio(Number(e.target.value))}
                className="w-full accent-primary bg-steel-800 rounded-lg cursor-pointer h-1.5"
              />
            </div>

            {/* Comparison API */}
            <div>
              <label className="block text-xs font-mono text-text-muted mb-1.5">
                Cloud API to Compare Against
              </label>
              <select
                value={selectedApiId}
                onChange={(e) => setSelectedApiId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-void-950 border border-steel-700 rounded-lg text-text focus:border-primary focus:outline-none"
              >
                {models
                  .filter((m) => m.pricing && m.pricing.input > 0)
                  .slice(0, 30)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (${formatPrice(m.pricing.input * 1_000_000)}/M in, ${formatPrice(m.pricing.output * 1_000_000)}/M out)
                    </option>
                  ))}
              </select>
            </div>

            {/* Comparison Subscription Plan */}
            {planTiersList.length > 0 && (
              <div>
                <label className="block text-xs font-mono text-text-muted mb-1.5">
                  Coding Subscription Tier
                </label>
                <select
                  value={selectedPlanTierId}
                  onChange={(e) => setSelectedPlanTierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-void-950 border border-steel-700 rounded-lg text-text focus:border-primary focus:outline-none"
                >
                  {planTiersList.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right: Key Metrics & Recharts Visualizer */}
        <div className="lg:col-span-7 space-y-6">
          {/* 4 Scorecard Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-steel-700/60 bg-surface">
              <span className="text-[11px] font-mono text-text-muted uppercase block mb-1">
                Local Monthly Cost
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-text">
                ${economics.totalMonthlyLocalCost}
                <span className="text-xs text-text-muted font-normal">/mo</span>
              </div>
              <div className="text-[10px] font-mono text-steel-400 mt-1">
                ${economics.monthlyAmortizationCost} cap + ${economics.monthlyElectricityCost} pwr
              </div>
            </div>

            <div className="p-4 rounded-xl border border-steel-700/60 bg-surface">
              <span className="text-[11px] font-mono text-text-muted uppercase block mb-1">
                Cloud API Spend
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
                ${economics.monthlyCloudApiCost}
                <span className="text-xs text-text-muted font-normal">/mo</span>
              </div>
              <div className="text-[10px] font-mono text-steel-400 mt-1">
                ${economics.blendedApiRatePerM}/M blended
              </div>
            </div>

            <div className="p-4 rounded-xl border border-steel-700/60 bg-surface">
              <span className="text-[11px] font-mono text-text-muted uppercase block mb-1">
                Net Monthly Alpha
              </span>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono flex items-center gap-1 ${
                  economics.monthlySavingsVsApi >= 0 ? 'text-emerald-400' : 'text-blood-400'
                }`}
              >
                {economics.monthlySavingsVsApi >= 0 ? (
                  <TrendingDown className="w-5 h-5 text-emerald-400 inline" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-blood-400 inline" />
                )}
                {economics.monthlySavingsVsApi >= 0 ? '+' : ''}
                ${economics.monthlySavingsVsApi}
              </div>
              <div className="text-[10px] font-mono text-steel-400 mt-1">
                {economics.monthlySavingsVsApi >= 0 ? 'Local saves money' : 'Local currently more costly'}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-steel-700/60 bg-surface">
              <span className="text-[11px] font-mono text-text-muted uppercase block mb-1">
                Breakeven Volume
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-primary-light">
                {economics.crossoverVolumeM}M
                <span className="text-xs text-text-muted font-normal"> tok/mo</span>
              </div>
              <div className="text-[10px] font-mono text-steel-400 mt-1">
                {economics.paybackMonthsVsApi ? `${economics.paybackMonthsVsApi} mo payback` : 'Low cloud rate'}
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="border border-steel-700/60 rounded-xl p-5 bg-surface space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel-700/60 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-display text-text">
                  {activeChartTab === 'crossover' ? 'Breakeven Volume Crossover Curve' : '36-Month Cumulative TCO Outlay'}
                </h3>
                <p className="text-xs text-text-muted">
                  {activeChartTab === 'crossover'
                    ? `Exact inflection point where ${currentPreset.shortName} becomes cheaper than ${apiModel.name}`
                    : `Compounding CapEx + Electricity vs relentless cloud recurring subscriptions`}
                </p>
              </div>

              <div className="flex items-center gap-1 bg-void-950 p-1 rounded-lg border border-steel-700 self-start">
                <button
                  onClick={() => setActiveChartTab('crossover')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeChartTab === 'crossover'
                      ? 'bg-primary text-text font-bold shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  Crossover Volume
                </button>
                <button
                  onClick={() => setActiveChartTab('tco')}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    activeChartTab === 'tco'
                      ? 'bg-primary text-text font-bold shadow-sm'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  36-Mo Cumulative TCO
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === 'crossover' ? (
                  <LineChart data={economics.crossoverSeries} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243042" />
                    <XAxis
                      dataKey="volumeM"
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `${val}M`}
                      label={{ value: 'Monthly Tokens (Million)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `$${val}`}
                      label={{ value: 'Monthly Cost ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0d14',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}/mo`]}
                      labelFormatter={(val) => `${val} Million Tokens/mo`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="localCost"
                      name={`${currentPreset.shortName} (Local Cost)`}
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cloudApiCost"
                      name={`${apiModel.name} (Direct API)`}
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                    {currentPlanTier && (
                      <Line
                        type="monotone"
                        dataKey="cloudPlanCost"
                        name={`${currentPlanTier.label}`}
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    {/* Highlight crossover dot if inside visible range */}
                    {economics.crossoverVolumeM <= (economics.crossoverSeries[economics.crossoverSeries.length - 1]?.volumeM ?? 0) && (
                      <ReferenceDot
                        x={economics.crossoverVolumeM}
                        y={economics.totalMonthlyLocalCost}
                        r={6}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                ) : (
                  <LineChart data={economics.cumulativeTcoSeries} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243042" />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `M${val}`}
                      label={{ value: 'Depreciation Timeline (Months)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                      label={{ value: 'Cumulative Spend ($)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0d14',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`]}
                      labelFormatter={(val) => `Month ${val}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="cumulativeLocal"
                      name={`${currentPreset.shortName} (CapEx + Power)`}
                      stroke="#ef4444"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeApi"
                      name={`${apiModel.name} Cumulative API`}
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                    />
                    {currentPlanTier && (
                      <Line
                        type="monotone"
                        dataKey="cumulativePlan"
                        name={`${currentPlanTier.label} Cumulative`}
                        stroke="#10b981"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-void-950 border border-steel-700/60 text-xs font-mono text-steel-400">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>
                {economics.crossoverVolumeM > 0 ? (
                  <>
                    At <strong className="text-primary-light">{economics.crossoverVolumeM}M tokens/month</strong>, running <strong className="text-text">{currentPreset.shortName}</strong> becomes cheaper than paying <strong className="text-text">{apiModel.name}</strong>.
                  </>
                ) : (
                  <>Local workstation never breaks even against this API rate under these parameters.</>
                )}
              </span>
            </div>
          </div>

          {/* Model Fit & Hardware Feasibility Matrix */}
          <div className="border border-steel-700/60 rounded-xl p-5 bg-surface space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-display text-text flex items-center justify-between border-b border-steel-700/60 pb-3">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Verified Local Models for {currentPreset.shortName}
              </span>
              <span className="text-[11px] font-mono text-text-muted">
                {currentPreset.memoryGb} GB VRAM Available
              </span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-steel-700/60 text-text-muted">
                    <th className="pb-2 font-normal">Model</th>
                    <th className="pb-2 font-normal">Quant</th>
                    <th className="pb-2 font-normal">VRAM Fit</th>
                    <th className="pb-2 font-normal">Throughput</th>
                    <th className="pb-2 font-normal">Max Context</th>
                    <th className="pb-2 font-normal text-right">Coding Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel-800">
                  {currentPreset.recommendedModels.map((m) => {
                    const memoryRatio = m.vramRequiredGb / currentPreset.memoryGb;
                    return (
                      <tr key={m.name} className="hover:bg-steel-800/30 transition-colors">
                        <td className="py-2.5 font-bold text-text">
                          {m.name}
                          <span className="block text-[10px] text-text-muted font-normal">{m.parameterSize}</span>
                        </td>
                        <td className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded bg-steel-800 text-steel-300 text-[10px]">
                            {m.quantization}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 h-1.5 bg-steel-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  memoryRatio > 0.85 ? 'bg-amber-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${Math.min(100, memoryRatio * 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-steel-300">{m.vramRequiredGb}GB</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-primary-light font-bold">
                          {m.tokensPerSec} t/s
                        </td>
                        <td className="py-2.5 text-steel-400">
                          {Math.round(m.contextLimitTokens / 1024)}k tokens
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">
                          {m.codingBenchmarkScore.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Deep-Dive Tradeoffs: The Unfiltered Reality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider font-display text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Why Local Hardware Wins
          </h4>
          <ul className="space-y-2 text-xs text-steel-300">
            {currentPreset.pros.map((pro, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pro}</span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Zero Data Leakage:</strong> Proprietary client IP, database schemas, and credentials never touch external networks or third-party training logs.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Zero Metering Anxiety:</strong> Run endless unit test repair loops and background agent iterations without watching token counters drain.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider font-display text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            The Hidden Costs & Tradeoffs
          </h4>
          <ul className="space-y-2 text-xs text-steel-300">
            {currentPreset.cons.map((con, i) => (
              <li key={i} className="flex items-start gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{con}</span>
              </li>
            ))}
            <li className="flex items-start gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Prefill Latency (TTFT):</strong> Ingesting massive 64k+ repomaps takes several seconds locally vs instant prompt caching on cloud provider H100 clusters.</span>
            </li>
            <li className="flex items-start gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Model Obsolescence:</strong> Frontier models (Sonnet 3.7, GPT-4.5) continuously leap ahead of open weights; local hardware cannot be scaled past its physical VRAM ceiling.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
