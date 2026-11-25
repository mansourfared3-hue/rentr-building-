'use client';

import type { ChangeEvent, FormEvent, FormEventHandler, ReactElement } from 'react';

import { Button, Input, Textarea } from '../atoms';
import { FormField } from '../molecules';
import { cn } from '../utils/cn';

export type LivingArrangement = 'alone' | 'couple' | 'family';

export interface TenantProfileFormValues {
  name: string;
  occupation: string;
  isStudent: boolean;
  livingArrangement: LivingArrangement;
  familySize: string;
  moveInDate: string;
  introduction: string;
}

export type TenantProfileFieldName = keyof TenantProfileFormValues;
export type TenantProfileInputErrorField =
  'name' | 'occupation' | 'familySize' | 'moveInDate' | 'introduction';

export interface TenantProfileFormProps {
  values: TenantProfileFormValues;
  errors?: Partial<Record<TenantProfileInputErrorField, string>>;
  onValueChange: <K extends TenantProfileFieldName>(
    field: K,
    value: TenantProfileFormValues[K],
  ) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancel?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
}

const livingArrangementOptions: readonly { value: LivingArrangement; label: string }[] = [
  { value: 'alone', label: 'بمفردي' },
  { value: 'couple', label: 'زوجان' },
  { value: 'family', label: 'أسرة' },
];

export function TenantProfileForm({
  values,
  errors,
  onValueChange,
  onSubmit,
  onCancel,
  submitLabel = 'حفظ الملف الشخصي',
  isSubmitting = false,
  className,
}: TenantProfileFormProps): ReactElement {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(event);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      <FormField label="الاسم" {...(errors?.name ? { error: errors.name } : {})}>
        <Input
          name="name"
          value={values.name}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onValueChange('name', event.currentTarget.value)
          }
        />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <FormField label="المهنة" {...(errors?.occupation ? { error: errors.occupation } : {})}>
          <Input
            name="occupation"
            value={values.occupation}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('occupation', event.currentTarget.value)
            }
            placeholder="المهنة أو مجال الدراسة"
          />
        </FormField>
        <Button
          type="button"
          variant={values.isStudent ? 'primary' : 'secondary'}
          aria-pressed={values.isStudent}
          onClick={() => onValueChange('isStudent', !values.isStudent)}
          className="sm:mb-0"
        >
          {values.isStudent ? 'طالب' : 'أنا طالب'}
        </Button>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">ترتيب السكن</legend>
        <div role="group" aria-label="ترتيب السكن" className="flex flex-wrap gap-2">
          {livingArrangementOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={values.livingArrangement === option.value ? 'primary' : 'secondary'}
              aria-pressed={values.livingArrangement === option.value}
              onClick={() => onValueChange('livingArrangement', option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="عدد أفراد الأسرة"
          {...(errors?.familySize ? { error: errors.familySize } : {})}
        >
          <Input
            type="number"
            name="familySize"
            min={1}
            step={1}
            value={values.familySize}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('familySize', event.currentTarget.value)
            }
          />
        </FormField>
        <FormField
          label="موعد الانتقال المتوقع"
          {...(errors?.moveInDate ? { error: errors.moveInDate } : {})}
        >
          <Input
            type="date"
            name="moveInDate"
            value={values.moveInDate}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onValueChange('moveInDate', event.currentTarget.value)
            }
          />
        </FormField>
      </div>

      <FormField
        label="نبذة قصيرة عنك"
        {...(errors?.introduction ? { error: errors.introduction } : {})}
      >
        <Textarea
          name="introduction"
          value={values.introduction}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            onValueChange('introduction', event.currentTarget.value)
          }
          placeholder="اكتب نبذة تعرّف بها نفسك لمالك العقار"
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
