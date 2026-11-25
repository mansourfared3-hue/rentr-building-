'use client';

import dynamic from 'next/dynamic';
import { useState, type FormEventHandler, type ReactElement } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  PropertyForm,
  type PropertyFormFieldName,
  type PropertyMapPin,
  type PropertyFormValues,
} from '@rentr/ui/organisms';
import { apiRequest, uploadPropertyImages } from '@/lib/api-client';

const PropertyMapPicker = dynamic(
  () => import('./PropertyMapPicker').then((module) => module.PropertyMapPicker),
  { ssr: false },
);

const propertyTypeLabels: Readonly<Record<string, string>> = {
  apartment: 'شقة',
  house: 'منزل',
  studio: 'استوديو',
  room: 'غرفة',
  other: 'عقار',
};

function translatePropertyError(value: string): string {
  const message = value.toLowerCase();
  if (message.includes('access token')) return 'سجّل الدخول قبل نشر العقار.';
  if (message.includes('owner'))
    return 'تعذر تفعيل حساب المالك. تحقق من بيانات الحساب وحاول مجدداً.';
  if (message.includes('image')) return 'تعذر رفع الصور. تحقق من الملفات المختارة وحاول مرة أخرى.';
  return 'تعذر نشر العقار. تحقق من البيانات المدخلة وحاول مرة أخرى.';
}

export interface PropertyFormDemoProps {
  initialValues: PropertyFormValues;
}

export function PropertyFormDemo({ initialValues }: PropertyFormDemoProps): ReactElement {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [mapPin, setMapPin] = useState<PropertyMapPin | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValueChange = (field: PropertyFormFieldName, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setNotice('');
  };

  const handleImagesChange = (files: File[]): void => {
    setNotice('');
    setSelectedImages([]);
    if (files.length > 12) {
      setNotice('يمكنك اختيار 12 صورة كحد أقصى.');
      return;
    }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setNotice('أنواع الصور المدعومة هي JPEG وPNG وWebP فقط.');
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setNotice('يجب ألا يتجاوز حجم الصورة الواحدة 5 ميجابايت.');
      return;
    }
    setSelectedImages(files);
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = async () => {
    setIsSubmitting(true);
    setNotice('');
    try {
      await apiRequest('/auth/roles/owner', { method: 'POST' });
      const images = await uploadPropertyImages(selectedImages);
      const property = await apiRequest<{ id: string }>('/properties', {
        method: 'POST',
        body: JSON.stringify({
          title: `${propertyTypeLabels[values.propertyType] ?? 'عقار'} في ${values.community}`,
          type: values.propertyType
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/gu, '_'),
          community: values.community,
          bedrooms: Number(values.bedrooms),
          bathrooms: Number(values.bathrooms),
          area: Math.round(Number(values.area)),
          furnishing: values.furnishing
            .trim()
            .toUpperCase()
            .replace(/[\s-]+/gu, '_'),
          rent: Math.round(Number(values.rent)),
          availabilityDate: values.availability,
          description: values.description,
          images,
          approximateLocation: values.community,
          address: values.address,
          additionalInfo: values.additionalInfo,
          ...(mapPin
            ? { latitude: String(mapPin.latitude), longitude: String(mapPin.longitude) }
            : {}),
        }),
      });
      router.push(`/properties/${property.id}`);
      router.refresh();
    } catch (caught) {
      setNotice(translatePropertyError(caught instanceof Error ? caught.message : ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PropertyForm
        values={values}
        mapPin={mapPin}
        selectedImageNames={selectedImages.map((file) => file.name)}
        onValueChange={handleValueChange}
        onImagesChange={handleImagesChange}
        onMapPinRequest={() => setMapPickerOpen(true)}
        onSubmit={handleSubmit}
        submitLabel="انشر العقار"
        isSubmitting={isSubmitting}
      />
      {mapPickerOpen ? (
        <PropertyMapPicker
          value={mapPin}
          onChange={setMapPin}
          onClose={() => setMapPickerOpen(false)}
        />
      ) : null}
      {notice ? (
        <p role="status" className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {notice}
          {notice.toLowerCase().includes('access token') ? (
            <Link href="/login?next=%2Fproperties%2Fnew" className="ml-2 font-semibold underline">
              تسجيل الدخول
            </Link>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
