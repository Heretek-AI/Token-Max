import type { ReactNode } from 'react';

interface StatBlockProps {
  label: ReactNode;
  value: ReactNode;
  /** Optional trailing icon (rendered next to the label). */
  icon?: ReactNode;
  /** Small secondary line under the value (units, basis, tooltip is set by caller). */
  sub?: ReactNode;
  tone?: 'primary' | 'neutral';
  title?: string;
}

/** Compact metric readout used across calculators and results headers. */
export function StatBlock({ label, value, icon, sub, tone = 'neutral', title }: StatBlockProps) {
  return (
    <div
      title={title}
      className="bg-surface p-4 rounded-xl border border-border shadow-xs min-w-0"
    >
      <div className="flex items-center justify-between text-text-muted mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider truncate">{label}</span>
        {icon}
      </div>
      <div
        className={`text-2xl font-black ${tone === 'primary' ? 'text-primary' : 'text-text'}`}
      >
        {value}
      </div>
      {sub && <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}
