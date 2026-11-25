'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactElement } from 'react';
import {
  Bath,
  BedDouble,
  ChevronDown,
  ChevronUp,
  Heart,
  MapPin,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

import type { PublicProperty } from '@rentr/types';

type ListingType = 'all' | 'apartment' | 'studio' | 'house' | 'room';

const listingFilters: Array<{ value: ListingType; label: string }> = [
  { value: 'all', label: 'الكل' },
  { value: 'apartment', label: 'شقق سكنية' },
  { value: 'studio', label: 'استوديو' },
  { value: 'house', label: 'منازل' },
  { value: 'room', label: 'غرف' },
];

function formatRent(property: PublicProperty): string {
  const amount = new Intl.NumberFormat('en-EG', {
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(property.rent);
  const period = { month: 'شهرياً', week: 'أسبوعياً', year: 'سنوياً' }[property.rentPeriod];
  return `${amount} ج.م ${period}`;
}

function formatType(type: PublicProperty['type']): string {
  return {
    apartment: 'شقة',
    studio: 'استوديو',
    house: 'منزل',
    room: 'غرفة',
    other: 'عقار',
  }[type];
}

export function MarketplaceListings({
  properties,
  loadError = false,
}: {
  properties: readonly PublicProperty[];
  loadError?: boolean;
}): ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<ListingType>('all');
  const [sort, setSort] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minimumRent, setMinimumRent] = useState('');
  const [maximumRent, setMaximumRent] = useState('');
  const [minimumBedrooms, setMinimumBedrooms] = useState('');

  const appliedFilterCount = [minimumRent, maximumRent, minimumBedrooms].filter(Boolean).length;

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ar');
    return properties
      .filter((property) => {
        const matchesType = type === 'all' || property.type === type;
        const matchesMinimumRent = !minimumRent || property.rent >= Number(minimumRent);
        const matchesMaximumRent = !maximumRent || property.rent <= Number(maximumRent);
        const matchesBedrooms = !minimumBedrooms || property.bedrooms >= Number(minimumBedrooms);
        const matchesQuery =
          !normalizedQuery ||
          `${property.title} ${property.community} ${property.approximateLocation} ${property.description}`
            .toLocaleLowerCase('ar')
            .includes(normalizedQuery);
        return (
          matchesType && matchesQuery && matchesMinimumRent && matchesMaximumRent && matchesBedrooms
        );
      })
      .sort((left, right) => {
        if (sort === 'price-low') return left.rent - right.rent;
        if (sort === 'price-high') return right.rent - left.rent;
        return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
      });
  }, [properties, query, sort, type, minimumRent, maximumRent, minimumBedrooms]);

  const clearFilters = (): void => {
    setQuery('');
    setType('all');
    setMinimumRent('');
    setMaximumRent('');
    setMinimumBedrooms('');
  };

  const toggleFavorite = (id: string): void => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <section className="surface-card p-3 sm:p-4" aria-label="البحث عن العقارات">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search size={19} className="pointer-events-none absolute right-3 text-ink-subtle" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="ابحث بالمنطقة: التجمع، الشيخ زايد، المعادي..."
              aria-label="ابحث بالمنطقة أو اسم العقار"
              className="field-control w-full pr-10"
            />
          </label>
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink"
          >
            <SlidersHorizontal size={17} className="text-brand-600" />
            <span>الفلاتر</span>
            {appliedFilterCount ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] text-white">
                {appliedFilterCount}
              </span>
            ) : null}
            {filtersOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <label className="relative flex items-center gap-2 rounded-lg border border-border bg-white px-3">
            <span className="sr-only">ترتيب النتائج</span>
            <SlidersHorizontal size={17} className="text-brand-600" />
            <select
              value={sort}
              onChange={(event) => setSort(event.currentTarget.value as typeof sort)}
              className="min-h-11 min-w-32 bg-transparent text-sm text-ink outline-none"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="price-low">السعر: الأقل</option>
              <option value="price-high">السعر: الأعلى</option>
            </select>
          </label>
        </div>
        {filtersOpen ? (
          <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-3">
            <label className="space-y-1.5 text-xs font-medium text-ink-muted">
              أقل إيجار شهري (ج.م)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={minimumRent}
                onChange={(event) => setMinimumRent(event.currentTarget.value)}
                className="field-control w-full"
              />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-ink-muted">
              أعلى إيجار شهري (ج.م)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={maximumRent}
                onChange={(event) => setMaximumRent(event.currentTarget.value)}
                className="field-control w-full"
              />
            </label>
            <label className="space-y-1.5 text-xs font-medium text-ink-muted">
              غرف النوم على الأقل
              <select
                value={minimumBedrooms}
                onChange={(event) => setMinimumBedrooms(event.currentTarget.value)}
                className="field-control w-full"
              >
                <option value="">أي عدد</option>
                <option value="1">غرفة واحدة فأكثر</option>
                <option value="2">غرفتان فأكثر</option>
                <option value="3">3 غرف فأكثر</option>
              </select>
            </label>
          </div>
        ) : null}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="نوع العقار">
          {listingFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              aria-pressed={type === filter.value}
              onClick={() => setType(filter.value)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                type === filter.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-border bg-white text-ink-muted hover:border-brand-200 hover:bg-brand-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/70 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-700">
            <ShieldCheck size={19} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">رصيد نقاط التواصل</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              يظهر رصيدك عند تفعيل الطلبات في مرحلة لاحقة.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
          غير مفعّل بعد
        </span>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">عقارات منشورة من الملاك مباشرة</p>
          <p className="mt-1 text-sm font-semibold text-ink" aria-live="polite">
            {loadError ? 'تعذر تحميل العقارات' : `${filteredProperties.length} عقار متاح`}
          </p>
        </div>
        <Link
          href="/wallet"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          <ShieldCheck size={16} />
          طلبات آمنة تحمي بياناتك
        </Link>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-danger-100 bg-danger-50 p-6 text-center"
        >
          <h3 className="font-semibold text-danger-700">تعذر تحميل العقارات حالياً</h3>
          <p className="mt-2 text-sm leading-6 text-ink-muted">تحقق من اتصالك وحاول مرة أخرى.</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="mt-4 min-h-10 rounded-lg bg-white px-4 text-sm font-semibold text-brand-700 shadow-soft"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProperties.map((property) => {
            const cover = property.images[0];
            const image = cover?.url ?? '/property-images/apartment-living-room.jpg';
            return (
              <article
                key={property.id}
                className="group overflow-hidden rounded-xl border border-border bg-white shadow-[0_2px_8px_rgba(28,36,52,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
              >
                <Link
                  href={`/properties/${property.id}`}
                  aria-label={`تفاصيل ${property.title}`}
                  className="relative block aspect-[16/10] overflow-hidden bg-neutral-100"
                >
                  <img
                    src={image}
                    alt={cover?.alt ?? property.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                  <span className="absolute right-3 top-3 rounded-md border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    عقار منشور
                  </span>
                  <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-soft">
                    {formatType(property.type)}
                  </span>
                </Link>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-bold leading-7 text-ink">{property.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                        <MapPin size={15} className="shrink-0 text-brand-600" />
                        <span className="truncate">{property.approximateLocation}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={
                        favorites.has(property.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'
                      }
                      aria-pressed={favorites.has(property.id)}
                      onClick={() => toggleFavorite(property.id)}
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                        favorites.has(property.id)
                          ? 'border-danger-100 bg-danger-50 text-danger-600'
                          : 'border-border bg-white text-ink-muted hover:border-danger-100 hover:text-danger-600'
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={favorites.has(property.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                  <p className="text-xl font-bold text-brand-700" dir="rtl">
                    {formatRent(property)}
                  </p>
                  <ul className="grid grid-cols-3 divide-x divide-x-reverse divide-border rounded-lg bg-neutral-50 px-2 py-3 text-xs text-ink-muted">
                    <li className="flex items-center justify-center gap-1.5">
                      <BedDouble size={15} className="text-brand-600" />
                      <span>{property.bedrooms} غرف</span>
                    </li>
                    <li className="flex items-center justify-center gap-1.5">
                      <Bath size={15} className="text-brand-600" />
                      <span>{property.bathrooms} حمام</span>
                    </li>
                    <li className="flex items-center justify-center gap-1.5">
                      <Ruler size={15} className="text-brand-600" />
                      <span dir="ltr">
                        {property.area} {property.areaUnit}
                      </span>
                    </li>
                  </ul>
                  <p className="flex items-start gap-2 text-xs leading-5 text-ink-subtle">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                    موقع تقريبي لحماية خصوصية صاحب العقار
                  </p>
                  <Link
                    href={`/properties/${property.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    عرض تفاصيل العقار
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="surface-card px-6 py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-ink-muted">
            <Search size={24} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">لا توجد نتائج مطابقة</h2>
          <p className="mt-2 text-sm text-ink-muted">جرّب تغيير المنطقة أو نوع العقار.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 min-h-10 rounded-lg px-4 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            مسح عوامل البحث
          </button>
        </section>
      )}
    </div>
  );
}
