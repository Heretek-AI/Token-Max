import type { ReactNode } from 'react';

interface ToolbarProps {
  children: ReactNode;
  /** Rendered under the toolbar row (e.g. active filter summary). */
  footnote?: ReactNode;
  className?: string;
}

/**
 * Dense filter/controls bar: wraps control clusters with consistent
 * spacing, border and backdrop. Content is caller-owned so each page
 * keeps its own control types (selects, presets, toggles).
 */
export function Toolbar({ children, footnote, className = '' }: ToolbarProps) {
  return (
    <div
      className={`px-4 py-3 rounded-xl border border-border bg-surface-alt/40 flex flex-wrap items-center gap-3 ${className}`}
    >
      {children}
      {footnote && (
        <div className="w-full text-[11px] text-text-muted">{footnote}</div>
      )}
    </div>
  );
}
