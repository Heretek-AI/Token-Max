import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** Optional section header: icon + title + right-side meta. */
  header?: { icon?: ReactNode; title: ReactNode; meta?: ReactNode };
  className?: string;
  /** Extra card highlight treatment (winner rows etc.). */
  highlight?: boolean;
}

/**
 * Standard grim-card panel. Replaces the repeated
 * `bg-surface rounded-2xl border border-border ...` chrome across pages so
 * Phase 4 theming only has to change tokens.
 */
export function Card({ children, header, className = '', highlight = false }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-2xl border border-border shadow-xs overflow-hidden ${highlight ? 'border-primary/40' : ''} ${className}`}
    >
      {header && (
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="min-w-0">
            <h3 className="font-extrabold text-base text-text flex items-center gap-2">
              {header.icon && <span className="text-primary shrink-0">{header.icon}</span>}
              <span className="truncate">{header.title}</span>
            </h3>
          </div>
          {header.meta && <div className="shrink-0">{header.meta}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
