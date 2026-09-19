import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  calculateTeamEconomics,
  SEAT_PROVIDERS,
  TEAM_ARCHETYPES,
  type TeamArchetype,
  type SeatProvider,
} from '../lib/teams';
import { formatPrice } from '../lib/pricing';
import {
  Building2,
  Users,
  TrendingDown,
  ShieldCheck,
  Zap,
  Sparkles,
  Share2,
  Check,
  RotateCcw,
  Copy,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export default function TeamEconomics() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial params
  const initialSize = Math.min(100, Math.max(5, Number(searchParams.get('size')) || 25));
  const initialCasual = Math.min(100, Math.max(0, Number(searchParams.get('casual')) || 60));
  const initialStandard = Math.min(100, Math.max(0, Number(searchParams.get('standard')) || 30));
  const initialPower = Math.min(100, Math.max(0, Number(searchParams.get('power')) || 10));
  const initialProviderId = searchParams.get('provider') || 'cursor-business';

  const [teamSize, setTeamSize] = useState<number>(initialSize);
  const [casualPercent, setCasualPercent] = useState<number>(initialCasual);
  const [standardPercent, setStandardPercent] = useState<number>(initialStandard);
  const [powerPercent, setPowerPercent] = useState<number>(initialPower);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(initialProviderId);
  const [cacheDiscount] = useState<number>(0.15); // 15% team cache bonus

  const [copiedShare, setCopiedShare] = useState<boolean>(false);
  const [copiedMemo, setCopiedMemo] = useState<boolean>(false);

  // Sync to URL
  const updateUrl = (
    size: number,
    cas: number,
    std: number,
    pow: number,
    prov: string
  ) => {
    const params = new URLSearchParams();
    params.set('size', size.toString());
    params.set('casual', cas.toString());
    params.set('standard', std.toString());
    params.set('power', pow.toString());
    params.set('provider', prov);
    setSearchParams(params, { replace: true });
  };

  const handleSizeChange = (val: number) => {
    setTeamSize(val);
    updateUrl(val, casualPercent, standardPercent, powerPercent, selectedProviderId);
  };

  const handleCasualChange = (val: number) => {
    setCasualPercent(val);
    updateUrl(teamSize, val, standardPercent, powerPercent, selectedProviderId);
  };

  const handleStandardChange = (val: number) => {
    setStandardPercent(val);
    updateUrl(teamSize, casualPercent, val, powerPercent, selectedProviderId);
  };

  const handlePowerChange = (val: number) => {
    setPowerPercent(val);
    updateUrl(teamSize, casualPercent, standardPercent, val, selectedProviderId);
  };

  const handleProviderChange = (val: string) => {
    setSelectedProviderId(val);
    updateUrl(teamSize, casualPercent, standardPercent, powerPercent, val);
  };

  const applyArchetype = (arch: TeamArchetype) => {
    setTeamSize(arch.teamSize);
    setCasualPercent(arch.casualPercent);
    setStandardPercent(arch.standardPercent);
    setPowerPercent(arch.powerPercent);
    updateUrl(arch.teamSize, arch.casualPercent, arch.standardPercent, arch.powerPercent, selectedProviderId);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  // Run economics simulation
  const result = useMemo(() => {
    return calculateTeamEconomics({
      teamSize,
      casualPercent,
      standardPercent,
      powerPercent,
      selectedProviderId,
      sharedPromptCacheDiscount: cacheDiscount,
    });
  }, [teamSize, casualPercent, standardPercent, powerPercent, selectedProviderId, cacheDiscount]);

  // Chart data across team scale benchmarks (10, 25, 50, 100 engineers)
  const chartData = useMemo(() => {
    const scalePoints = [10, 25, 50, 100];
    return scalePoints.map((size) => {
      const res = calculateTeamEconomics({
        teamSize: size,
        casualPercent,
        standardPercent,
        powerPercent,
        selectedProviderId,
        sharedPromptCacheDiscount: cacheDiscount,
      });
      return {
        team: `${size} Devs`,
        flatSeats: Math.round(res.flatSeatsAnnual),
        gateway: Math.round(res.gatewayAnnual),
        hybrid: Math.round(res.hybridAnnual),
      };
    });
  }, [casualPercent, standardPercent, powerPercent, selectedProviderId, cacheDiscount]);

  // Executive Memo text
  const executiveMemo = useMemo(() => {
    return [
      `EXECUTIVE PROCUREMENT BRIEFING: AI CODING TOOL ROI`,
      `Team Size: ${teamSize} Software Engineers`,
      `Benchmark Provider: ${result.provider.name} ($${result.provider.monthlySeatPrice}/user/month)`,
      ``,
      `FINDINGS & POWER-LAW REALITY:`,
      `- 100% Flat Seat Licenses: ${formatPrice(result.flatSeatsAnnual)} / year`,
      `- Centralized API Gateway: ${formatPrice(result.gatewayAnnual)} / year`,
      `- Optimal Hybrid Strategy: ${formatPrice(result.hybridAnnual)} / year`,
      ``,
      `STRATEGIC RECOMMENDATION:`,
      `Deploy a Hybrid Procurement Model:`,
      `1. Provision flat seat licenses for the top ${result.personaBreakdowns.find((r) => r.persona.id === 'power')?.count || 0} power agentic developers where the vendor absorbs heavy compute.`,
      `2. Route the remaining ${result.teamSize - (result.personaBreakdowns.find((r) => r.persona.id === 'power')?.count || 0)} casual/standard developers through a centralized API gateway (LiteLLM/OpenRouter) with team prompt-cache pooling.`,
      ``,
      `NET BOTTOM-LINE SAVINGS: ${formatPrice(result.annualSavingsVsFlat)} / year (${result.savingsPercentageVsFlat}% reduction vs flat seats).`,
    ].join('\n');
  }, [result, teamSize]);

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(executiveMemo);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="relative border-b border-steel-700/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/20 border border-primary/40 text-primary-light shadow-[0_0_15px_hsl(0_70%_40%_/0.3)]">
                <Building2 className="w-6 h-6 text-blood-400" />
              </span>
              <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-text">
                Multi-Seat Team & Gateway Economics
              </h1>
            </div>
            <p className="text-text-muted mt-2 max-w-3xl text-sm leading-relaxed">
              Model the 80/20 power-law usage distribution across engineering teams. Compare flat $19–$40/seat licenses against centralized API gateway pooling (LiteLLM/OpenRouter) and unlock 35%–60% annual savings with hybrid provisioning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text transition-colors shadow-sm"
              title="Copy shareable link"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blood-400" />
                  <span>Share Analysis</span>
                </>
              )}
            </button>
            <button
              onClick={() => applyArchetype(TEAM_ARCHETYPES[1])}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text transition-colors"
              title="Reset to growth startup baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Team Archetype Presets */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-display font-bold text-steel-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-blood-500" />
            Team Archetypes:
          </span>
          {TEAM_ARCHETYPES.map((arch) => {
            const isActive =
              teamSize === arch.teamSize &&
              casualPercent === arch.casualPercent &&
              standardPercent === arch.standardPercent &&
              powerPercent === arch.powerPercent;
            return (
              <button
                key={arch.id}
                onClick={() => applyArchetype(arch)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? 'border-blood-500/80 bg-blood-950/60 text-blood-200 shadow-[0_0_12px_hsl(0_70%_40%_/0.25)]'
                    : 'border-steel-700/60 bg-void-950/40 text-steel-300 hover:border-steel-500 hover:text-text'
                }`}
                title={arch.description}
              >
                {arch.name} ({arch.teamSize} Devs)
              </button>
            );
          })}
        </div>
      </div>

      {/* Team Configuration Controls & Impact KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Card */}
        <div className="lg:col-span-7 p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-6">
          <div className="flex items-center justify-between border-b border-steel-800 pb-3">
            <h2 className="text-sm uppercase tracking-widest font-display font-bold text-steel-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blood-500" />
              Engineering Team Parameters
            </h2>
            <span className="text-xs text-text-muted">
              {teamSize} total software engineers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Size */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold uppercase tracking-wider text-steel-300">
                  Total Team Size:
                </label>
                <span className="font-mono text-blood-300 font-bold px-2 py-0.5 rounded bg-surface border border-steel-700">
                  {teamSize} Engineers
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={teamSize}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="w-full accent-blood-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>5 (Squad)</span>
                <span>25 (Growth Org)</span>
                <span>50 (Mid-Enterprise)</span>
                <span>100 (Enterprise)</span>
              </div>
            </div>

            {/* Benchmark Seat Provider */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                Benchmark Flat Seat License Provider:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEAT_PROVIDERS.map((prov: SeatProvider) => {
                  const isSelected = selectedProviderId === prov.id;
                  return (
                    <button
                      key={prov.id}
                      onClick={() => handleProviderChange(prov.id)}
                      className={`p-2.5 text-left rounded border transition-all ${
                        isSelected
                          ? 'border-blood-500 bg-blood-950/60 text-blood-200 shadow-[0_0_10px_hsl(0_70%_40%_/0.2)]'
                          : 'border-steel-800 bg-surface/40 text-text-muted hover:border-steel-700 hover:text-text'
                      }`}
                    >
                      <div className="text-xs font-bold font-display uppercase truncate">
                        {prov.name}
                      </div>
                      <div className="text-[11px] font-mono text-blood-300 mt-1">
                        ${prov.monthlySeatPrice}/user/mo
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Persona Distribution Sliders */}
            <div className="space-y-4 md:col-span-2 border-t border-steel-800 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                Developer Usage Persona Split:
              </span>

              {/* Casual */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-steel-300">
                    Casual Autocomplete Users (~$3.80/mo compute):
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {casualPercent}% ({Math.round(teamSize * (casualPercent / 100))} Devs)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={casualPercent}
                  onChange={(e) => handleCasualChange(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Standard */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-steel-300">
                    Interactive Pair Programmers (~$16.50/mo compute):
                  </span>
                  <span className="font-mono text-blue-400 font-bold">
                    {standardPercent}% ({Math.round(teamSize * (standardPercent / 100))} Devs)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={standardPercent}
                  onChange={(e) => handleStandardChange(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Power */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-steel-300">
                    Autonomous Agent Power Users (~$78.00/mo compute):
                  </span>
                  <span className="font-mono text-blood-400 font-bold">
                    {powerPercent}% ({Math.round(teamSize * (powerPercent / 100))} Devs)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={powerPercent}
                  onChange={(e) => handlePowerChange(Number(e.target.value))}
                  className="w-full accent-blood-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Impact ROI Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
              100% Flat Seats Cost
            </span>
            <div className="text-2xl font-display font-bold text-text mt-1">
              {formatPrice(result.flatSeatsAnnual)}
              <span className="text-xs text-text-muted font-normal"> / year</span>
            </div>
            <span className="text-xs text-text-muted mt-1">
              {formatPrice(result.flatSeatsMonthly)} / month
            </span>
          </div>

          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
              Optimal Hybrid Cost
            </span>
            <div className="text-2xl font-display font-bold text-emerald-400 mt-1">
              {formatPrice(result.hybridAnnual)}
              <span className="text-xs text-text-muted font-normal"> / year</span>
            </div>
            <span className="text-xs text-text-muted mt-1">
              {formatPrice(result.hybridMonthly)} / month
            </span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/20 col-span-2 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest font-display text-emerald-300 flex items-center gap-1.5 font-bold">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                Net Annual Company Savings
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/40 text-emerald-300">
                {result.savingsPercentageVsFlat}% Less
              </span>
            </div>
            <div className="text-3xl font-display font-bold text-emerald-400">
              {formatPrice(result.annualSavingsVsFlat)}
              <span className="text-xs text-emerald-300/80 font-normal"> / year saved</span>
            </div>
            <p className="text-xs text-emerald-200/80">
              By replacing unutilized flat seats for casual developers with pooled pay-as-you-go gateway routing.
            </p>
          </div>
        </div>
      </div>

      {/* Recharts Scale Comparison Chart */}
      <div className="p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-blood-500" />
              Annual Cost Scaling: Flat Seats vs. Centralized Gateway vs. Hybrid ($ / Year)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Comparison across organization sizes maintaining your current persona distribution.
            </p>
          </div>
          <span className="text-xs text-steel-400 font-mono hidden sm:inline">
            Provider: {result.provider.name}
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
              <XAxis dataKey="team" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-lg border border-steel-700 bg-surface shadow-xl text-xs space-y-1.5">
                        <div className="font-bold text-text">{data.team}</div>
                        <div className="flex justify-between gap-4">
                          <span className="text-rose-400">Flat Seats:</span>
                          <span className="font-mono font-bold text-text">${data.flatSeats.toLocaleString()}/yr</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-blue-400">100% Gateway:</span>
                          <span className="font-mono font-bold text-text">${data.gateway.toLocaleString()}/yr</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-steel-800 pt-1">
                          <span className="text-emerald-400 font-bold">Optimal Hybrid:</span>
                          <span className="font-mono font-bold text-emerald-400">${data.hybrid.toLocaleString()}/yr</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => {
                  if (value === 'flatSeats') return `100% Flat Seats (${result.provider.name})`;
                  if (value === 'gateway') return '100% Centralized Gateway';
                  if (value === 'hybrid') return 'Optimal Hybrid Strategy';
                  return value;
                }}
              />
              <Bar dataKey="flatSeats" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gateway" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hybrid" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Persona Economics Table */}
      <div className="rounded-xl border border-steel-700/60 bg-void-950/60 overflow-hidden">
        <div className="p-4 border-b border-steel-800 flex items-center justify-between">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text">
            Persona Cost Breakdown ({teamSize} Total Engineers)
          </h3>
          <span className="text-xs text-text-muted">
            15% organization prompt cache discount applied
          </span>
        </div>

        <div className="divide-y divide-steel-800/80">
          {result.personaBreakdowns.map((row) => {
            const isHybridFlat = row.hybridStrategyAssigned === 'flat-seat';
            return (
              <div key={row.persona.id} className="p-4 hover:bg-surface/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text text-sm">{row.persona.name}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-steel-700 text-steel-300">
                        {row.count} Devs
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">{row.persona.description}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center min-w-[280px]">
                    <div className="p-2 rounded bg-void-950/40 border border-steel-800">
                      <div className="text-[10px] uppercase text-text-muted">API Spend / User</div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        ${row.directApiCostPerUser}/mo
                      </div>
                    </div>
                    <div className="p-2 rounded bg-void-950/40 border border-steel-800">
                      <div className="text-[10px] uppercase text-text-muted">Flat Seat / User</div>
                      <div className="text-xs font-mono font-bold text-rose-400">
                        ${result.provider.monthlySeatPrice}/mo
                      </div>
                    </div>
                    <div className="p-2 rounded bg-void-950/40 border border-steel-800">
                      <div className="text-[10px] uppercase text-text-muted">Group Total</div>
                      <div className="text-xs font-mono font-bold text-text">
                        ${Math.round(row.hybridCost)}/mo
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end min-w-[170px]">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide border ${
                        isHybridFlat
                          ? 'bg-purple-950/60 text-purple-300 border-purple-600/40'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                      }`}
                    >
                      {isHybridFlat ? (
                        <>
                          <Zap className="w-3.5 h-3.5 text-purple-400" />
                          <span>Flat Seat</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Gateway API</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Executive Procurement Briefing Card */}
      <div className="p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4">
        <div className="flex items-center justify-between border-b border-steel-800 pb-3">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blood-500" />
            Executive Procurement Briefing (Copy-Paste Memo)
          </h3>
          <button
            onClick={handleCopyMemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text transition-colors shadow-sm"
          >
            {copiedMemo ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blood-400" />
                <span>Copy Executive Memo</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 rounded-lg bg-void-950 border border-steel-800 font-mono text-xs text-steel-300 leading-relaxed whitespace-pre overflow-x-auto">
          {executiveMemo}
        </div>
      </div>
    </div>
  );
}
