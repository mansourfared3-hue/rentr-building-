import type { LucideIcon, LucideProps } from 'lucide-react';
import type { ReactElement } from 'react';

import { cn } from '../utils/cn';

export interface IconProps extends LucideProps {
  icon: LucideIcon;
  className?: string;
}

export function Icon({
  icon: IconComponent,
  className,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  role,
  ...iconProps
}: IconProps): ReactElement {
  return (
    <IconComponent
      {...iconProps}
      aria-hidden={ariaHidden ?? (ariaLabel ? undefined : true)}
      aria-label={ariaLabel}
      role={role ?? (ariaLabel ? 'img' : undefined)}
      className={cn('shrink-0', className)}
    />
  );
}
