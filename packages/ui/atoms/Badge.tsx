import type { HTMLAttributes, ReactElement } from 'react';

import { cn } from '../utils/cn';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'border-status-neutral-border bg-status-neutral-bg text-status-neutral-text',
  success: 'border-status-success-border bg-status-success-bg text-status-success-text',
  warning: 'border-status-warning-border bg-status-warning-bg text-status-warning-text',
  danger: 'border-status-danger-border bg-status-danger-bg text-status-danger-text',
};

export function Badge({
  children,
  className,
  variant = 'neutral',
  ...spanProps
}: BadgeProps): ReactElement {
  return (
    <span
      {...spanProps}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
