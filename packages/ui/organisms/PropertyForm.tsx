'use client';

import type { ChangeEvent, FormEvent, FormEventHandler, ReactElement } from 'react';

import { Button, Input, Textarea } from '../atoms';
import { FormField } from '../molecules';
import { cn } from '../utils/cn';

export interface PropertyFormValues {
  propertyType: string;
  community: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  furnishing: string;
  rent: string;
  availability: string;
  description: string;
  address: string;
  additionalInfo: string;
}

export type PropertyFormFieldName = keyof PropertyFormValues;

export interface PropertyMapPin {
  latitude: number;
  longitude: number;
}

export interface PropertyFormProps {
  values: PropertyFormValues;
  errors?: Partial<Record<PropertyFormFieldName, string>>;
  imageError?: string;
  selectedImageNames?: readonly string[];
  mapPin: PropertyMapPin | null;
  onValueChange: (field: PropertyFormFieldName, value: string) => void;
  onImagesChange: (files: File[]) => void;
  onMapPinRequest?: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

interface MapPinPlaceholderProps {
  selected: boolean;
  onRequest?: () => void;
}

function MapPinPlaceholder({ selected, onRequest }: MapPinPlaceholderProps): ReactElement {
  return (
    <fieldset className="rounded-lg border border-border bg-neutral-50 p-4">
      <legend className="px-1 text-sm font-medium text-ink">موقع العقار</legend>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">
            {selected ? 'تم تحديد موقع العقار' : 'لم يتم تحديد موقع العقار'}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            نحتفظ بالموقع الدقيق بشكل خاص، ولا نعرض للعامة سوى الحي أو المنطقة.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={onRequest} disabled={!onRequest}>
          حدد الموقع على الخريطة
        </Button>
      </div>
    </fieldset>
  );
}

export function PropertyForm({
  values,
  errors,
  imageError,
  selectedImageNames,
  mapPin,
  onValueChange,
  onImagesChange,
  onMapPinRequest,
  onSubmit,
  onCancel,
  submitLabel = 'حفظ العقار',
  isSubmitting = false,
  className,
}: PropertyFormProps): ReactElement {
  const imageHelperText = selectedImageNames?.length
    ? `تم اختيار ${selectedImageNames.length} صورة`
    : 'أضف صوراً واضحة للعقار (حتى 12 صورة، 5 ميجابايت للصورة).';
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="نوع العقار"
          {...(errors?.propertyType ? { error: errors.propertyType } : {})}
        >
          <select
            name="propertyType"
            value={values.propertyType}
            onChange={(event) => onValueChange('propertyType', event.currentTarget.value)}
            className="min-h-11 w-full rounded-md border border-border-strong bg-white px-3 text-right text-base text-ink"
            required
          >
            <option value="">اختر نوع العقار</option>
            <option value="apartment">شقة</option>
            <option value="house">منزل</option>
            <option value="studio">استوديو</option>
            <option value="room">غرفة</option>
            <option value="other">أخرى</option>
          </select>
        </FormField>
        <FormField
          label="الحي أو المنطقة"
          {...(errors?.community ? { error: errors.community } : {})}
        >
          <Input
            name="community"
            required
            value={values.community}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('community', event.currentTarget.value)
            }
            placeholder="مثال: التجمع الخامس، المعادي"
          />
        </FormField>
        <FormField label="غرف النوم" {...(errors?.bedrooms ? { error: errors.bedrooms } : {})}>
          <Input
            type="number"
            name="bedrooms"
            min={0}
            step={1}
            required
            value={values.bedrooms}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('bedrooms', event.currentTarget.value)
            }
          />
        </FormField>
        <FormField label="الحمامات" {...(errors?.bathrooms ? { error: errors.bathrooms } : {})}>
          <Input
            type="number"
            name="bathrooms"
            min={0}
            step={1}
            required
            value={values.bathrooms}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('bathrooms', event.currentTarget.value)
            }
          />
        </FormField>
        <FormField label="المساحة بالمتر المربع" {...(errors?.area ? { error: errors.area } : {})}>
          <Input
            type="number"
            name="area"
            min={0}
            step="any"
            required
            value={values.area}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('area', event.currentTarget.value)
            }
          />
        </FormField>
        <FormField
          label="حالة التأثيث"
          {...(errors?.furnishing ? { error: errors.furnishing } : {})}
        >
          <select
            name="furnishing"
            value={values.furnishing}
            onChange={(event) => onValueChange('furnishing', event.currentTarget.value)}
            className="min-h-11 w-full rounded-md border border-border-strong bg-white px-3 text-right text-base text-ink"
            required
          >
            <option value="">اختر حالة التأثيث</option>
            <option value="furnished">مفروش بالكامل</option>
            <option value="partially-furnished">مفروش جزئياً</option>
            <option value="unfurnished">غير مفروش</option>
            <option value="unknown">غير محدد</option>
          </select>
        </FormField>
        <FormField
          label="الإيجار الشهري بالجنيه المصري"
          {...(errors?.rent ? { error: errors.rent } : {})}
        >
          <Input
            type="number"
            name="rent"
            min={0}
            step="any"
            required
            value={values.rent}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('rent', event.currentTarget.value)
            }
          />
        </FormField>
        <FormField
          label="متاح من تاريخ"
          {...(errors?.availability ? { error: errors.availability } : {})}
        >
          <Input
            type="date"
            name="availability"
            required
            value={values.availability}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('availability', event.currentTarget.value)
            }
          />
        </FormField>
      </div>

      <FormField label="وصف العقار" {...(errors?.description ? { error: errors.description } : {})}>
        <Textarea
          name="description"
          required
          value={values.description}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onValueChange('description', event.currentTarget.value)
          }
        />
      </FormField>

      <FormField
        label="صور العقار"
        helperText={imageHelperText}
        {...(imageError ? { error: imageError } : {})}
      >
        <Input
          type="file"
          name="images"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onImagesChange(Array.from(event.currentTarget.files ?? []))
          }
        />
      </FormField>

      <MapPinPlaceholder
        selected={mapPin !== null}
        {...(onMapPinRequest ? { onRequest: onMapPinRequest } : {})}
      />

      <FormField label="العنوان الدقيق" {...(errors?.address ? { error: errors.address } : {})}>
        <Input
          name="address"
          value={values.address}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onValueChange('address', event.currentTarget.value)
          }
          helperText="العنوان الدقيق خاص ولن يظهر في الإعلان العام."
        />
      </FormField>

      <FormField
        label="معلومات إضافية"
        {...(errors?.additionalInfo ? { error: errors.additionalInfo } : {})}
      >
        <Textarea
          name="additionalInfo"
          value={values.additionalInfo}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onValueChange('additionalInfo', event.currentTarget.value)
          }
        />
      </FormField>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            إلغاء
          </Button>
        ) : null}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
