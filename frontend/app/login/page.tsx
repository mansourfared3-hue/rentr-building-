import type { ReactElement } from 'react';

import { LoginForm } from '@/components/LoginForm';

export default function LoginPage(): ReactElement {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-5 py-12">
      <section className="w-full space-y-6">
        <a href="/properties" className="text-sm font-semibold text-brand-700">
          رنتر كونكت
        </a>
        <div>
          <h1 className="text-3xl font-semibold text-ink"> سجّل الدخول إلى رنتر كونكت</h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            أدخل بريدك الإلكتروني لنرسل إليك رمز تحقق لمرة واحدة.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
