import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

interface TableShellProps {
  children: ReactNode;
  /** Extra hint under the table (e.g. footnote about normalized yields). */
  footerNote?: ReactNode;
  className?: string;
}

/**
 * Scroll-safe table container with accessible sticky header support.
 * Usage: <TableShell><table><thead sticky by default>...</table></TableShell>
 */
export function TableShell({ children, footerNote, className = '' }: TableShellProps) {
  return (
    <div className={className}>
      <div className="overflow-x-auto">{children}</div>
      {footerNote && (
        <div className="px-5 py-3 border-t border-border text-[11px] text-text-muted">{footerNote}</div>
      )}
    </div>
  );
}

export function Th({ className = '', children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className={`px-3 py-3 font-semibold sticky top-0 bg-surface-alt/95 backdrop-blur-sm z-10 border-b border-border text-text-muted text-xs ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ className = '', children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...rest} className={`px-3 py-3 ${className}`}>
      {children}
    </td>
  );
}
