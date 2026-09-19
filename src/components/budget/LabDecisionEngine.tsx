import { useState, useMemo } from 'react';
import type { NormalizedModel, CodingPlan, FrontierLab, DisplayUnit, CacheRate } from '../../lib/types';
import { computeApplesToApples, formatMillionTokens, getProviderColor } from '../../lib/pricing';
import { 
  Sparkles, 
  Layers, 
  ExternalLink, 
  Sliders, 
  TrendingUp, 
  Zap, 
  Bot, 
  SlidersHorizontal,
  Info,
  Database
} from 'lucide-react';

interface LabDecisionEngineProps {
  models: NormalizedModel[];
  plans: CodingPlan[];
  budget: number;
  onBudgetChange: (budget: number) => void;
}

export function LabDecisionEngine({
  models,
  plans,
  budget,
  onBudgetChange
}: LabDecisionEngineProps) {
  const [selectedLab, setSelectedLab] = useState<FrontierLab>('all');
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>('tokens');
  const [cacheRate, setCacheRate] = useState<CacheRate>(0.75);
  const [showRequestInfo, setShowRequestInfo] = useState<boolean>(false);
  const [minCodingScore, setMinCodingScore] = useState<number>(0);
  const [showThresholdSlider, setShowThresholdSlider] = useState<boolean>(false);

  const budgetPresets = [10, 20, 50, 100, 200];

  const labs: { id: FrontierLab; name: string; subtitle: string; color: string }[] = [
    { id: 'all', name: 'All Frontier', subtitle: 'Global Top Models', color: '#6366f1' },
    { id: 'anthropic', name: 'Anthropic', subtitle: 'Claude 3.7 / Opus / Sonnet', color: '#d4a27f' },
    { id: 'openai', name: 'OpenAI', subtitle: 'GPT-6 / Codex / GPT-5', color: '#10a37f' },
    { id: 'google', name: 'Google', subtitle: 'Gemini 3.7 / 3.8 / Flash', color: '#4285f4' },
    { id: 'deepseek', name: 'DeepSeek', subtitle: 'DeepSeek V4 / Flash / R1', color: '#536dfe' },
    { id: 'glm', name: 'Z.ai (GLM)', subtitle: 'GLM-5.3 Flash / DevPack', color: '#0256FF' },
  ];

  // Compute the apples-to-apples comparison
  const { options, bestApi, bestSubscription, bestWorkhorse, arbitrageCallout } = useMemo(() => {
    return computeApplesToApples(models, plans, selectedLab, budget, minCodingScore, cacheRate);
  }, [models, plans, selectedLab, budget, minCodingScore, cacheRate]);

  const formatYield = (tokensM: number, requests: number) => {
    if (displayUnit === 'requests') {
      return `${requests.toLocaleString()} reqs`;
    }
    return `${formatMillionTokens(tokensM)} tokens`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Controls: Lab Tabs */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Frontier Intelligence Decision Engine</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Compare Direct APIs vs. Coding Subscriptions for the world&apos;s leading AI labs.
            </p>
          </div>

          {/* Right Controls: Cache Toggle + Unit Switcher + Info Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Prompt Cache Toggle */}
            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 flex items-center gap-1">
                <Database className="w-3 h-3 text-primary" /> Cache:
              </span>
              <button
                onClick={() => setCacheRate(0)}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  cacheRate === 0
                    ? 'bg-surface text-text shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
                title="Cold fresh context on every request (0% prompt cache hit)"
              >
                0% (Fresh)
              </button>
              <button
                onClick={() => setCacheRate(0.75)}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  cacheRate === 0.75
                    ? 'bg-surface text-primary shadow-xs border border-border font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
                title="Standard multi-turn agent session (75% context read from cache)"
              >
                75% (Agent)
              </button>
              <button
                onClick={() => setCacheRate(0.90)}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  cacheRate === 0.90
                    ? 'bg-surface text-success shadow-xs border border-border font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
                title="Long multi-file coding session (90% context read from cache)"
              >
                90% (Deep)
              </button>
            </div>

            {/* Unit Switcher: Tokens vs Requests */}
            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-border text-xs">
              <button
                onClick={() => setDisplayUnit('tokens')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  displayUnit === 'tokens'
                    ? 'bg-surface text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Tokens (M)
              </button>
              <button
                onClick={() => setDisplayUnit('requests')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  displayUnit === 'requests'
                    ? 'bg-surface text-primary shadow-xs border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
                title="Standard agent request: 20K input tokens + 1K output tokens"
              >
                Agent Requests
              </button>
            </div>

            {/* Standard Agent Info Trigger */}
            <button
              onClick={() => setShowRequestInfo(!showRequestInfo)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                showRequestInfo ? 'bg-primary text-white border-primary' : 'bg-surface-alt text-text-muted border-border hover:text-text'
              }`}
              title="What is the Token-Max Standard Agent Request?"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informational Banner about the Standard Agent Request Model */}
        {showRequestInfo && (
          <div className="mb-4 p-3.5 bg-primary/5 rounded-xl border border-primary/20 text-xs text-text animate-in fade-in duration-200">
            <div className="font-bold text-primary flex items-center gap-1.5 mb-1">
              <Info className="w-4 h-4" />
              <span>Token-Max Standard Coding Agent Request Anatomy:</span>
            </div>
            <p className="text-text-muted leading-relaxed">
              Real-world agentic coding (Cursor, Claude Code, Cline, Copilot Edits) consumes large codebase context for concise diffs:
              <strong> 20,000 input context tokens</strong> (files, AST, conversation history, linters) + <strong>1,000 output tokens</strong> (code patch).
              With prompt caching enabled (<strong>{Math.round(cacheRate * 100)}% active</strong>), up to {Math.round(20000 * cacheRate).toLocaleString()} input tokens per turn are billed at provider cache discount rates (up to <strong>90% off</strong> on Anthropic, DeepSeek, and Z.ai).
            </p>
          </div>
        )}

        {/* Lab Selection Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {labs.map(lab => {
            const isSelected = selectedLab === lab.id;
            return (
              <button
                key={lab.id}
                onClick={() => setSelectedLab(lab.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs relative ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-surface-alt/50 hover:bg-surface-alt hover:border-text-muted/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-bold text-sm"
                    style={{ color: isSelected ? undefined : lab.color }}
                  >
                    {lab.name}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
                <span className="text-[10px] text-text-muted truncate leading-tight">
                  {lab.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Budget & Quality Threshold Controls */}
        <div className="mt-5 pt-4 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Budget Presets & Custom Slider */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-1">
              Monthly Budget:
            </span>
            {budgetPresets.map(preset => (
              <button
                key={preset}
                onClick={() => onBudgetChange(preset)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                  budget === preset
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-surface-alt text-text-muted border-border hover:bg-surface hover:text-text'
                }`}
              >
                ${preset}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-1">
              <span className="text-xs text-text-muted font-mono">$</span>
              <input
                type="number"
                min="1"
                max="1000"
                value={budget}
                onChange={e => onBudgetChange(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 px-2 py-0.5 text-xs font-bold text-text bg-surface-alt rounded-md border border-border focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Quality Baseline Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-1">
              Quality Baseline:
            </span>
            <button
              onClick={() => { setMinCodingScore(0); setShowThresholdSlider(false); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                minCodingScore === 0
                  ? 'bg-surface text-text border-border shadow-xs'
                  : 'text-text-muted border-border/50 hover:bg-surface-alt'
              }`}
            >
              All Tiers
            </button>
            <button
              onClick={() => { setMinCodingScore(68); setShowThresholdSlider(false); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                minCodingScore === 68
                  ? 'bg-primary/20 text-primary border-primary font-bold'
                  : 'text-text-muted border-border/50 hover:bg-surface-alt'
              }`}
            >
              Workhorse (≥68)
            </button>
            <button
              onClick={() => { setMinCodingScore(75); setShowThresholdSlider(false); }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                minCodingScore === 75
                  ? 'bg-primary/20 text-primary border-primary font-bold'
                  : 'text-text-muted border-border/50 hover:bg-surface-alt'
              }`}
            >
              Top Frontier (≥75)
            </button>
            <button
              onClick={() => setShowThresholdSlider(!showThresholdSlider)}
              className={`p-1.5 text-xs rounded-lg border transition-all ${
                showThresholdSlider ? 'bg-primary text-white border-primary' : 'text-text-muted border-border hover:bg-surface-alt'
              }`}
              title="Custom Coding Score Threshold"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Custom Threshold Slider */}
        {showThresholdSlider && (
          <div className="mt-3 pt-3 border-t border-border flex items-center gap-4 animate-in fade-in duration-200">
            <span className="text-xs text-text-muted font-medium whitespace-nowrap">
              Minimum Coding Score: <strong className="text-primary">{minCodingScore}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minCodingScore}
              onChange={e => setMinCodingScore(Number(e.target.value))}
              className="w-full max-w-xs accent-primary cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 2. Arbitrage Verdict Callout Banner */}
      {arbitrageCallout && (
        <div className={`p-4 rounded-xl border flex items-start sm:items-center justify-between gap-4 ${
          arbitrageCallout.winnerType === 'subscription'
            ? 'bg-success/10 border-success/30 text-success'
            : arbitrageCallout.winnerType === 'api'
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-surface-alt border-border text-text'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${
              arbitrageCallout.winnerType === 'subscription' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-text">
                {arbitrageCallout.headline}
              </div>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                {arbitrageCallout.description}
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-surface px-3 py-1.5 rounded-lg border border-border text-center">
            <span className="text-lg font-black text-text">
              {arbitrageCallout.multiplier}x
            </span>
            <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
              Multiplier
            </div>
          </div>
        </div>
      )}

      {/* 3. Three Head-to-Head Standout Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Best Direct API */}
        <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Direct Pay-Per-Token API
              </span>
              <span className="text-[10px] bg-surface-alt px-2 py-0.5 rounded-md font-mono text-text-muted border border-border">
                BYOK
              </span>
            </div>
            {bestApi ? (
              <>
                <h3 className="font-extrabold text-base text-text truncate" title={bestApi.name}>
                  {bestApi.name}
                </h3>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                  <span className="font-semibold uppercase" style={{ color: getProviderColor(bestApi.provider) }}>
                    {bestApi.provider}
                  </span>
                  {bestApi.codingIndex && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-semibold">Coding: {bestApi.codingIndex.toFixed(1)}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-text-muted mt-2">No matching API model above threshold.</p>
            )}
          </div>

          {bestApi && (
            <div className="mt-4 pt-3 border-t border-border flex items-baseline justify-between">
              <div>
                <div className="text-xl font-black text-primary">
                  {formatYield(bestApi.monthlyTokens, bestApi.monthlyRequests)}
                </div>
                <div className="text-[10px] text-text-muted">
                  Yield at ${budget}/month
                </div>
              </div>
              <span className="text-xs font-mono text-text-muted">
                ~${(budget / bestApi.monthlyTokens).toFixed(2)}/M
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Best Coding Subscription */}
        <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" /> Best Coding Subscription
              </span>
              <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-md font-semibold border border-success/20">
                IDE Plan
              </span>
            </div>
            {bestSubscription ? (
              <>
                <h3 className="font-extrabold text-base text-text truncate" title={bestSubscription.name}>
                  {bestSubscription.name}
                </h3>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                  <span>${bestSubscription.monthlyCost}/mo base</span>
                  <span>•</span>
                  <span className="truncate max-w-[150px]">{bestSubscription.notes}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-text-muted mt-2">No coding subscriptions found offering this lab near ${budget}/mo.</p>
            )}
          </div>

          {bestSubscription && (
            <div className="mt-4 pt-3 border-t border-border flex items-baseline justify-between">
              <div>
                <div className="text-xl font-black text-success">
                  {formatYield(bestSubscription.monthlyTokens, bestSubscription.monthlyRequests)}
                </div>
                <div className="text-[10px] text-text-muted">
                  Effective compute at ${budget}/mo
                </div>
              </div>
              {bestSubscription.url && (
                <a
                  href={bestSubscription.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-0.5"
                >
                  Visit <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Card 3: Best Value Workhorse */}
        <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-warning flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> High-Efficiency Workhorse
              </span>
              <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-md font-semibold border border-warning/20">
                Pareto Value
              </span>
            </div>
            {bestWorkhorse ? (
              <>
                <h3 className="font-extrabold text-base text-text truncate" title={bestWorkhorse.name}>
                  {bestWorkhorse.name}
                </h3>
                <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
                  <span className="font-semibold uppercase" style={{ color: getProviderColor(bestWorkhorse.provider) }}>
                    {bestWorkhorse.provider}
                  </span>
                  <span>•</span>
                  <span className="text-primary font-semibold">Coding: {bestWorkhorse.codingIndex?.toFixed(1)}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-text-muted mt-2">No high-efficiency model found matching criteria.</p>
            )}
          </div>

          {bestWorkhorse && (
            <div className="mt-4 pt-3 border-t border-border flex items-baseline justify-between">
              <div>
                <div className="text-xl font-black text-warning">
                  {formatYield(bestWorkhorse.monthlyTokens, bestWorkhorse.monthlyRequests)}
                </div>
                <div className="text-[10px] text-text-muted">
                  Maximum yield for ${budget}/mo
                </div>
              </div>
              <span className="text-xs font-mono text-text-muted">
                ~${(budget / bestWorkhorse.monthlyTokens).toFixed(2)}/M
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Unified Apples-to-Apples Ranked Leaderboard */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-extrabold text-base text-text flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Ranked Compute Yields at ${budget}/month</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Unified ranking across Direct APIs and Subscriptions. Higher yield gives you more coding throughput per dollar.
            </p>
          </div>
          <div className="text-xs text-text-muted font-medium bg-surface-alt px-2.5 py-1 rounded-lg border border-border shrink-0">
            {options.length} options evaluated
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-alt/75 border-b border-border text-text-muted text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">Rank</th>
                <th className="px-4 py-3 font-semibold">Service / Model</th>
                <th className="px-3 py-3 font-semibold">Platform Type</th>
                <th className="px-3 py-3 font-semibold text-right">Base Cost</th>
                <th className="px-4 py-3 font-semibold text-right">
                  {displayUnit === 'requests' ? 'Est. Monthly Requests' : 'Est. Monthly Tokens'}
                </th>
                <th className="px-3 py-3 font-semibold text-right">Coding Index</th>
                <th className="px-4 py-3 font-semibold">Summary & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {options.slice(0, 25).map((opt, index) => {
                const isWinner = index === 0;
                return (
                  <tr
                    key={opt.id}
                    className={`hover:bg-surface-alt/50 transition-colors ${
                      isWinner ? 'bg-primary/5 font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (
                        <span className="text-xs text-text-muted font-mono">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-text truncate max-w-[220px]" title={opt.name}>
                        {opt.name}
                      </div>
                      <div className="text-[11px] font-semibold text-text-muted capitalize">
                        {opt.provider}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {opt.type === 'subscription' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-success/10 text-success border border-success/20">
                          Subscription
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                          Direct API
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs text-text">
                      ${opt.monthlyCost}/mo
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold text-sm text-primary">
                        {formatYield(opt.monthlyTokens, opt.monthlyRequests)}
                      </div>
                      <div className="text-[10px] text-text-muted font-mono">
                        {displayUnit === 'requests'
                          ? `~${formatMillionTokens(opt.monthlyTokens)} tokens`
                          : `~${opt.monthlyRequests.toLocaleString()} reqs`}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {opt.codingIndex !== null ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          opt.codingIndex >= 75
                            ? 'bg-primary/15 text-primary font-bold'
                            : opt.codingIndex >= 68
                            ? 'bg-surface-alt text-text'
                            : 'text-text-muted'
                        }`}>
                          {opt.codingIndex.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs" title="Subscription offers model suite">
                          Multi-Model
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate max-w-[240px]" title={opt.notes}>
                          {opt.notes}
                        </span>
                        {opt.url && (
                          <a
                            href={opt.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-text-muted hover:text-primary transition-colors shrink-0"
                            title="Visit Official Site"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
