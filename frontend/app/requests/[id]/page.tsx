import type { ReactElement } from 'react';

import { AppNavbar } from '@/components/AppNavbar';
import { RequestDetailsClient } from '@/components/RequestDetailsClient';

interface RequestDetailsPageProps {
  params: { id: string };
}

export default function RequestDetailsPage({ params }: RequestDetailsPageProps): ReactElement {
  return (
    <div className="min-h-screen">
      <AppNavbar initialRole="tenant" />
      <main className="page-shell max-w-3xl space-y-5 py-5 sm:py-8">
        <h1 className="text-2xl font-bold text-ink">تفاصيل الطلب</h1>
        <RequestDetailsClient requestId={params.id} />
      </main>
    </div>
  );
}
