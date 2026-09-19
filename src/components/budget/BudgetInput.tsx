import type { BudgetSortMode } from '../../lib/types';
import { Award, BrainCircuit, Zap } from 'lucide-react';

interface BudgetInputProps {
  budget: number;
  onChange: (val: number) => void;
  sortMode: BudgetSortMode;
  onSortModeChange: (mode: BudgetSortMode) => void;
}

export function BudgetInput({ budget, onChange, sortMode, onSortModeChange }: BudgetInputProps) {
  const presets = [5, 10, 20, 50, 100, 200];

  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text mb-1">
            Monthly Budget Calculator
          </h2>
          <p className="text-sm text-text-muted">
            Find the highest performance and most cost-efficient models for your spend.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">Budget:</span>
          <span className="text-3xl font-extrabold text-primary">${budget}</span>
          <span className="text-xs text-text-muted">/mo</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Slider & Quick Presets */}
        <div>
          <input
            type="range"
            min="1"
            max="500"
            value={budget}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-surface-alt rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-xs font-medium text-text-muted mr-1">Presets:</span>
              {presets.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange(val)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                    budget === val 
                      ? 'bg-primary text-white border-primary shadow-sm' 
                      : 'bg-surface-alt text-text-muted border-border hover:border-primary/50'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-text-muted whitespace-nowrap">
                Custom: $
              </label>
              <input
                type="number"
                min="1"
                value={budget}
                onChange={(e) => onChange(Number(e.target.value) || 1)}
                className="w-20 px-2 py-1 bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-text text-sm font-semibold text-right"
              />
            </div>
          </div>
        </div>

        {/* Ranking Strategy Selector */}
        <div className="pt-4 border-t border-border">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Prioritize By:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => onSortModeChange('best-value')}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                sortMode === 'best-value'
                  ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary/50'
                  : 'bg-surface border-border text-text hover:border-primary/40'
              }`}
            >
              <Award className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-sm">Best Value (Intelligence / $)</div>
                <div className="text-xs opacity-80 mt-0.5">Highest verified Coding Index per dollar (DeepSeek Flash, Gemini Flash, Qwen Max).</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSortModeChange('frontier')}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                sortMode === 'frontier'
                  ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary/50'
                  : 'bg-surface border-border text-text hover:border-primary/40'
              }`}
            >
              <BrainCircuit className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-sm">Frontier Quality (Top Coding)</div>
                <div className="text-xs opacity-80 mt-0.5">Rank by pure coding capability (GPT-6 Astra, Claude Fable 5.1, Opus 5, Sonnet 5).</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSortModeChange('max-tokens')}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                sortMode === 'max-tokens'
                  ? 'bg-primary/10 border-primary text-primary ring-1 ring-primary/50'
                  : 'bg-surface border-border text-text hover:border-primary/40'
              }`}
            >
              <Zap className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-sm">Max Raw Volume (Tokens)</div>
                <div className="text-xs opacity-80 mt-0.5">Maximum token volume for high-throughput batching, scraping, or summarization.</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
