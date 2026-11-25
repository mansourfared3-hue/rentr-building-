import Link from 'next/link';
import type { ReactElement } from 'react';
import { ArrowLeft, BadgeCheck, KeyRound, ShieldCheck } from 'lucide-react';

import { AppNavbar } from '@/components/AppNavbar';
import { getPublishedProperties } from '@/lib/api-client';
import { MarketplaceListings } from '@/components/MarketplaceListings';
import type { PublicProperty } from '@rentr/types';

export const dynamic = 'force-dynamic';

export default async function PropertiesPage(): Promise<ReactElement> {
  let properties: PublicProperty[] = [];
  let failedToLoad = false;
  try {
    properties = await getPublishedProperties();
  } catch {
    failedToLoad = true;
  }

  return (
    <div className="min-h-screen">
      <AppNavbar initialRole="tenant" />
      <main className="page-shell space-y-6 py-6 sm:py-9">
        <section className="grid gap-4 border-b border-border pb-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:pb-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand-700">
              <BadgeCheck size={16} />
              منصة إيجار مباشرة
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight text-ink sm:text-3xl">
              عقارات للإيجار
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
              اكتشف عقارات مناسبة وتواصل مباشرة مع المالك، دون وسيط أو عمولات خفية.
            </p>
          </div>
          <Link
            href="/properties/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-brand-700 transition hover:bg-brand-50"
          >
            أضف عقارك
            <ArrowLeft size={17} />
          </Link>
        </section>

        <div className="grid gap-2 sm:grid-cols-2">
          <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-ink-muted">
            <ShieldCheck size={16} className="shrink-0" />
            بيانات المالك وموقع العقار الدقيق محمية.
          </p>
          <p className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-ink-muted">
            <KeyRound size={16} className="shrink-0" />
            الإعلانات منشورة مباشرة من الملاك.
          </p>
        </div>

        <section aria-label="العقارات المتاحة">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-brand-700">تصفح وحدد ما يناسبك</p>
              <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">عقارات متاحة</h2>
            </div>
            <p className="hidden text-sm text-ink-muted sm:block">
              موقع تقريبي وبيانات واضحة من البداية
            </p>
          </div>
          <MarketplaceListings properties={properties} loadError={failedToLoad} />
        </section>
      </main>
      <footer className="mt-10 border-t border-border bg-white">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span>رنتر كونكت — تواصل مباشر، سكن أوضح.</span>
          <span>خصوصيتك محفوظة في كل خطوة.</span>
        </div>
      </footer>
    </div>
  );
}
