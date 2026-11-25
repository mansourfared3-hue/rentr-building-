'use client';

import Link from 'next/link';
import { useState, type ReactElement } from 'react';

import {
  RequestCard,
  type RequestPropertySummary,
  type RequestRejectionReason,
  type RequestTenantSummary,
} from '@rentr/ui/organisms';
import type { Request } from '@rentr/types';
import { apiRequest } from '@/lib/api-client';

export interface RequestCardDemoProps {
  request: Request;
  property: RequestPropertySummary;
  tenant: RequestTenantSummary;
  chatHref: string;
  isOwner: boolean;
  onChanged: () => void;
}

export function RequestCardDemo({
  request,
  property,
  tenant,
  chatHref,
  isOwner,
  onChanged,
}: RequestCardDemoProps): ReactElement {
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function decide(
    decision: 'accept' | 'reject-profile' | 'reject-unavailable',
  ): Promise<void> {
    setBusy(true);
    setNotice('');
    try {
      await apiRequest(`/requests/${request.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      setNotice(
        decision === 'accept'
          ? 'تم قبول الطلب وإغلاق الطلبات الأخرى على هذا العقار.'
          : decision === 'reject-unavailable'
            ? 'تم تعليق العقار وإرسال تنبيه للمتابعة.'
            : 'تم تحديث حالة الطلب وإعادة النقاط إلى المستأجر عند الاستحقاق.',
      );
      onChanged();
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : 'Request could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <RequestCard
        property={property}
        tenant={tenant}
        tenantMessage={request.message}
        expiresAt={new Date(request.expiresAt)}
        onAccept={() => void decide('accept')}
        onReject={(reason: RequestRejectionReason) =>
          void decide(reason === 'profile' ? 'reject-profile' : 'reject-unavailable')
        }
        showActions={isOwner && ['pending', 'on_hold'].includes(request.status) && !busy}
        statusLabel={request.status}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p role="status" className="text-sm text-ink-muted">
          {notice}
        </p>
        {request.status === 'accepted' ? (
          <Link
            href={chatHref}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            افتح المحادثة
          </Link>
        ) : null}
      </div>
    </div>
  );
}
