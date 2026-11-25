import { useId, type ComponentPropsWithoutRef, type ReactElement } from 'react';

import { cn } from '../utils/cn';

export interface TextareaProps extends Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'className' | 'id'
> {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
}

export function Textarea({
  className,
  error,
  helperText,
  id,
  label,
  rows = 4,
  'aria-describedby': ariaDescribedBy,
  ...textareaProps
}: TextareaProps): ReactElement {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const helperId = `${textareaId}-helper`;
  const errorId = `${textareaId}-error`;
  const describedBy = [
    ariaDescribedBy,
    helperText ? helperId : undefined,
    error ? errorId : undefined,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <textarea
        {...textareaProps}
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : textareaProps['aria-invalid']}
        aria-describedby={describedBy || undefined}
        className={cn(
          'block min-h-24 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink',
          'shadow-soft placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500',
          'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-ink-subtle',
          error ? 'border-danger-600 focus:border-danger-600 focus:ring-danger-600' : '',
          className,
        )}
      />
      {helperText ? (
        <p id={helperId} className="mt-1.5 text-sm text-ink-muted">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
