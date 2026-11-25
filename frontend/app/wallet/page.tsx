import Link from 'next/link';
import type { ReactElement } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CircleHelp,
  CreditCard,
  History,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Store,
  Wallet,
} from 'lucide-react';

import { AppNavbar } from '@/components/AppNavbar';
import { WalletBalancePanel } from '@/components/WalletBalancePanel';

const plans = [
  {
    name: 'باقة البداية',
    connects: 3,
    price: '150',
    detail: 'مناسبة لمعاينة عقار أو عقارين بسرعة',
    rate: '50 ج.م / اتصال',
    badge: 'Starter',
    recommended: false,
  },
  {
    name: 'باقة الباحث النشط',
    connects: 12,
    price: '450',
    detail: 'الخيار الأفضل للباحثين الجادين',
    rate: '37.5 ج.م / اتصال',
    badge: 'الأكثر طلباً والأفضل قيمة',
    recommended: true,
  },
  {
    name: 'باقة البحث الشامل',
    connects: 30,
    price: '950',
    detail: 'للعائلات والشركات الباحثة عن خيارات متعددة',
    rate: '31.6 ج.م / اتصال',
    badge: 'أفضل توفير',
    recommended: false,
  },
];

const transactions = [
  {
    title: 'حجز نقطة اتصال لطلب عقار',
    detail: 'شقة في التجمع الخامس · منذ 3 ساعات',
    amount: '−1 نقطة',
    kind: 'حجز معلّق',
  },
  {
    title: 'استرداد تلقائي',
    detail: 'انتهت مهلة الطلب دون رد · 04:30 م',
    amount: '+1 نقطة',
    kind: 'مسترد لمحفظتك',
  },
  {
    title: 'شراء باقة الباحث النشط',
    detail: 'عملية توضيحية · 28 أكتوبر 2024',
    amount: '+12 نقطة',
    kind: 'شراء باقة',
  },
];

export default function WalletPage(): ReactElement {
  return (
    <div className="min-h-screen">
      <AppNavbar initialRole="tenant" />
      <main className="page-shell space-y-6 py-5 sm:py-8">
        <WalletBalancePanel />

        <section className="surface-card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <RefreshCw size={19} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">ضمان استرداد الرصيد</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              تُعاد النقاط المحجوزة تلقائياً إذا لم يرد المالك خلال 12 ساعة.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-brand-700">اختر ما يناسب بحثك</p>
            <h2 className="mt-1 text-xl font-bold text-ink">باقات شحن رنتر كونكت</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-xl border bg-white p-4 shadow-card sm:p-5 ${plan.recommended ? 'border-brand-300' : 'border-border'}`}
              >
                {plan.recommended ? (
                  <span className="absolute -top-3 right-4 rounded-full bg-brand-700 px-3 py-1 text-[11px] font-semibold text-white">
                    ★ {plan.badge}
                  </span>
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">{plan.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">{plan.detail}</p>
                  </div>
                  <BadgeCheck size={22} className="shrink-0 text-brand-600" />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <p className="text-sm text-ink-muted">
                    <strong className="text-2xl text-brand-700" dir="ltr">
                      {plan.connects}
                    </strong>{' '}
                    نقاط اتصال
                  </p>
                  <p className="text-lg font-bold text-ink" dir="ltr">
                    {plan.price} ج.م
                  </p>
                </div>
                <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2 text-xs font-medium text-ink-muted">
                  {plan.rate}
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-3 min-h-11 w-full cursor-not-allowed rounded-lg bg-neutral-100 px-3 text-sm font-semibold text-ink-subtle"
                >
                  الشحن غير متاح في هذه المعاينة
                </button>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">طرق الدفع المحلية المعتمدة</h2>
              <p className="mt-1 text-xs text-ink-muted">خيارات مقترحة للمرحلة القادمة</p>
            </div>
            <LockKeyhole size={18} className="text-emerald-700" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'محافظ ذكية', detail: 'خدمات الهاتف', icon: Smartphone },
              { label: 'فوري', detail: 'الدفع من المتاجر', icon: Store },
              { label: 'ميزة / فيزا', detail: 'بطاقات بنكية', icon: CreditCard },
            ].map(({ label, detail, icon: Icon }) => (
              <article key={label} className="surface-card p-3 text-center sm:p-4">
                <Icon size={21} className="mx-auto text-brand-700" />
                <h3 className="mt-2 text-xs font-bold text-ink sm:text-sm">{label}</h3>
                <p className="mt-1 text-[10px] text-ink-muted sm:text-xs">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card flex items-center gap-4 p-4 sm:p-5">
          <img
            src="/property-images/bright-apartment-living-room.jpg"
            alt=""
            className="h-16 w-20 shrink-0 rounded-lg object-cover"
          />
          <div>
            <p className="text-xs font-semibold text-brand-700">وفر عمولة الوسيط</p>
            <h2 className="mt-1 font-bold text-ink">تواصل مباشر بدون وسيط</h2>
            <p className="mt-1 text-xs leading-5 text-ink-muted">
              تواصل مع المالك مباشرة، دون عمولات خفية أو وسطاء.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">سجل العمليات</h2>
              <p className="text-xs text-ink-muted">أمثلة توضيحية وليست حركات فعلية</p>
            </div>
            <History size={19} className="text-brand-700" />
          </div>
          {transactions.map((transaction) => (
            <article
              key={transaction.title}
              className="surface-card flex items-center justify-between gap-3 p-3 sm:p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{transaction.title}</p>
                <p className="mt-1 truncate text-xs text-ink-muted">{transaction.detail}</p>
              </div>
              <div className="shrink-0 text-left">
                <p className="text-sm font-bold text-brand-700">{transaction.amount}</p>
                <p className="mt-1 text-[10px] text-ink-muted">{transaction.kind}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-xl bg-neutral-100 p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <CircleHelp size={18} className="text-brand-700" />
            كيف تضمن محفظة رنتر كونكت حقك؟
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
            <li className="flex gap-2">
              <ShieldCheck size={17} className="mt-1 shrink-0 text-emerald-700" />
              لا تُشارك بيانات التواصل إلا بعد موافقة المالك.
            </li>
            <li className="flex gap-2">
              <RefreshCw size={17} className="mt-1 shrink-0 text-emerald-700" />
              تعود النقاط تلقائياً إذا انتهت المهلة دون استجابة.
            </li>
            <li className="flex gap-2">
              <LockKeyhole size={17} className="mt-1 shrink-0 text-emerald-700" />
              لا تظهر بياناتك للطرف الآخر قبل الموافقة.
            </li>
          </ul>
        </section>

        <Link
          href="/properties"
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 font-semibold text-white"
        >
          اكتشف العقارات المتاحة
          <ArrowLeft size={17} />
        </Link>
      </main>
    </div>
  );
}
