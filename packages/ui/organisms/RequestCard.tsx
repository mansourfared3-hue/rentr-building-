'use client';

import type { ReactElement } from 'react';

import { Avatar, Button } from '../atoms';
import { CountdownBadge } from '../molecules';
import { cn } from '../utils/cn';

export type RequestRejectionReason = 'profile' | 'unavailable';
export type TenantLivingArrangement = 'alone' | 'couple' | 'family';

export interface RequestTenantSummary {
  name: string;
  occupation?: string;
  livingArrangement: TenantLivingArrangement;
  familySize?: number;
  moveInDateLabel?: string;
  introduction?: string;
  avatarUrl?: string;
  avatarInitials?: string;
}

export interface RequestPropertySummary {
  title: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  approximateLocation: string;
  priceLabel?: string;
}

export interface RequestCardProps {
  property: RequestPropertySummary;
  tenant: RequestTenantSummary;
  tenantMessage?: string;
  expiresAt: Date;
  onAccept: () => void;
  onReject: (reason: RequestRejectionReason) => void;
  showActions?: boolean;
  statusLabel?: string;
  className?: string;
}

export function RequestCard({
  property,
  tenant,
  tenantMessage,
  expiresAt,
  onAccept,
  onReject,
  showActions = true,
  statusLabel = 'Pending',
  className,
}: RequestCardProps): ReactElement {
  const normalizedStatus = statusLabel.toLowerCase();
  const isPending = normalizedStatus === 'pending' || normalizedStatus === 'قيد المراجعة';
  const isOnHold =
    normalizedStatus === 'on hold' ||
    normalizedStatus === 'on_hold' ||
    normalizedStatus === 'معلّق';
  const statusText =
    {
      pending: 'قيد المراجعة',
      on_hold: 'معلّق',
      accepted: 'مقبول',
      rejected: 'مرفوض',
      expired: 'منتهي',
    }[normalizedStatus.replace(' ', '_')] ?? statusLabel;

  return (
    <article
      className={cn(
        'space-y-4 rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={property.thumbnailUrl}
            alt={property.thumbnailAlt}
            className="h-16 w-20 shrink-0 rounded-md object-cover"
          />
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-ink">{property.title}</h2>
            <p className="truncate text-sm text-ink-muted">{property.approximateLocation}</p>
            {property.priceLabel ? (
              <p className="mt-1 text-sm font-medium text-brand-700">{property.priceLabel}</p>
            ) : null}
          </div>
        </div>
        {isPending ? (
          <CountdownBadge target={expiresAt} />
        ) : isOnHold ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-800">
              معلّق
            </span>
            <CountdownBadge target={expiresAt} />
          </div>
        ) : (
          <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-sm font-medium capitalize text-ink-muted">
            {statusText}
          </span>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-neutral-50 p-3">
        <Avatar
          {...(tenant.avatarUrl ? { src: tenant.avatarUrl } : {})}
          {...(tenant.avatarInitials ? { initials: tenant.avatarInitials } : {})}
          alt={tenant.name}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-ink">{tenant.name}</h3>
          {tenant.occupation ? <p className="text-sm text-ink-muted">{tenant.occupation}</p> : null}
          <p className="text-sm text-ink-muted">
            {
              ({ alone: 'بمفرده', couple: 'زوجان', family: 'أسرة' } as const)[
                tenant.livingArrangement
              ]
            }
            {tenant.familySize !== undefined ? ` · ${tenant.familySize} أفراد` : ''}
          </p>
          {tenant.moveInDateLabel ? (
            <p className="text-sm text-ink-muted">موعد الانتقال: {tenant.moveInDateLabel}</p>
          ) : null}
          {tenant.introduction ? (
            <p className="mt-2 text-sm text-ink">{tenant.introduction}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-3">
        <p className="text-xs font-medium text-ink-muted">رسالة المستأجر</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
          {tenantMessage?.trim() ? tenantMessage : 'لم يضف المستأجر رسالة.'}
        </p>
      </div>

      {showActions ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="primary" onClick={onAccept}>
            قبول الطلب
          </Button>
          <Button variant="destructive" onClick={() => onReject('profile')}>
            رفض الملف
          </Button>
          <Button variant="destructive" onClick={() => onReject('unavailable')}>
            العقار غير متاح
          </Button>
        </div>
      ) : null}
    </article>
  );
}
