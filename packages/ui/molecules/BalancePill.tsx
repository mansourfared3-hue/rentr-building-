import type { ReactElement } from 'react';

import { Badge, type BadgeVariant } from '../atoms';

export interface BalancePillProps {
  label: string;
  value: string | number;
  tone: BadgeVariant;
  className?: string;
}

export function BalancePill({ label, value, tone, className }: BalancePillProps): ReactElement {
  return (
    <Badge variant={tone} className={className ?? ''}>
      {value} {label}
    </Badge>
  );
}
