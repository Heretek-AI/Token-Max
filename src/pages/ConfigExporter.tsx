import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useModels } from '../hooks/useModels';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  generateAllConfigs,
  type AgentStackConfig,
  type GatewayProvider,
  type ExportedConfigFile,
} from '../lib/exporters';
import {
  calculateAgentRequestCost,
  formatPrice,
} from '../lib/pricing';
import { DEFAULT_CACHE_RATE } from '../lib/estimate-constants';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Sparkles,
  Terminal,
  Layers,
  ShieldCheck,
  Share2,
  Coins,
} from 'lucide-react';

interface Preset {
  name: string;
  description: string;
  architectModelId: string;
  editorModelId: string;
  autocompleteModelId?: string;
  provider: GatewayProvider;
}

const PRESETS: Preset[] = [
  {
    name: 'Best Value Workhorse Stack',
    description: 'Claude Sonnet 5 for architecture + DeepSeek V4.1 Flash for rapid edits. Unbeatable intelligence-per-dollar.',
    architectModelId: 'anthropic/claude-sonnet-5',
    editorModelId: 'deepseek/deepseek-v4.1-flash',
    autocompleteModelId: 'deepseek/deepseek-v4.1-flash',
    provider: 'openrouter',
  },
  {
    name: 'Maximum Economy Open Stack',
    description: 'DeepSeek V4.1 Flash for architecture + GLM 5.3 Flash for edits. Under $10/month for heavy agentic coding.',
    architectModelId: 'deepseek/deepseek-v4.1-flash',
    editorModelId: 'z-ai/glm-5.3-flash',
    autocompleteModelId: 'z-ai/glm-5.3-flash',
    provider: 'openrouter',
  },
  {
    name: 'Frontier Reasoning Powerhouse',
    description: 'Claude Opus 5 for high-complexity architecture + Claude Sonnet 5 for edits. Maximum coding benchmark index.',
    architectModelId: 'anthropic/claude-opus-5',
    editorModelId: 'anthropic/claude-sonnet-5',
    autocompleteModelId: 'deepseek/deepseek-v4.1-flash',
    provider: 'openrouter',
  },
];

export default function ConfigExporter() {
  const { models, loading: modelsLoading } = useModels();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state initialization
  const initialArchitect = searchParams.get('architect') || 'anthropic/claude-sonnet-5';
  const initialEditor = searchParams.get('editor') || 'deepseek/deepseek-v4.1-flash';
  const initialProvider = (searchParams.get('provider') as GatewayProvider) || 'openrouter';

  const [architectId, setArchitectId] = useState<string>(initialArchitect);
  const [editorId, setEditorId] = useState<string>(initialEditor);
  const [autocompleteId, setAutocompleteId] = useState<string>('deepseek/deepseek-v4.1-flash');
  const [provider, setProvider] = useState<GatewayProvider>(initialProvider);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('http://localhost:11434/v1');
  const [enableCaching, setEnableCaching] = useState<boolean>(true);
  const [activeTabId, setActiveTabId] = useState<string>('aider');

  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Model lookup map
  const modelMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const m of models) {
      map.set(m.id, m);
    }
    return map;
  }, [models]);

  // Models sorted by Coding Index for selector dropdowns
  const codingModels = useMemo(() => {
    return [...models]
      .filter((m) => !m.isBatch && m.blendedCost > 0)
      .sort((a, b) => (b.benchmarks.codingIndex || 0) - (a.benchmarks.codingIndex || 0));
  }, [models]);

  const architectModel = modelMap.get(architectId);
  const editorModel = modelMap.get(editorId);
  const autocompleteModel = modelMap.get(autocompleteId);

  // Sync to URL
  const updateUrl = (newArch: string, newEd: string, newProv: GatewayProvider) => {
    const params = new URLSearchParams();
    params.set('architect', newArch);
    params.set('editor', newEd);
    params.set('provider', newProv);
    setSearchParams(params, { replace: true });
  };

  const handleArchitectChange = (id: string) => {
    setArchitectId(id);
    updateUrl(id, editorId, provider);
  };

  const handleEditorChange = (id: string) => {
    setEditorId(id);
    updateUrl(architectId, id, provider);
  };

  const handleProviderChange = (p: GatewayProvider) => {
    setProvider(p);
    updateUrl(architectId, editorId, p);
  };

  const applyPreset = (preset: Preset) => {
    setArchitectId(preset.architectModelId);
    setEditorId(preset.editorModelId);
    if (preset.autocompleteModelId) setAutocompleteId(preset.autocompleteModelId);
    setProvider(preset.provider);
    updateUrl(preset.architectModelId, preset.editorModelId, preset.provider);
  };

  // Generate all config files
  const stackConfig: AgentStackConfig = useMemo(() => {
    return {
      architectModelId: architectId,
      architectModelName: architectModel?.name || architectId,
      editorModelId: editorId,
      editorModelName: editorModel?.name || editorId,
      autocompleteModelId: autocompleteId,
      autocompleteModelName: autocompleteModel?.name || autocompleteId,
      provider,
      customBaseUrl: provider === 'custom' ? customBaseUrl : undefined,
      enablePromptCaching: enableCaching,
    };
  }, [
    architectId,
    architectModel,
    editorId,
    editorModel,
    autocompleteId,
    autocompleteModel,
    provider,
    customBaseUrl,
    enableCaching,
  ]);

  const configFiles: ExportedConfigFile[] = useMemo(() => {
    return generateAllConfigs(stackConfig);
  }, [stackConfig]);

  const activeFile = useMemo(() => {
    return configFiles.find((f) => f.id === activeTabId) || configFiles[0];
  }, [configFiles, activeTabId]);

  // Estimated monthly cost calculation for this stack
  // Workload: 200 architect turns (21K tokens) + 800 editor turns (21K tokens) = 1,000 turns/mo
  const monthlyCostEstimate = useMemo(() => {
    if (!architectModel || !editorModel) return null;
    const archCost = calculateAgentRequestCost(architectModel, DEFAULT_CACHE_RATE).costPerRequest * 200;
    const edCost = calculateAgentRequestCost(editorModel, DEFAULT_CACHE_RATE).costPerRequest * 800;
    return {
      architectMonthly: archCost,
      editorMonthly: edCost,
      total: archCost + edCost,
    };
  }, [architectModel, editorModel]);

  const handleCopyContent = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleCopyCommand = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.runCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFile.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  if (modelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="relative border-b border-steel-700/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/20 border border-primary/40 text-primary-light shadow-[0_0_15px_hsl(0_70%_40%_/0.3)]">
                <FileCode className="w-6 h-6 text-blood-400" />
              </span>
              <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-text">
                BYOK Agent Router Config Exporter
              </h1>
            </div>
            <p className="text-text-muted mt-2 max-w-3xl text-sm leading-relaxed">
              Generate ready-to-run configuration files for Aider, Cline, Continue.dev, OpenCode, and Cursor based on Token-Max cost and benchmark analytics.
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
                  <span>Share Stack</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Presets Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider font-display font-bold text-steel-400 flex items-center gap-1 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-blood-500" />
            Stack Presets:
          </span>
          {PRESETS.map((preset) => {
            const isActive =
              architectId === preset.architectModelId &&
              editorId === preset.editorModelId &&
              provider === preset.provider;
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

      {/* Model Stack Configuration & Cost KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Model Stack Form */}
        <div className="lg:col-span-8 p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-6">
          <div className="flex items-center justify-between border-b border-steel-800 pb-3">
            <h2 className="text-sm uppercase tracking-widest font-display font-bold text-steel-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blood-500" />
              Agent Role Assignment
            </h2>
            <span className="text-xs text-text-muted">
              Choose frontier architect + fast editor workhorse
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Architect Model */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 flex items-center justify-between">
                <span>🧠 Lead Architect Model</span>
                {architectModel?.benchmarks.codingIndex && (
                  <span className="text-[10px] text-blood-400 font-mono">
                    Coding Index: {architectModel.benchmarks.codingIndex}
                  </span>
                )}
              </label>
              <select
                value={architectId}
                onChange={(e) => handleArchitectChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-steel-700 bg-surface text-text font-mono focus:border-blood-500 focus:outline-none"
              >
                {codingModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider}) {m.benchmarks.codingIndex ? `[Code: ${m.benchmarks.codingIndex}]` : ''} — ${m.blendedCost.toFixed(2)}/M
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-text-muted">
                Used for high-level repo architecture, multi-file refactoring, and schema planning.
              </p>
            </div>

            {/* Fast Editor Model */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 flex items-center justify-between">
                <span>⚡ Fast Editor / Coder</span>
                {editorModel?.benchmarks.codingIndex && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Coding Index: {editorModel.benchmarks.codingIndex}
                  </span>
                )}
              </label>
              <select
                value={editorId}
                onChange={(e) => handleEditorChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-steel-700 bg-surface text-text font-mono focus:border-blood-500 focus:outline-none"
              >
                {codingModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider}) {m.benchmarks.codingIndex ? `[Code: ${m.benchmarks.codingIndex}]` : ''} — ${m.blendedCost.toFixed(2)}/M
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-text-muted">
                Used for rapid diff generation, unit tests, bug fixing, and test execution loops.
              </p>
            </div>

            {/* Gateway Provider */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                API Gateway / Router:
              </label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as GatewayProvider)}
                className="w-full px-3 py-2 text-xs rounded border border-steel-700 bg-surface text-text font-mono focus:border-blood-500 focus:outline-none"
              >
                <option value="openrouter">OpenRouter (Unified Multi-Provider Endpoint)</option>
                <option value="anthropic">Anthropic Direct API</option>
                <option value="deepseek">DeepSeek Direct API</option>
                <option value="openai">OpenAI Direct API</option>
                <option value="custom">Custom / Self-Hosted Proxy (LiteLLM, Ollama, vLLM)</option>
              </select>
            </div>

            {/* Autocomplete Model */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                Tab Autocomplete Model:
              </label>
              <select
                value={autocompleteId}
                onChange={(e) => setAutocompleteId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-steel-700 bg-surface text-text font-mono focus:border-blood-500 focus:outline-none"
              >
                {codingModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Base URL if selected */}
          {provider === 'custom' && (
            <div className="p-3 rounded-lg border border-steel-700 bg-surface/40 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-steel-300 block">
                Custom Endpoint Base URL:
              </label>
              <input
                type="text"
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full px-3 py-1.5 text-xs rounded border border-steel-700 bg-surface text-text font-mono focus:border-blood-500 focus:outline-none"
              />
            </div>
          )}

          {/* Options: Prompt caching */}
          <div className="flex items-center gap-2 pt-2 border-t border-steel-800 text-xs">
            <input
              type="checkbox"
              id="prompt-cache-toggle"
              checked={enableCaching}
              onChange={(e) => setEnableCaching(e.target.checked)}
              className="rounded accent-blood-500 cursor-pointer"
            />
            <label htmlFor="prompt-cache-toggle" className="text-steel-300 cursor-pointer select-none">
              Enable Prompt Caching directives (<code className="text-blood-400">cache-prompts: true</code>) to reduce input token costs by up to 75–90%
            </label>
          </div>
        </div>

        {/* Stack Economics & Cost KPI */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest font-display text-steel-400 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-blood-500" />
                  Estimated Monthly Spend
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-steel-700 text-emerald-400 font-semibold">
                  Direct API PAYG
                </span>
              </div>

              <div className="text-3xl font-display font-bold text-blood-400 mt-2">
                {monthlyCostEstimate ? formatPrice(monthlyCostEstimate.total) : '—'}
                <span className="text-xs text-text-muted font-normal"> / month</span>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Standard developer workflow: 200 architect turns + 800 editor turns (21M tokens at 75% cache hit rate).
              </p>
            </div>

            <div className="space-y-2 border-t border-steel-800 pt-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-steel-400">Architect ({architectModel?.name || 'Model'}):</span>
                <span className="font-mono text-text">
                  {monthlyCostEstimate ? formatPrice(monthlyCostEstimate.architectMonthly) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-steel-400">Fast Editor ({editorModel?.name || 'Model'}):</span>
                <span className="font-mono text-text">
                  {monthlyCostEstimate ? formatPrice(monthlyCostEstimate.editorMonthly) : '—'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-steel-800 bg-surface/40 text-[11px] text-steel-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Subscription Breakeven Comparison</span>
              </div>
              <p className="text-text-muted">
                {monthlyCostEstimate && monthlyCostEstimate.total < 20
                  ? `Cheaper than a flat $20/mo Cursor or Claude Code subscription by $${(20 - monthlyCostEstimate.total).toFixed(2)}/mo!`
                  : `Provides unconstrained API burst concurrency with zero rolling 5-hour throttles.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Config Files Viewer */}
      <div className="rounded-xl border border-steel-700/60 bg-void-950/60 overflow-hidden shadow-2xl">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center justify-between border-b border-steel-800 bg-surface/60 px-4 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {configFiles.map((file) => {
              const isActive = activeTabId === file.id;
              return (
                <button
                  key={file.id}
                  onClick={() => setActiveTabId(file.id)}
                  className={`px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded-t-lg border-t border-x transition-all flex items-center gap-2 ${
                    isActive
                      ? 'border-blood-500 bg-void-950 text-blood-300 shadow-[0_-2px_8px_hsl(0_70%_40%_/0.2)]'
                      : 'border-transparent text-text-muted hover:text-text hover:bg-surface'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{file.filename}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-void-950 border border-steel-800 text-steel-400 font-normal">
                    {file.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons: Copy & Download */}
          <div className="flex items-center gap-2 pb-2 sm:pb-0">
            <button
              onClick={handleCopyContent}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text transition-colors shadow-sm"
              title="Copy file contents to clipboard"
            >
              {copiedFile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blood-400" />
                  <span>Copy File</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-blood-500/80 bg-blood-950/60 hover:bg-blood-900/60 text-xs font-semibold uppercase tracking-wider text-blood-200 transition-colors shadow-sm"
              title={`Download ${activeFile.filename}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {activeFile.filename}</span>
            </button>
          </div>
        </div>

        {/* File Instructions Bar */}
        <div className="px-6 py-3 bg-surface/30 border-b border-steel-800/80 text-xs text-text-muted flex items-center justify-between">
          <span>{activeFile.instructions}</span>
          <span className="text-[10px] font-mono text-steel-400 uppercase">
            Format: {activeFile.language}
          </span>
        </div>

        {/* Code Content Container */}
        <div className="p-6 bg-void-950 font-mono text-xs text-steel-200 overflow-x-auto leading-relaxed selection:bg-blood-500/30 selection:text-white">
          <pre>{activeFile.content}</pre>
        </div>

        {/* Quickstart Command Runner */}
        <div className="p-6 border-t border-steel-800 bg-surface/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-display font-bold text-steel-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blood-500" />
              Quickstart Launch Commands:
            </span>
            <button
              onClick={handleCopyCommand}
              className="inline-flex items-center gap-1 text-[11px] text-steel-400 hover:text-text"
            >
              {copiedCmd ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Shell Snippet</span>
                </>
              )}
            </button>
          </div>
          <div className="p-3 rounded-lg border border-steel-800 bg-void-950 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre">
            {activeFile.runCommand}
          </div>
        </div>
      </div>
    </div>
  );
}
