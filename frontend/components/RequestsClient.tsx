'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { CheckCircle2, Clock3, Search, ShieldCheck } from 'lucide-react';

import { RequestCardDemo } from '@/components/RequestCardDemo';
import { apiRequest } from '@/lib/api-client';
import type { PublicProperty, Request, TenantProfile } from '@rentr/types';

interface RentalRequestRecord extends Omit<Request, 'tenantProfileId'> {
  tenantId: string;
  isOwner: boolean;
  profileSnapshot: Omit<TenantProfile, 'id' | 'moveInDate'> & { moveInDate: string };
  property: PublicProperty;
}

type RequestTab = 'active' | 'accepted' | 'archive';

const tabs: Array<{ id: RequestTab; label: string }> = [
  { id: 'active', label: 'النشطة' },
  { id: 'accepted', label: 'المقبولة' },
  { id: 'archive', label: 'المنتهية' },
];

function formatRent(property: PublicProperty): string {
  const amount = new Intl.NumberFormat('en-EG', {
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(property.rent);
  const period = { month: 'شهرياً', week: 'أسبوعياً', year: 'سنوياً' }[property.rentPeriod];
  return `${amount} ج.م ${period}`;
}

export function RequestsClient(): ReactElement {
  const [requests, setRequests] = useState<RentalRequestRecord[]>([]);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState<RequestTab>('active');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    void apiRequest<RentalRequestRecord[]>('/requests')
      .then((records) => {
        if (active) {
          setRequests(records);
          setError('');
          setNeedsLogin(false);
        }
      })
      .catch((caught: unknown) => {
        if (!active) return;
        const message = caught instanceof Error ? caught.message : '';
        if (message.toLowerCase().includes('access token')) {
          setNeedsLogin(true);
          setError('');
        } else {
          setError('تعذر تحميل الطلبات. تحقق من اتصالك وحاول مرة أخرى.');
          setNeedsLogin(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const counts = {
    active: requests.filter((request) => request.status === 'pending' || request.status === 'on_hold').length,
    accepted: requests.filter((request) => request.status === 'accepted').length,
    archive: requests.filter((request) => request.status === 'rejected' || request.status === 'expired').length,
  };

  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ar');
    return requests.filter((request) => {
      const matchesTab =
        tab === 'active'
          ? request.status === 'pending' || request.status === 'on_hold'
          : tab === 'accepted'
            ? request.status === 'accepted'
            : request.status === 'rejected' || request.status === 'expired';
      const matchesQuery =
        !normalizedQuery ||
        `${request.property.title} ${request.property.approximateLocation} ${request.profileSnapshot.name}`
          .toLocaleLowerCase('ar')
          .includes(normalizedQuery);
      return matchesTab && matchesQuery;
    });
  }, [query, requests, tab]);

  if (needsLogin) {
    return (
      <section className="surface-card px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <ShieldCheck size={25} />
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink">طلباتك في مكان آمن</h2>
        <p className="mt-2 text-sm text-ink-muted">سجّل الدخول لعرض طلبات التواصل ومتابعة قرارات المالك.</p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white"
          href="/login?next=%2Frequests"
        >
          تسجيل الدخول
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section role="alert" className="rounded-xl border border-danger-100 bg-danger-50 p-5 text-sm text-danger-700">
        {error}
        <button
          type="button"
          onClick={() => setRevision((current) => current + 1)}
          className="mr-3 font-bold underline"
        >
          إعادة المحاولة
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <section className="surface-card space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">متابعة آمنة وواضحة</p>
            <p className="mt-1 text-sm leading-6 text-ink-muted">
              Connects محجوزة مؤقتاً وتعود إلى محفظتك إذا انتهت مهلة الطلب دون رد.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
            <ShieldCheck size={17} />
            بياناتك محمية
          </div>
        </div>
        <label className="relative block">
          <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="ابحث باسم العقار أو الحي..."
            aria-label="ابحث في الطلبات"
            className="field-control w-full pr-10"
          />
        </label>
      </section>

      <div className="flex gap-2 overflow-x-auto border-b border-border" role="tablist" aria-label="تصنيف الطلبات">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold transition ${
              tab === id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? 'bg-brand-50 text-brand-700' : 'bg-neutral-100 text-ink-muted'}`}>
              {counts[id]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4" aria-label="جارٍ تحميل الطلبات">
          {[0, 1].map((item) => (
            <div key={item} className="surface-card animate-pulse p-5">
              <div className="h-5 w-40 rounded bg-neutral-100" />
              <div className="mt-4 h-20 rounded-lg bg-neutral-50" />
              <div className="mt-4 h-10 rounded-lg bg-neutral-50" />
            </div>
          ))}
        </div>
      ) : visibleRequests.length === 0 ? (
        <section className="surface-card px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-ink-muted">
            {tab === 'accepted' ? <CheckCircle2 size={25} /> : <Clock3 size={25} />}
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">
            {query ? 'لا توجد نتائج مطابقة' : tab === 'active' ? 'لا توجد طلبات نشطة' : tab === 'accepted' ? 'لا توجد طلبات مقبولة بعد' : 'لا يوجد سجل سابق'}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            {query ? 'جرّب البحث باسم عقار أو حي مختلف.' : 'ستظهر طلبات التواصل وتحديثاتها هنا.'}
          </p>
          {!query && tab === 'active' ? (
            <Link href="/properties" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              اكتشف العقارات
            </Link>
          ) : null}
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleRequests.map((record) => {
            const cover = record.property.images[0];
            const request: Request = {
              id: record.id,
              propertyId: record.propertyId,
              tenantProfileId: record.tenantId,
              status: record.status,
              message: record.message,
              createdAt: record.createdAt,
              expiresAt: record.expiresAt,
              ...(record.rejectionReason ? { rejectionReason: record.rejectionReason } : {}),
            };
            return (
              <RequestCardDemo
                key={record.id}
                request={request}
                isOwner={record.isOwner}
                onChanged={() => setRevision((current) => current + 1)}
                property={{
                  title: record.property.title,
                  thumbnailUrl: cover?.url ?? '/property-images/apartment-living-room.jpg',
                  thumbnailAlt: cover?.alt ?? record.property.title,
                  approximateLocation: record.property.approximateLocation,
                  priceLabel: formatRent(record.property),
                }}
                tenant={{
                  name: record.profileSnapshot.name,
                  occupation: record.profileSnapshot.occupation,
                  livingArrangement: record.profileSnapshot.livingArrangement,
                  familySize: record.profileSnapshot.familySize,
                  moveInDateLabel: record.profileSnapshot.moveInDate,
                  introduction: record.profileSnapshot.introduction,
                  ...(record.profileSnapshot.avatarUrl ? { avatarUrl: record.profileSnapshot.avatarUrl } : {}),
                }}
                chatHref={`/requests/${record.id}/chat`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
