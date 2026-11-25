import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { cn } from '../utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends Omit<
  ComponentPropsWithoutRef<'svg'>,
  'aria-hidden' | 'aria-label' | 'className' | 'role' | 'viewBox'
> {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function Spinner({
  size = 'md',
  label,
  className,
  ...svgProps
}: SpinnerProps): ReactElement {
  return (
    <svg
      {...svgProps}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('shrink-0 animate-spin text-current', sizeClasses[size], className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
