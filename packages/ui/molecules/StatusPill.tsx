import type { ReactElement } from 'react';

import { Badge, type BadgeVariant } from '../atoms';

export interface StatusPillProps {
  label: string;
  tone: BadgeVariant;
  className?: string;
}

export function StatusPill({ label, tone, className }: StatusPillProps): ReactElement {
  return (
    <Badge variant={tone} className={className ?? ''}>
      {label}
    </Badge>
  );
}
