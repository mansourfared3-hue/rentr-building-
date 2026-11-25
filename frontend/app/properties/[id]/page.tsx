import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import {
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
  UserRound,
  LockKeyhole,
  Clock3,
} from 'lucide-react';

import { AppNavbar } from '@/components/AppNavbar';
import { PropertyPhotoGallery } from '@/components/PropertyPhotoGallery';
import { RentalRequestForm } from '@/components/RentalRequestForm';
import { getPublicProperty } from '@/lib/api-client';

interface PropertyDetailPageProps {
  params: { id: string };
}

function formatRent(amount: number, currency: string, period: string): string {
  const formatted = new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(amount);
  const periodLabel = { month: 'شهرياً', week: 'أسبوعياً', year: 'سنوياً' }[period] ?? period;
  return `${formatted} / ${periodLabel}`;
}

function formatAvailability(value: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'long',
    numberingSystem: 'latn',
  }).format(new Date(`${value}T00:00:00`));
}

function furnishingLabel(value: string): string {
  return (
    {
      furnished: 'مفروش بالكامل',
      'partially-furnished': 'مفروش جزئياً',
      unfurnished: 'غير مفروش',
      unknown: 'غير محدد',
    }[value] ?? value
  );
}

function formatUpdatedAt(value: string): string {
  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return 'عقار منشور';
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    numberingSystem: 'latn',
  }).format(updatedAt);
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps): Promise<ReactElement> {
  const property = await getPublicProperty(params.id);

  if (!property) notFound();

  const specs = [
    { label: 'غرف النوم', value: String(property.bedrooms), icon: BedDouble },
    { label: 'الحمامات', value: String(property.bathrooms), icon: Bath },
    { label: 'المساحة', value: `${property.area} ${property.areaUnit}`, icon: Ruler },
  ];

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <AppNavbar initialRole="tenant" />
      <main className="page-shell py-4 sm:py-6">
        <a
          href="/properties"
          className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-muted transition hover:bg-white hover:text-ink"
        >
          <span aria-hidden="true">←</span>
          العودة إلى العقارات
        </a>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0 space-y-5">
            <PropertyPhotoGallery images={property.images} title={property.title} />

            <section className="surface-card p-4 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold capitalize text-brand-700">
                  {property.type === 'apartment'
                    ? 'شقة'
                    : property.type === 'studio'
                      ? 'استوديو'
                      : property.type === 'house'
                        ? 'منزل'
                        : property.type === 'room'
                          ? 'غرفة'
                          : 'عقار'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  <Check size={14} />
                  متاح للإيجار
                </span>
                <span className="mr-auto inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-ink-muted">
                  <Clock3 size={13} />
                  آخر تحديث {formatUpdatedAt(property.updatedAt)}
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {property.title}
              </h1>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-ink-muted">
                <MapPin size={18} className="mt-1 shrink-0 text-brand-600" />
                <span>{property.approximateLocation}</span>
              </p>
              <p className="mt-4 text-2xl font-bold text-brand-700">
                {formatRent(property.rent, property.currency, property.rentPeriod)}
              </p>
              <p className="mt-1 text-xs text-ink-subtle">السعر المعروض كما حدده المالك</p>
            </section>

            <section
              className="grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-white"
              aria-label="مواصفات العقار"
            >
              {specs.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 border-l border-border px-2 py-4 text-center last:border-l-0 sm:flex-row sm:justify-center sm:gap-3"
                >
                  <Icon size={20} className="text-brand-600" />
                  <div>
                    <p className="text-lg font-bold text-ink" dir="ltr">
                      {value}
                    </p>
                    <p className="text-xs text-ink-muted">{label}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="surface-card p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Sparkles size={19} className="text-brand-600" />
                <h2 className="text-lg font-bold text-ink">عن هذا العقار</h2>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-muted">
                {property.description}
              </p>
              {property.additionalInfo ? (
                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-ink">معلومات إضافية</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-ink-muted">
                    {property.additionalInfo}
                  </p>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-4 text-sm text-ink-muted">
                <CalendarDays size={17} className="text-brand-600" />
                <span>متاح اعتباراً من</span>
                <time className="font-semibold text-ink" dateTime={property.availabilityDate}>
                  {formatAvailability(property.availabilityDate)}
                </time>
              </div>
            </section>

            <section className="surface-card p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-brand-700">خصوصيتك أولاً</p>
                  <h2 className="mt-1 text-lg font-bold text-ink">الموقع التقريبي</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <ShieldCheck size={20} />
                </span>
              </div>
              <div className="relative mt-4 flex min-h-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-[#f1f3f1]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      'linear-gradient(30deg, transparent 47%, #d6ded8 48%, #d6ded8 50%, transparent 51%), linear-gradient(120deg, transparent 47%, #d6ded8 48%, #d6ded8 50%, transparent 51%)',
                    backgroundSize: '56px 56px',
                  }}
                />
                <div className="relative flex flex-col items-center rounded-xl border border-border bg-white/95 px-5 py-4 text-center shadow-soft">
                  <MapPin size={24} className="text-brand-700" />
                  <p className="mt-2 text-sm font-bold text-ink">{property.community}</p>
                  <p className="mt-1 text-xs text-ink-muted">الحي فقط — العنوان الدقيق خاص</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-6 text-ink-muted">
                لا يظهر موقع العقار الدقيق على الصفحة العامة. تُتاح تفاصيل التواصل بعد قبول طلبك من
                المالك.
              </p>
            </section>

            <section className="surface-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <UserRound size={22} />
                  </span>
                  <div>
                    <p className="text-xs text-ink-muted">عن المالك</p>
                    <h2 className="mt-1 font-bold text-ink">مالك العقار</h2>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                  <LockKeyhole size={14} />
                  تواصل محمي
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-muted">
                تُحفظ بيانات المالك ووسائل التواصل الخاصة حتى تتقدم بطلب عبر المنصة.
              </p>
            </section>

            <section className="surface-card p-4 sm:p-6">
              <h2 className="text-lg font-bold text-ink">المواصفات والتجهيزات</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'حالة التأثيث',
                    value: furnishingLabel(property.furnishing),
                    icon: Check,
                  },
                  {
                    label: 'موعد التوفر',
                    value: formatAvailability(property.availabilityDate),
                    icon: CalendarDays,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2 rounded-lg bg-neutral-50 p-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-700">
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-ink-muted">{label}</p>
                      <p className="truncate text-xs font-semibold text-ink">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 flex items-center gap-2 rounded-lg border border-border p-3 text-xs leading-5 text-ink-muted">
                <ShieldCheck size={16} className="shrink-0 text-brand-700" />
                الرسوم والشروط النهائية تُناقش مباشرة مع المالك بعد تفعيل طلبات التواصل.
              </p>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <section id="request" className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={19} className="text-brand-600" />
                <h2 className="text-lg font-bold text-ink">تواصل مباشر مع المالك</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                أرسل طلب استفسار أو معاينة للمالك. سيتم حجز نصف رصيدك المتاح مؤقتاً لحين قبول الطلب أو انتهاء المهلة.
              </p>
              <div className="my-4 rounded-lg bg-neutral-50 p-3 text-sm">
                <p className="font-semibold text-ink">طلبك آمن ومحدد بمهلة 12 ساعة</p>
                <p className="mt-1 text-xs leading-5 text-ink-muted">
                  لا تُشارك أي أرقام أو بيانات اتصال إلا بعد قبول المالك. تُعاد النقاط تلقائياً إذا رُفض الطلب أو انتهت المهلة.
                </p>
              </div>
              <RentalRequestForm propertyId={property.id} />
            </section>
          </aside>
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 p-3 shadow-[0_-4px_16px_rgba(28,36,52,0.06)] backdrop-blur lg:hidden">
        <div className="page-shell flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-700">
              {formatRent(property.rent, property.currency, property.rentPeriod)}
            </p>
            <p className="text-xs text-ink-muted">تواصل مباشر وآمن</p>
          </div>
          <a
            href="#request"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-bold text-white shadow-sm hover:bg-brand-800"
          >
            إرسال طلب
          </a>
        </div>
      </div>
    </div>
  );
}
