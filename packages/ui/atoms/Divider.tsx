import type { ComponentPropsWithoutRef, ReactElement } from 'react';

import { cn } from '../utils/cn';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className' | 'role'
> {
  orientation?: DividerOrientation;
  decorative?: boolean;
  className?: string;
}

export function Divider({
  className,
  decorative = false,
  orientation = 'horizontal',
  ...dividerProps
}: DividerProps): ReactElement {
  return (
    <div
      {...dividerProps}
      role={decorative ? 'presentation' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      aria-hidden={decorative ? true : dividerProps['aria-hidden']}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px self-stretch',
        className,
      )}
    />
  );
}
