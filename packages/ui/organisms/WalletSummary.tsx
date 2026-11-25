import type { ReactElement } from 'react';

import { BalancePill } from '../molecules';
import { cn } from '../utils/cn';

export interface WalletSummaryProps {
  available: number;
  reserved: number;
  className?: string;
}

export function WalletSummary({
  available,
  reserved,
  className,
}: WalletSummaryProps): ReactElement {
  return (
    <section
      aria-label="ملخص محفظة نقاط الاتصال"
      className={cn('rounded-xl border border-border bg-surface p-4 shadow-card', className)}
    >
      <h2 className="text-base font-semibold text-ink">رصيد نقاط الاتصال</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <BalancePill label="متاحة" value={available} tone="success" />
        <BalancePill label="محجوزة" value={reserved} tone="warning" />
      </div>
    </section>
  );
}
