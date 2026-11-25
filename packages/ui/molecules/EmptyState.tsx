import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Icon } from '../atoms';
import { cn } from '../utils/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description: string;
  className?: string;
}

export function EmptyState({
  icon,
  heading,
  description,
  className,
}: EmptyStateProps): ReactElement {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      <Icon icon={icon} size={32} className="mb-4 text-ink-subtle" />
      <h2 className="text-lg font-semibold text-ink">{heading}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-muted">{description}</p>
    </div>
  );
}
