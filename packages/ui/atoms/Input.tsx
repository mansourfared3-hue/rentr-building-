import { useId, type ComponentPropsWithoutRef, type ReactElement } from 'react';

import { cn } from '../utils/cn';

export type InputType = 'text' | 'number' | 'date' | 'file';

export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'className' | 'type'> {
  type?: InputType;
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
}

export function Input({
  className,
  error,
  helperText,
  id,
  label,
  type = 'text',
  'aria-describedby': ariaDescribedBy,
  ...inputProps
}: InputProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
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
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}
      <input
        {...inputProps}
        id={inputId}
        type={type}
        aria-invalid={error ? true : inputProps['aria-invalid']}
        aria-describedby={describedBy || undefined}
        className={cn(
          'block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink',
          'shadow-soft placeholder:text-ink-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500',
          'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-ink-subtle',
          type === 'file'
            ? 'file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-700'
            : '',
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
