import type { CSSProperties, ReactNode } from 'react';

/** Tones map to semantic theme tokens only — never raw hex. */
export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  neutral: 'bg-surface-alt text-text-muted border-border',
};

interface DataBadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
}

export function DataBadge({ children, tone = 'neutral', className = '', style }: DataBadgeProps) {
  return (
    <span
      style={style}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
