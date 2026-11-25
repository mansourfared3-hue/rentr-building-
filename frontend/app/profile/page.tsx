import type { ReactElement } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';

import { AppNavbar } from '@/components/AppNavbar';
import { TenantProfileFormDemo } from '@/components/TenantProfileFormDemo';
import type { TenantProfileFormValues } from '@rentr/ui/organisms';

const defaultProfileValues: TenantProfileFormValues = {
  name: '',
  occupation: '',
  isStudent: false,
  livingArrangement: 'alone',
  familySize: '1',
  moveInDate: new Date().toISOString().slice(0, 10),
  introduction: '',
};

export default function ProfilePage(): ReactElement {
  return (
    <div className="min-h-screen">
      <AppNavbar initialRole="tenant" />
      <main className="page-shell max-w-4xl space-y-5 py-5 sm:py-8">
        <header className="surface-card flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <UserRound size={26} />
          </span>
          <div>
            <p className="text-xs font-semibold text-brand-700">الملف الشخصي للمستأجر</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">عرّف المالك بنفسك</h1>
            <p className="mt-1 text-sm text-ink-muted">
              يتم حفظ هذه البيانات وإرفاق لقطة ثابتة منها مع كل طلب تواصل ترسله.
            </p>
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="surface-card p-5 sm:p-7" aria-label="نموذج الملف الشخصي">
            <TenantProfileFormDemo initialValues={defaultProfileValues} />
          </section>

          <aside className="surface-card space-y-4 p-5">
            <div className="flex items-center gap-2 text-brand-700">
              <ShieldCheck size={20} />
              <h2 className="font-bold text-ink">خصوصيتك وأمانك</h2>
            </div>
            <p className="text-xs leading-6 text-ink-muted">
              ملفك الشخصي يُمكّن المالك من اتخاذ قرار جاد ومناسب دون كشف رقم هاتفك أو بريدك الإلكتروني في هذه المرحلة.
            </p>
            <div className="rounded-lg bg-neutral-50 p-3 text-xs leading-5 text-ink-muted">
              📌 <strong>معلومة:</strong> يتم أخذ لقطة ثابتة (Snapshot) من بياناتك لحظة إرسال كل طلب تأجير، ولا تتأثر الطلبات السابقة بأي تعديل مستقبلي.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
