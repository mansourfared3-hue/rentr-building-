import type { ReactElement } from 'react';
import { Eye } from 'lucide-react';

export function FeaturePreviewNotice(): ReactElement {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2.5 text-xs leading-5 text-brand-800">
      <Eye size={16} className="mt-0.5 shrink-0" />
      <span>معاينة تصميمية — ستُفعّل هذه الخدمة في مرحلة لاحقة.</span>
    </p>
  );
}
