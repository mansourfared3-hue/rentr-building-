'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactElement } from 'react';
import { ArrowLeft } from 'lucide-react';

import { RequestCardDemo } from '@/components/RequestCardDemo';
import { apiRequest } from '@/lib/api-client';
import type { PublicProperty, Request, TenantProfile } from '@rentr/types';

interface RequestDetailsRecord extends Omit<Request, 'tenantProfileId'> {
  tenantId: string;
  isOwner: boolean;
  profileSnapshot: Omit<TenantProfile, 'id' | 'moveInDate'> & { moveInDate: string };
  property: PublicProperty;
}

interface RequestDetailsClientProps {
  requestId: string;
}

export function RequestDetailsClient({ requestId }: RequestDetailsClientProps): ReactElement {
  const [request, setRequest] = useState<RequestDetailsRecord | null>(null);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void apiRequest<RequestDetailsRecord[]>('/requests')
      .then((records) => {
        if (!active) return;
        setRequest(records.find((record) => record.id === requestId) ?? null);
        setError('');
        setNeedsLogin(false);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        const message = caught instanceof Error ? caught.message : '';
        if (message.toLowerCase().includes('access token')) {
          setNeedsLogin(true);
          setError('');
        } else {
          setError('تعذر تحميل تفاصيل الطلب. تحقق من اتصالك وحاول مرة أخرى.');
          setNeedsLogin(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [requestId, revision]);

  return (
    <div className="space-y-5">
      <Link
        href="/requests"
        className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-muted hover:bg-white hover:text-ink"
      >
        <ArrowLeft size={17} />
        العودة إلى الطلبات
      </Link>

      {loading ? (
        <p role="status" className="surface-card p-5 text-sm text-ink-muted">
          جارٍ تحميل تفاصيل الطلب...
        </p>
      ) : needsLogin ? (
        <section className="surface-card p-6 text-center">
          <p className="text-sm text-ink-muted">سجّل الدخول لعرض هذا الطلب.</p>
          <Link
            href={`/login?next=${encodeURIComponent(`/requests/${requestId}`)}`}
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white"
          >
            تسجيل الدخول
          </Link>
        </section>
      ) : error ? (
        <p
          role="alert"
          className="rounded-xl border border-danger-100 bg-danger-50 p-5 text-sm text-danger-700"
        >
          {error}{' '}
          <button
            type="button"
            onClick={() => setRevision((current) => current + 1)}
            className="font-bold underline"
          >
            إعادة المحاولة
          </button>
        </p>
      ) : request ? (
        <RequestCardDemo
          request={{
            id: request.id,
            propertyId: request.propertyId,
            tenantProfileId: request.tenantId,
            status: request.status,
            message: request.message,
            createdAt: request.createdAt,
            expiresAt: request.expiresAt,
            ...(request.rejectionReason ? { rejectionReason: request.rejectionReason } : {}),
          }}
          isOwner={request.isOwner}
          onChanged={() => setRevision((current) => current + 1)}
          property={{
            title: request.property.title,
            thumbnailUrl:
              request.property.images[0]?.url ?? '/property-images/apartment-living-room.jpg',
            thumbnailAlt: request.property.images[0]?.alt ?? request.property.title,
            approximateLocation: request.property.approximateLocation,
            priceLabel:
              new Intl.NumberFormat('en-EG', {
                maximumFractionDigits: 0,
                numberingSystem: 'latn',
              }).format(request.property.rent) +
              ` ${request.property.currency} / ${request.property.rentPeriod}`,
          }}
          tenant={{
            name: request.profileSnapshot.name,
            occupation: request.profileSnapshot.occupation,
            livingArrangement: request.profileSnapshot.livingArrangement,
            familySize: request.profileSnapshot.familySize,
            moveInDateLabel: request.profileSnapshot.moveInDate,
            introduction: request.profileSnapshot.introduction,
            ...(request.profileSnapshot.avatarUrl
              ? { avatarUrl: request.profileSnapshot.avatarUrl }
              : {}),
          }}
          chatHref={`/requests/${request.id}/chat`}
        />
      ) : (
        <section className="surface-card p-6 text-center">
          <h1 className="font-bold text-ink">الطلب غير موجود</h1>
          <p className="mt-2 text-sm text-ink-muted">
            لا يوجد طلب بهذا الرابط أو ليس لديك صلاحية لعرضه.
          </p>
        </section>
      )}
    </div>
  );
}
