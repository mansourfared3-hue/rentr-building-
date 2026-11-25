'use client';

import { useEffect, useState, type FormEventHandler, type ReactElement } from 'react';
import Link from 'next/link';

import {
  TenantProfileForm,
  type TenantProfileFieldName,
  type TenantProfileFormValues,
} from '@rentr/ui/organisms';
import type { TenantProfile } from '@rentr/types';
import { apiRequest } from '@/lib/api-client';

function translateProfileError(value: string): string {
  const message = value.toLowerCase();
  if (message.includes('access token')) return 'سجّل الدخول لحفظ ملفك الشخصي.';
  return 'تعذر تحميل الملف الشخصي أو حفظه. تحقق من اتصالك وحاول مرة أخرى.';
}

export interface TenantProfileFormDemoProps {
  initialValues: TenantProfileFormValues;
}

export function TenantProfileFormDemo({ initialValues }: TenantProfileFormDemoProps): ReactElement {
  const [values, setValues] = useState(initialValues);
  const [notice, setNotice] = useState('');
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void apiRequest<TenantProfile | null>('/profiles/me')
      .then((profile) => {
        if (!profile) return;
        setValues({
          name: profile.name,
          occupation: profile.occupation,
          isStudent: profile.isStudent,
          livingArrangement: profile.livingArrangement,
          familySize: String(profile.familySize),
          moveInDate: profile.moveInDate,
          introduction: profile.introduction,
        });
      })
      .catch((caught: unknown) => {
        const message = caught instanceof Error ? caught.message : '';
        setRequiresSignIn(message.toLowerCase().includes('access token'));
        setNotice(translateProfileError(message));
      });
  }, []);

  const handleValueChange = <K extends TenantProfileFieldName>(
    field: K,
    value: TenantProfileFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setNotice('');
    setRequiresSignIn(false);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async () => {
    setIsSubmitting(true);
    setNotice('');
    try {
      await apiRequest('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify({ ...values, familySize: Number(values.familySize) }),
      });
      setNotice('تم حفظ الملف الشخصي بنجاح.');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setRequiresSignIn(message.toLowerCase().includes('access token'));
      setNotice(translateProfileError(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <TenantProfileForm
        values={values}
        onValueChange={handleValueChange}
        onSubmit={handleSubmit}
        submitLabel="حفظ الملف الشخصي"
        isSubmitting={isSubmitting}
      />
      {notice ? (
        <p role="status" className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {notice}
          {requiresSignIn ? (
            <Link href="/login?next=%2Fprofile" className="ml-2 font-semibold underline">
              تسجيل الدخول
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
