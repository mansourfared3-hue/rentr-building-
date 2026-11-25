'use client';

import { useState, type FormEvent, type ReactElement } from 'react';

import { apiRequest } from '@/lib/api-client';

export function LoginForm(): ReactElement {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  function translateError(value: string): string {
    const message = value.toLowerCase();
    if (message.includes('email')) return 'تحقق من عنوان البريد الإلكتروني وحاول مرة أخرى.';
    if (message.includes('code') || message.includes('otp'))
      return 'رمز التحقق غير صحيح أو منتهي الصلاحية.';
    if (message.includes('network') || message.includes('fetch'))
      return 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وحاول مجدداً.';
    return 'تعذر إكمال تسجيل الدخول. حاول مرة أخرى بعد قليل.';
  }

  async function handleRequestCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await apiRequest<{ message: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setCodeRequested(true);
      setNotice(response.message ? 'أرسلنا رمز التحقق إلى بريدك الإلكتروني.' : '');
    } catch (caught) {
      setError(translateError(caught instanceof Error ? caught.message : ''));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiRequest('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const next =
        requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
          ? requestedPath
          : '/properties';
      window.location.assign(next);
    } catch (caught) {
      setError(translateError(caught instanceof Error ? caught.message : ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {!codeRequested ? (
        <form onSubmit={handleRequestCode} className="space-y-4">
          <label className="block space-y-2 text-sm font-medium text-ink">
            البريد الإلكتروني
            <input
              autoComplete="email"
              className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-base"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
          </label>
          <button
            className="min-h-11 w-full rounded-md bg-brand-700 px-4 font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={busy}
          >
            {busy ? 'جارٍ الإرسال…' : 'أرسل رمز التحقق'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <p className="text-sm text-ink-muted">
            أدخل رمز التحقق المكوّن من 6 أرقام الذي أرسلناه إلى {email}.
          </p>
          <label className="block space-y-2 text-sm font-medium text-ink">
            رمز التحقق
            <input
              autoComplete="one-time-code"
              className="min-h-11 w-full rounded-md border border-border bg-white px-3 text-base tracking-[0.2em]"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.currentTarget.value)}
            />
          </label>
          <button
            className="min-h-11 w-full rounded-md bg-brand-700 px-4 font-semibold text-white disabled:opacity-60"
            type="submit"
            disabled={busy}
          >
            {busy ? 'جارٍ التحقق…' : 'تحقق وتابع'}
          </button>
          <button
            className="w-full py-2 text-sm font-medium text-brand-700"
            type="button"
            onClick={() => {
              setCodeRequested(false);
              setNotice('');
            }}
          >
            استخدم بريداً إلكترونياً آخر
          </button>
        </form>
      )}
      {notice ? (
        <p role="status" className="text-sm text-ink-muted">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
