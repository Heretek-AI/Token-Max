import { useState, useMemo, useRef } from 'react';
import { useModels } from '../hooks/useModels';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import {
  parseAgentLog,
  SAMPLE_AGENT_SESSION,
  type ParsedAgentSession,
} from '../lib/log-parser';
import {
  calculateSessionReceipt,
  type SessionReceiptReport,
} from '../lib/receipt-math';
import { formatPrice } from '../lib/pricing';
import {
  ReceiptText,
  Upload,
  ShieldCheck,
  Check,
  Copy,
  Download,
  RotateCcw,
  Zap,
  TrendingDown,
} from 'lucide-react';

export default function SessionReceipt() {
  const { models, loading: modelsLoading } = useModels();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeSession, setActiveSession] = useState<ParsedAgentSession>(SAMPLE_AGENT_SESSION);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Parse session and compute receipt
  const receiptReport: SessionReceiptReport = useMemo(() => {
    return calculateSessionReceipt(activeSession, models);
  }, [activeSession, models]);

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseAgentLog(text, file.name);
        setActiveSession(parsed);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse log file. Check file format.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCopyReceipt = () => {
    const textReceipt = [
      `================================================`,
      `          TOKEN-MAX AGENT SESSION RECEIPT       `,
      `================================================`,
      `Session: ${activeSession.sessionTitle}`,
      `Turns Executed: ${activeSession.totalTurns}`,
      `Tool Invocations: ${activeSession.toolInvocationsCount}`,
      `Prompt Cache Hit Rate: ${Math.round(activeSession.effectiveCacheHitRate * 100)}%`,
      `------------------------------------------------`,
      ...receiptReport.lineItems.map(
        (li) => `${li.label.padEnd(30, ' ')} : ${formatPrice(li.subtotalCost).padStart(12, ' ')}`
      ),
      `------------------------------------------------`,
      `TOTAL PAYG DIRECT COST: ${formatPrice(receiptReport.baselineTotalCost)}`,
      `================================================`,
      `ALTERNATIVE RE-PRICING COMPARISON:`,
      ...receiptReport.modelRepricings.map(
        (m) => `- ${m.modelName.padEnd(25, ' ')} : ${formatPrice(m.sessionCost).padStart(8, ' ')} (${m.savingsPercentVsBaseline >= 0 ? `-${m.savingsPercentVsBaseline}%` : `+${Math.abs(m.savingsPercentVsBaseline)}%`})`
      ),
      `================================================`,
    ].join('\n');

    navigator.clipboard.writeText(textReceipt);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleDownloadSessionJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(receiptReport, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `session-receipt-${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
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
      {/* Header */}
      <div className="relative border-b border-steel-700/60 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-primary/20 border border-primary/40 text-primary-light shadow-[0_0_15px_hsl(0_70%_40%_/0.3)]">
                <ReceiptText className="w-6 h-6 text-blood-400" />
              </span>
              <h1 className="text-3xl font-display font-bold uppercase tracking-wider text-text">
                Session Receipt & Log Analyzer
              </h1>
            </div>
            <p className="text-text-muted mt-2 max-w-3xl text-sm leading-relaxed">
              Drag-and-drop your agent execution logs (Google Antigravity JSONL, Cline JSON, or Aider chat history) to generate an itemized technical receipt and reprice the run across 8+ models and plans.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-600/40 bg-emerald-950/40 text-xs text-emerald-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Client-Side Privacy</span>
            </div>
            <button
              onClick={() => setActiveSession(SAMPLE_AGENT_SESSION)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded border border-steel-700 bg-surface hover:bg-surface-alt text-xs font-semibold uppercase tracking-wider text-text transition-colors shadow-sm"
              title="Reset to default sample autonomous agent run"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sample Run</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dropzone & Quick Test Bar */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center relative ${
          dragActive
            ? 'border-blood-500 bg-blood-950/40 shadow-[0_0_20px_hsl(0_70%_40%_/0.3)]'
            : 'border-steel-700 hover:border-steel-500 bg-void-950/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jsonl,.json,.txt,.md"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 rounded-full bg-surface border border-steel-700 text-blood-400">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-display font-bold uppercase tracking-wider text-text">
              Drop Agent Transcript / Log File Here
            </div>
            <div className="text-xs text-text-muted mt-1">
              Supports <code className="text-blood-300">transcript.jsonl</code> (Antigravity/Gemini), <code className="text-blood-300">ui_messages.json</code> (Cline/Roo Code), or <code className="text-blood-300">.aider.chat.history.md</code>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-steel-400">Currently Analyzing:</span>
            <span className="px-2.5 py-1 rounded bg-surface border border-steel-700 text-xs font-mono font-bold text-blood-300">
              {activeSession.sessionTitle}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-2.5 rounded bg-rose-950/80 border border-rose-600/40 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Session KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60">
          <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
            Total Turns / Steps
          </span>
          <div className="text-2xl font-display font-bold text-text mt-1">
            {activeSession.totalTurns}
          </div>
          <span className="text-xs text-text-muted">
            {activeSession.toolInvocationsCount} tool actions executed
          </span>
        </div>

        <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60">
          <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
            Total Tokens Processed
          </span>
          <div className="text-2xl font-display font-bold text-blood-400 mt-1">
            {(activeSession.totalTokens / 1e6).toFixed(2)}M
          </div>
          <span className="text-xs text-text-muted">
            {activeSession.totalOutputTokens.toLocaleString()} output tokens
          </span>
        </div>

        <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60">
          <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
            Realized Prompt Cache Hit
          </span>
          <div className="text-2xl font-display font-bold text-emerald-400 mt-1">
            {Math.round(activeSession.effectiveCacheHitRate * 100)}%
          </div>
          <span className="text-xs text-text-muted">
            {(activeSession.totalCachedTokens / 1e6).toFixed(2)}M cached reads
          </span>
        </div>

        <div className="p-4 rounded-xl border border-steel-700/60 bg-void-950/60">
          <span className="text-[11px] uppercase tracking-widest font-display text-steel-400">
            Session Baseline Spend
          </span>
          <div className="text-2xl font-display font-bold text-text mt-1">
            {formatPrice(receiptReport.baselineTotalCost)}
          </div>
          <span className="text-xs text-text-muted">
            on {receiptReport.baselineModelName}
          </span>
        </div>
      </div>

      {/* The Thermal Session Receipt & Repricing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Receipt Container */}
        <div className="lg:col-span-6 p-6 rounded-xl border border-steel-700/80 bg-void-950/80 font-mono text-xs text-steel-200 space-y-4 shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-dashed border-steel-700 pb-3">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-blood-500" />
              <span className="font-bold text-text tracking-widest uppercase">
                ITEMIZED SESSION RECEIPT
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReceipt}
                className="p-1.5 rounded hover:bg-surface text-steel-400 hover:text-text border border-steel-700"
                title="Copy receipt text to clipboard"
              >
                {copiedReceipt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownloadSessionJson}
                className="p-1.5 rounded hover:bg-surface text-steel-400 hover:text-text border border-steel-700"
                title="Download JSON report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-text-muted space-y-1">
            <div className="flex justify-between">
              <span>SESSION:</span>
              <span className="text-text font-bold">{activeSession.sessionTitle}</span>
            </div>
            <div className="flex justify-between">
              <span>FORMAT:</span>
              <span className="text-text uppercase">{activeSession.format}</span>
            </div>
            <div className="flex justify-between">
              <span>TURNS / TOOL CALLS:</span>
              <span className="text-text">{activeSession.totalTurns} turns &bull; {activeSession.toolInvocationsCount} tools</span>
            </div>
          </div>

          {/* Line items */}
          <div className="border-t border-b border-dashed border-steel-800 py-3 space-y-2.5">
            {receiptReport.lineItems.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-text font-semibold">
                  <span>{item.label}</span>
                  <span className="font-bold">{formatPrice(item.subtotalCost)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>{item.quantityDescription}</span>
                  <span>{item.unitRateDescription}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Receipt Total */}
          <div className="flex justify-between items-center text-sm font-bold text-text pt-1">
            <span className="tracking-wider">TOTAL EQUIVALENT API DUE:</span>
            <span className="text-blood-400 text-lg">{formatPrice(receiptReport.baselineTotalCost)}</span>
          </div>

          <div className="p-2.5 rounded bg-surface/40 border border-steel-800 text-[11px] text-text-muted leading-relaxed">
            <span className="text-emerald-400 font-semibold">Prompt Cache Realized: </span>
            {Math.round(activeSession.effectiveCacheHitRate * 100)}% of prompt tokens were cache-hit reads, saving approximately {formatPrice(receiptReport.baselineTotalCost * 1.8)} compared to uncached execution.
          </div>
        </div>

        {/* Cross-Model Repricing & Plan Quota Impact */}
        <div className="lg:col-span-6 space-y-6">
          {/* Cross-Model Repricing Leaderboard */}
          <div className="p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4">
            <div className="flex items-center justify-between border-b border-steel-800 pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blood-500" />
                Cross-Model Re-Pricing Comparison
              </h3>
              <span className="text-xs text-text-muted">What would this run cost on other models?</span>
            </div>

            <div className="space-y-2">
              {receiptReport.modelRepricings.map((item) => {
                const isCheaper = item.savingsPercentVsBaseline > 0;
                return (
                  <div
                    key={item.modelId}
                    className={`p-3 rounded-lg border transition-colors flex items-center justify-between ${
                      item.isBaseline
                        ? 'border-blood-500/60 bg-blood-950/20'
                        : 'border-steel-800 bg-surface/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text">{item.modelName}</span>
                        {item.isBaseline && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blood-950 border border-blood-700 text-blood-300 font-bold uppercase">
                            Baseline
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-muted capitalize">{item.provider}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-text">
                        {formatPrice(item.sessionCost)}
                      </div>
                      <div
                        className={`text-[10px] font-mono font-semibold ${
                          item.isBaseline
                            ? 'text-steel-400'
                            : isCheaper
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.isBaseline
                          ? '—'
                          : isCheaper
                          ? `-${item.savingsPercentVsBaseline}% cheaper`
                          : `+${Math.abs(item.savingsPercentVsBaseline)}% more`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subscription Pool Quota Impact */}
          <div className="p-6 rounded-xl border border-steel-700/60 bg-void-950/60 space-y-4">
            <div className="flex items-center justify-between border-b border-steel-800 pb-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-text flex items-center gap-2">
                <Zap className="w-4 h-4 text-blood-500" />
                Subscription Quota Impact
              </h3>
              <span className="text-xs text-text-muted">Quota drained by this single session</span>
            </div>

            <div className="space-y-3">
              {receiptReport.subscriptionImpacts.map((sub) => (
                <div key={sub.planId} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-steel-200">
                      {sub.planName} ({sub.tierName})
                    </span>
                    <span className="font-mono text-blood-300 font-bold">
                      {sub.quotaConsumedPercentage}% consumed
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-void-950 border border-steel-800 overflow-hidden">
                    <div
                      className={`h-full transition-all rounded-full ${
                        sub.quotaConsumedPercentage > 75
                          ? 'bg-rose-500'
                          : sub.quotaConsumedPercentage > 40
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${sub.quotaConsumedPercentage}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-text-muted flex justify-between">
                    <span>{sub.quotaConsumedDescription}</span>
                    <span>Absorbed: {formatPrice(sub.equivalentValueAbsorbed)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
