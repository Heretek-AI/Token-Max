import type { ReactNode } from 'react';

interface TooltipProps {
  /** Label shown as hover/focus tip. */
  text: string;
  /** Position — default places tip above. */
  side?: 'top' | 'bottom';
  className?: string;
  children: ReactNode;
}

/**
 * CSS-only tooltip (no portal deps): shows `text` on hover/focus of `children`.
 * Use for terminal-style hover explainer on tracked elements; callers keep
 * their own layout control.
 */
export function Tooltip({ text, side = 'top', className = '', children }: TooltipProps) {
  return (
    <span className={`relative group inline-flex ${className}`} tabIndex={0}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 left-1/2 -translate-x-1/2 mb-1 whitespace-pre-line w-max max-w-xs px-2.5 py-1.5 rounded-md text-[11px] font-medium text-text bg-void-800 border border-border shadow-lg opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity ${
          side === 'top' ? 'bottom-full' : 'top-full'
        }`}
      >
        {text}
      </span>
    </span>
  );
}
