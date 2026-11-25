'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactElement } from 'react';

import { apiRequest } from '@/lib/api-client';
import type { WalletBalance } from '@rentr/types';
import { Coins } from 'lucide-react';

export function WalletBalancePanel(): ReactElement {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiRequest<WalletBalance>('/wallet/me')
      .then(setBalance)
      .catch((caught: unknown) => {
        setError(
          caught instanceof Error && caught.message.toLowerCase().includes('access token')
            ? 'سجّل الدخول لعرض رصيدك المتاح والمحجوز.'
            : 'تعذر تحميل رصيد المحفظة الآن. تحقق من اتصالك وحاول مرة أخرى.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section
        className="animate-pulse rounded-2xl bg-brand-900 p-5"
        aria-label="جارٍ تحميل المحفظة"
      >
        <div className="h-5 w-36 rounded bg-white/10" />
        <div className="mt-5 h-16 rounded-xl bg-white/10" />
        <div className="mt-3 h-16 rounded-xl bg-white/10" />
      </section>
    );
  }

  if (!balance) {
    return (
      <section className="rounded-2xl bg-brand-950 p-5 text-white">
        <h2 className="font-semibold">محفظة نقاط الاتصال</h2>
        <p className="mt-2 text-sm leading-6 text-brand-100">
          {error ?? 'تعذر تحميل رصيد المحفظة الآن.'}
        </p>
        {error?.includes('سجّل الدخول') ? (
          <Link
            href="/login?next=%2Fwallet"
            className="mt-3 inline-block text-sm font-semibold text-white underline"
          >
            تسجيل الدخول
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section
      aria-label="ملخص محفظة نقاط الاتصال"
      className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-950 p-5 text-white shadow-card sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Coins size={19} />
          رصيد نقاط الاتصال
        </h2>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100">
          محفظة آمنة
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/10 p-4">
          <p className="text-xs text-brand-100">نقاط متاحة</p>
          <p className="mt-2 text-3xl font-bold" dir="ltr">
            {balance.available}
          </p>
        </div>
        <div className="rounded-xl bg-brand-950/30 p-4">
          <p className="text-xs text-brand-100">نقاط محجوزة</p>
          <p className="mt-2 text-3xl font-bold" dir="ltr">
            {balance.reserved}
          </p>
        </div>
      </div>
      <p className="mt-4 rounded-lg border border-white/15 bg-white/10 p-3 text-xs leading-5 text-brand-50">
        لا تُخصم النقاط نهائياً إلا بعد قبول المالك لطلبك.
      </p>
    </section>
  );
}
