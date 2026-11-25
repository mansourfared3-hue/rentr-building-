import type { ReactElement } from 'react';

import { AppNavbar } from '@/components/AppNavbar';
import { PropertyFormDemo } from '@/components/PropertyFormDemo';
import { PropertyFormTemplate } from '@rentr/ui/templates';
import type { PropertyFormValues } from '@rentr/ui/organisms';

const emptyProperty: PropertyFormValues = {
  propertyType: '',
  community: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  furnishing: '',
  rent: '',
  availability: '',
  description: '',
  address: '',
  additionalInfo: '',
};

export default function NewPropertyPage(): ReactElement {
  return (
    <PropertyFormTemplate
      navigation={<AppNavbar initialRole="owner" />}
      title="أضف عقارك"
      description="أضف التفاصيل التي يحتاج إليها الباحثون عن سكن، وارفق الصور وحدد موقع العقار بدقة قبل نشر الإعلان."
      aside={
        <div className="rounded-xl border border-border bg-brand-50 p-5">
          <h2 className="font-semibold text-ink">خصوصية الموقع</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            أضف العنوان الكامل وحدد الموقع على الخريطة. لن يظهر في الإعلان العام سوى الحي أو المنطقة
            التقريبية.
          </p>
        </div>
      }
    >
      <PropertyFormDemo initialValues={emptyProperty} />
    </PropertyFormTemplate>
  );
}
