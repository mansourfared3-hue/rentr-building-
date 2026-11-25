'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactElement } from 'react';

import { apiRequest } from '@/lib/api-client';

export function RentalRequestForm({ propertyId }: { propertyId: string }): ReactElement {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [nextStep, setNextStep] = useState<'login' | 'profile' | 'wallet' | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    setNextStep(null);
    try {
      await apiRequest('/requests', {
        method: 'POST',
        body: JSON.stringify({ propertyId, message }),
      });
      setNotice('Request sent. Connects were reserved from your wallet.');
      router.push('/requests');
      router.refresh();
    } catch (caught) {
      const text = caught instanceof Error ? caught.message : 'Request could not be sent.';
      setNotice(
        text.toLowerCase().includes('access token')
          ? 'سجّل الدخول لإرسال طلب التواصل.'
          : text.toLowerCase().includes('tenant profile')
            ? 'أكمل ملفك الشخصي قبل إرسال الطلب.'
            : text.toLowerCase().includes('connect')
              ? 'رصيدك غير كافٍ لإرسال الطلب. اشحن محفظتك أولاً.'
              : 'تعذر إرسال الطلب الآن. يرجى المحاولة مرة أخرى.',
      );
      if (text.toLowerCase().includes('access token')) setNextStep('login');
      if (text.toLowerCase().includes('tenant profile')) setNextStep('profile');
      if (text.toLowerCase().includes('connect')) setNextStep('wallet');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <label className="block space-y-2 text-sm font-semibold text-ink">
        رسالة للمالك <span className="font-normal text-ink-muted">(اختيارية)</span>
        <textarea
          className="field-control min-h-28 w-full resize-y"
          maxLength={2000}
          value={message}
          placeholder="عرّف بنفسك وأخبر المالك بما يهمه عن طلبك..."
          onChange={(event) => setMessage(event.currentTarget.value)}
        />
        <span className="block text-left text-xs font-normal text-ink-subtle" dir="ltr">
          {message.length} / 2000
        </span>
      </label>
      <button
        className="min-h-11 w-full rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        type="submit"
        disabled={busy}
      >
        {busy ? 'جارٍ إرسال الطلب...' : 'أرسل طلب التواصل'}
      </button>
      {notice ? (
        <p role="status" className="text-sm text-ink-muted">
          {notice}{' '}
          {nextStep === 'login' ? (
            <Link
              className="font-semibold text-brand-700 underline"
              href={`/login?next=${encodeURIComponent(`/properties/${propertyId}`)}`}
            >
              تسجيل الدخول
            </Link>
          ) : null}
          {nextStep === 'profile' ? (
            <Link className="font-semibold text-brand-700 underline" href="/profile">
              أكمل ملفك الشخصي
            </Link>
          ) : null}
          {nextStep === 'wallet' ? (
            <Link className="font-semibold text-brand-700 underline" href="/wallet">
              افتح المحفظة
            </Link>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
