import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  simulateAllProfiles,
  CADENCE_DEFINITIONS,
  type TurnCadence,
} from '../lib/throttle';
import type { ThrottleStatus } from '../lib/throttle-profiles';
import {
  Zap,
  Gauge,
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface Preset {
  name: string;
  description: string;
  concurrency: number;
  duration: number;
  cadence: TurnCadence;
}

const PRESETS: Preset[] = [
  {
    name: 'Solo Interactive Sprint',
    description: '1 agent, 2h standard pair programming. Low stress, standard developer workflow.',
    concurrency: 1,
    duration: 2,
    cadence: 'standard',
  },
  {
    name: 'Full-Stack Agent Pair',
    description: '2 parallel subagents (frontend + backend) executing for 4 hours with active review.',
    concurrency: 2,
    duration: 4,
    cadence: 'standard',
  },
  {
    name: 'Autonomous Multi-Agent Fleet',
    description: '4 parallel autonomous loops testing and refactoring code every 30s for 4 hours.',
    concurrency: 4,
    duration: 4,
    cadence: 'rapid',
  },
  {
    name: 'Extreme Concurrency Stress Test',
    description: '8 parallel agents continuously cycling for 5 hours. Exposes hard ceilings.',
    concurrency: 8,
    duration: 5,
    cadence: 'rapid',
  },
];

export default function BurstSimulator() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial parameters from URL or use defaults
  const initialConcurrency = Math.min(10, Math.max(1, Number(searchParams.get('agents')) || 2));
  const initialDuration = Math.min(8, Math.max(1, Number(searchParams.get('duration')) || 4));
  const rawCadence = searchParams.get('cadence') as TurnCadence;
  const initialCadence: TurnCadence = (rawCadence && CADENCE_DEFINITIONS[rawCadence]) ? rawCadence : 'standard';
  const initialPrior = Math.min(90, Math.max(0, Number(searchParams.get('prior')) || 20));

  const [concurrency, setConcurrency] = useState<number>(initialConcurrency);
  const [sprintDuration, setSprintDuration] = useState<number>(initialDuration);
  const [cadence, setCadence] = useState<TurnCadence>(initialCadence);
  const [priorUsage, setPriorUsage] = useState<number>(initialPrior);
  const [statusFilter, setStatusFilter] = useState<'all' | ThrottleStatus>('all');
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync state to URL search params
  const updateUrlParams = (
    newConcurrency: number,
    newDuration: number,
    newCadence: TurnCadence,
    newPrior: number
  ) => {
    const params = new URLSearchParams();
    params.set('agents', newConcurrency.toString());
    params.set('duration', newDuration.toString());
    params.set('cadence', newCadence);
    params.set('prior', newPrior.toString());
    setSearchParams(params, { replace: true });
  };

  const handleConcurrencyChange = (val: number) => {
    setConcurrency(val);
    updateUrlParams(val, sprintDuration, cadence, priorUsage);
  };

  const handleDurationChange = (val: number) => {
    setSprintDuration(val);
    updateUrlParams(concurrency, val, cadence, priorUsage);
  };

  const handleCadenceChange = (val: TurnCadence) => {
    setCadence(val);
    updateUrlParams(concurrency, sprintDuration, val, priorUsage);
  };

  const handlePriorChange = (val: number) => {
    setPriorUsage(val);
    updateUrlParams(concurrency, sprintDuration, cadence, val);
  };

  const applyPreset = (preset: Preset) => {
    setConcurrency(preset.concurrency);
    setSprintDuration(preset.duration);
    setCadence(preset.cadence);
    updateUrlParams(preset.concurrency, preset.duration, preset.cadence, priorUsage);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run simulation against all profiles
  const simulationResults = useMemo(() => {
    return simulateAllProfiles({
      concurrency,
      sprintDurationHours: sprintDuration,
      turnPace: cadence,
      priorMonthlyUsagePercent: priorUsage,
    });
  }, [concurrency, sprintDuration, cadence, priorUsage]);

  // Overall KPI statistics
  const totalTurnsAttempted = simulationResults[0]?.totalTurnsRequested || 0;
  const estimatedTokensM = Number(((totalTurnsAttempted * 21000) / 1000000).toFixed(1));
  const smoothCount = simulationResults.filter((r) => r.status === 'smooth').length;
  const queuedCount = simulationResults.filter((r) => r.status === 'queued').length;
  const blockedCount = simulationResults.filter((r) => r.status === 'blocked').length;

  const filteredResults = useMemo(() => {
    if (statusFilter === 'all') return simulationResults;
    return simulationResults.filter((r) => r.status === statusFilter);
  }, [simulationResults, statusFilter]);

  // Currently inspected profile for timeline details
  const activeDetail = useMemo(() => {
    if (selectedResultId) {
      const found = simulationResults.find((r) => r.profile.id === selectedResultId);
      if (found) return found;
    }
    return simulationResults[0];
  }, [selectedResultId, simulationResults]);

  // Chart data for headroom comparison
  const chartData = useMemo(() => {
    return simulationResults.slice(0, 10).map((r) => ({
      name: `${r.profile.name} (${r.profile.tierName})`,
      headroom: r.headroomScore,
      status: r.status,
      survival: r.survivalHours,
    }));
  }, [simulationResults]);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="relative border-b border-steel-700/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/20 border border-primary/40 text-primary-light shadow-[0_0_15px_hsl(0_70%_40%_/0.3)]">
                <Zap className="w-6 h-6 text-blood-400" />
              </span>
              <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-text">
                Burst & Window Throttle Simulator
              </h1>
            </div>
            <p className="text-text-muted mt-2 max-w-3xl text-sm leading-relaxed">
              Model multi-agent concurrency walls, 5-hour rolling pool cliffs, and slow-queue degradations across 15+ coding subscription tiers and API providers before you launch your sprint.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text transition-colors shadow-sm"
              title="Copy link to current sprint configuration"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blood-400" />
                  <span>Share Scenario</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                applyPreset(PRESETS[1]);
                setPriorUsage(20);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text-muted hover:text-text transition-colors"
              title="Reset parameters to standard full-stack sprint"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-display font-bold text-steel-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-blood-500" />
            Sprint Presets:
          </span>
          {PRESETS.map((preset) => {
            const isActive =
              concurrency === preset.concurrency &&
              sprintDuration === preset.duration &&
              cadence === preset.cadence;
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? 'border-blood-500/80 bg-blood-950/60 text-blood-200 shadow-[0_0_12px_hsl(0_70%_40%_/0.25)]'
                    : 'border-steel-700/60 bg-void-950/40 text-steel-300 hover:border-steel-500 hover:text-text'
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Configuration Controls & Overview Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sprint Controls Card */}
        <div className="lg:col-span-8 p-6 rounded-xl border border-steel-700/60 bg-void-950/60 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between border-b border-steel-800/80 pb-3">
            <h2 className="text-sm uppercase tracking-widest font-display font-bold text-steel-200 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blood-500" />
              Sprint Parameters
            </h2>
            <span className="text-xs text-text-muted">
              {concurrency} agents &bull; {sprintDuration}h sprint &bull; {CADENCE_DEFINITIONS[cadence].turnsPerHourPerAgent * concurrency} turns/hr
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parallel Agents */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold uppercase tracking-wider text-steel-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blood-400" />
                  Concurrent Agents:
                </label>
                <span className="font-mono text-blood-300 font-bold px-2 py-0.5 rounded bg-surface border border-steel-700">
                  {concurrency} {concurrency === 1 ? 'Agent' : 'Agents'}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={concurrency}
                onChange={(e) => handleConcurrencyChange(Number(e.target.value))}
                className="w-full accent-blood-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>1 (Solo)</span>
                <span>2 (Pair)</span>
                <span>4 (Subagent Fleet)</span>
                <span>10 (Swarm)</span>
              </div>
            </div>

            {/* Sprint Duration */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold uppercase tracking-wider text-steel-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blood-400" />
                  Sprint Duration:
                </label>
                <span className="font-mono text-blood-300 font-bold px-2 py-0.5 rounded bg-surface border border-steel-700">
                  {sprintDuration} Hours
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 4, 8].map((h) => (
                  <button
                    key={h}
                    onClick={() => handleDurationChange(h)}
                    className={`py-1.5 text-xs font-semibold rounded border transition-colors ${
                      sprintDuration === h
                        ? 'border-blood-500 bg-blood-950/60 text-blood-200'
                        : 'border-steel-700 bg-surface/60 text-steel-400 hover:text-text hover:bg-surface'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Turn Cadence */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                Turn Cadence & Pace:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['rapid', 'standard', 'deep'] as TurnCadence[]).map((c) => {
                  const def = CADENCE_DEFINITIONS[c];
                  const isSelected = cadence === c;
                  return (
                    <button
                      key={c}
                      onClick={() => handleCadenceChange(c)}
                      className={`p-2.5 text-left rounded border transition-all ${
                        isSelected
                          ? 'border-blood-500/80 bg-blood-950/40 text-blood-200 shadow-[0_0_10px_hsl(0_70%_40%_/0.2)]'
                          : 'border-steel-800 bg-surface/40 text-text-muted hover:border-steel-700 hover:text-text'
                      }`}
                    >
                      <div className="text-xs font-bold font-display uppercase tracking-wide">
                        {c === 'rapid' ? '⚡ Rapid (30s)' : c === 'standard' ? '⏱ Standard (2m)' : '🧠 Deep (5m)'}
                      </div>
                      <div className="text-[10px] text-steel-400 mt-1">
                        {def.turnsPerHourPerAgent} turns/hr per agent
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mid-Month Quota Burn Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold uppercase tracking-wider text-steel-300">
                  Prior Monthly Quota Consumed:
                </label>
                <span className="font-mono text-steel-200 font-bold px-2 py-0.5 rounded bg-surface border border-steel-700">
                  {priorUsage}% Consumed
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={10}
                value={priorUsage}
                onChange={(e) => handlePriorChange(Number(e.target.value))}
                className="w-full accent-blood-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>0% (Fresh Cycle)</span>
                <span>20% (Early Month)</span>
                <span>50% (Mid-Month)</span>
                <span>80% (Late Cycle)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sprint Profile Impact KPIs */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
              Total Turns Attempted
            </span>
            <div className="text-3xl font-display font-bold text-text mt-1">
              {totalTurnsAttempted.toLocaleString()}
            </div>
            <span className="text-xs text-text-muted mt-1">
              across {concurrency} parallel agents
            </span>
          </div>

          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
              Estimated Sprint Compute
            </span>
            <div className="text-3xl font-display font-bold text-blood-400 mt-1">
              ~{estimatedTokensM}M Tokens
            </div>
            <span className="text-xs text-text-muted mt-1">
              based on 21K tokens/turn agent payload
            </span>
          </div>

          <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60 col-span-2 lg:col-span-1 flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
              Provider Survival Matrix
            </span>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{smoothCount} Smooth</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{queuedCount} Queued</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                <XCircle className="w-4 h-4" />
                <span>{blockedCount} Blocked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Headroom Bar Chart */}
      <div className="p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blood-500" />
              Throttle Resilience & Headroom Index
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Score (0–100) combining concurrency capacity, rolling 5h window headroom, and queue stability.
            </p>
          </div>
          <span className="text-xs text-steel-400 font-mono hidden sm:inline">
            Top 10 Ranked Plans
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                domain={[0, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 rounded-lg border border-steel-700 bg-surface shadow-xl text-xs space-y-1">
                        <div className="font-bold text-text">{data.name}</div>
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">Resilience:</span>
                          <span className="font-mono font-bold text-blood-400">{data.headroom}/100</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-text-muted">Survival:</span>
                          <span className="font-mono text-steel-200">{data.survival}h / {sprintDuration}h</span>
                        </div>
                        <div className="flex justify-between gap-4 capitalize">
                          <span className="text-text-muted">Status:</span>
                          <span className={`font-semibold ${
                            data.status === 'smooth' ? 'text-emerald-400' : data.status === 'queued' ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {data.status}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="headroom" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.status === 'smooth'
                        ? '#10b981'
                        : entry.status === 'queued'
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Throttle Risk Matrix Table */}
      <div className="rounded-xl border border-steel-700/60 bg-void-950/60 overflow-hidden">
        {/* Table Controls & Filter Tabs */}
        <div className="p-4 border-b border-steel-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text">
              Throttle Risk Matrix
            </h3>
            <span className="text-xs text-text-muted">
              ({filteredResults.length} of {simulationResults.length} profiles)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-steel-700 text-text'
                  : 'text-text-muted hover:bg-surface hover:text-text'
              }`}
            >
              All ({simulationResults.length})
            </button>
            <button
              onClick={() => setStatusFilter('smooth')}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'smooth'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  : 'text-text-muted hover:bg-surface hover:text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Smooth ({smoothCount})
            </button>
            <button
              onClick={() => setStatusFilter('queued')}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'queued'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40'
                  : 'text-text-muted hover:bg-surface hover:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Queued ({queuedCount})
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                statusFilter === 'blocked'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600/40'
                  : 'text-text-muted hover:bg-surface hover:text-rose-400'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Blocked ({blockedCount})
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="divide-y divide-steel-800/80">
          {filteredResults.map((result) => {
            const isSelected = activeDetail?.profile.id === result.profile.id;
            const statusConfig = {
              smooth: {
                label: 'Smooth Sprint',
                badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40',
                icon: ShieldCheck,
                color: 'text-emerald-400',
              },
              queued: {
                label: 'Queue Degraded',
                badge: 'bg-amber-950/60 text-amber-300 border-amber-600/40',
                icon: AlertTriangle,
                color: 'text-amber-400',
              },
              blocked: {
                label: 'Session Blocked',
                badge: 'bg-rose-950/60 text-rose-300 border-rose-600/40',
                icon: XCircle,
                color: 'text-rose-400',
              },
            }[result.status];

            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={result.profile.id}
                onClick={() => setSelectedResultId(result.profile.id)}
                className={`p-4 transition-colors cursor-pointer hover:bg-surface/40 ${
                  isSelected ? 'bg-surface/60 border-l-4 border-l-blood-500' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Provider Info */}
                  <div className="flex items-start gap-3 min-w-[240px]">
                    <div className="mt-0.5">
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text text-sm">
                          {result.profile.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface border border-steel-700 text-steel-300">
                          {result.profile.tierName}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {result.profile.monthlyPrice !== null
                          ? `$${result.profile.monthlyPrice}/mo`
                          : 'Pay-As-You-Go'}{' '}
                        &bull; Max Concurrency: {result.profile.maxConcurrency}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & First Throttle Timestamp */}
                  <div className="flex flex-col items-start md:items-center min-w-[160px]">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide border ${statusConfig.badge}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig.label}
                    </span>
                    <span className="text-[11px] text-text-muted mt-1">
                      {result.timeToFirstThrottle
                        ? `Throttle at: ${result.timeToFirstThrottle}`
                        : `Survived full ${sprintDuration}h`}
                    </span>
                  </div>

                  {/* Turns Throughput Breakdown */}
                  <div className="grid grid-cols-3 gap-3 text-center min-w-[200px]">
                    <div className="p-1.5 rounded bg-void-950/40 border border-steel-800">
                      <div className="text-[10px] uppercase text-text-muted">Fast</div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {result.fastTurnsCompleted}
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-void-950/40 border border-steel-800">
                      <div className="text-[10px] uppercase text-text-muted">Queued</div>
                      <div className="text-xs font-mono font-bold text-amber-400">
                        {result.slowTurnsCompleted}
                      </div>
                    </div>
                    <div className="p-1.5 rounded bg-void-950/40 border border-steel-800">
                      <div className="text-[10px] uppercase text-text-muted">Blocked</div>
                      <div className="text-xs font-mono font-bold text-rose-400">
                        {result.blockedTurns}
                      </div>
                    </div>
                  </div>

                  {/* Headroom Score */}
                  <div className="flex items-center gap-3 min-w-[130px] justify-end">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-text">
                        {result.headroomScore}
                        <span className="text-xs text-text-muted font-normal">/100</span>
                      </div>
                      <div className="text-[10px] text-steel-400">Resilience</div>
                    </div>
                    <a
                      href={result.profile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded border border-steel-700/60 hover:bg-surface text-steel-400 hover:text-text"
                      title="View provider pricing & quota documentation"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Expanded Throttle Reason / Gotchas */}
                {result.throttleReason && (
                  <div className="mt-3 p-2.5 rounded bg-void-950/80 border border-amber-900/40 text-xs flex items-start gap-2 text-amber-200/90">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Operational Constraint: </span>
                      {result.throttleReason}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Provider Deep Dive */}
      {activeDetail && (
        <div className="p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-800 pb-3">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <Zap className="w-4 h-4 text-blood-500" />
              Detailed Sprint Breakdown: {activeDetail.profile.name} ({activeDetail.profile.tierName})
            </h3>
            <span className="text-xs text-text-muted">
              Effective Sprint Throughput: {activeDetail.effectiveThroughputPercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-steel-800 bg-surface/40 space-y-1">
              <span className="text-text-muted uppercase tracking-wider font-semibold text-[10px]">
                Rolling Window Specs
              </span>
              <div className="font-medium text-text">
                {activeDetail.profile.rollingWindowHours
                  ? `${activeDetail.profile.rollingWindowHours}h window (~${activeDetail.profile.rollingWindowTurns} turns max)`
                  : 'No rolling hour limit (monthly reset)'}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-steel-800 bg-surface/40 space-y-1">
              <span className="text-text-muted uppercase tracking-wider font-semibold text-[10px]">
                Monthly Fast Quota
              </span>
              <div className="font-medium text-text">
                {activeDetail.profile.monthlyFastRequests
                  ? `${activeDetail.profile.monthlyFastRequests.toLocaleString()} fast requests/mo`
                  : 'Uncapped or PAYG on-demand'}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-steel-800 bg-surface/40 space-y-1">
              <span className="text-text-muted uppercase tracking-wider font-semibold text-[10px]">
                Exhaustion Behavior
              </span>
              <div className="font-medium capitalize text-text">
                {activeDetail.profile.exhaustionBehavior.replace('-', ' ')}
                {activeDetail.profile.slowQueueDelaySec > 0 && ` (+${activeDetail.profile.slowQueueDelaySec}s latency)`}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-steel-800/80 bg-surface/20 text-xs text-text-muted flex items-start gap-2">
            <Info className="w-4 h-4 text-blood-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-text">Evidence & Policy: </span>
              {activeDetail.profile.evidenceQuote}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
