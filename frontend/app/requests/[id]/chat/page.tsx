import Link from 'next/link';
import type { ReactElement } from 'react';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';

import { AppNavbar } from '@/components/AppNavbar';
import { ChatDemo } from '@/components/ChatDemo';

interface RequestChatPageProps {
  params: { id: string };
}

export default function RequestChatPage({ params }: RequestChatPageProps): ReactElement {
  return (
    <div className="min-h-screen">
      <AppNavbar initialRole="tenant" roleInteractive={false} />
      <main className="page-shell max-w-3xl space-y-4 py-5 sm:py-8">
        <Link
          href="/requests"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-muted hover:bg-white hover:text-ink"
        >
          <ArrowLeft size={17} />
          العودة إلى الطلبات
        </Link>

        <header className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-ink">محادثة آمنة ومباشرة</h1>
              <p className="text-xs text-ink-muted">خصوصيتك محمية عبر جدار حماية رنتر كونكت</p>
            </div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <LockKeyhole size={18} />
          </span>
        </header>

        <section className="surface-card p-4 sm:p-6">
          <ChatDemo requestId={params.id} />
        </section>
      </main>
    </div>
  );
}
