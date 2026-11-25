import type { ReactElement } from 'react';

import { AppNavbar } from '@/components/AppNavbar';
import { RequestsClient } from '@/components/RequestsClient';

export default function RequestsPage(): ReactElement {
  return (
    <div className="min-h-screen">
      <AppNavbar initialRole="tenant" />
      <main className="page-shell space-y-6 py-5 sm:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">طلبات التواصل والتأجير</h1>
            <p className="mt-1 text-sm text-ink-muted">
              متابعة حالة طلباتك، وإدارتها، وفتح المحادثات الآمنة للطلبات المقبولة.
            </p>
          </div>
        </header>

        <RequestsClient />
      </main>
    </div>
  );
}
