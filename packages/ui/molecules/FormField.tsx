import { cloneElement, type ReactElement } from 'react';

import { cn } from '../utils/cn';

export interface FormFieldControlProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export type FormFieldControl = ReactElement<FormFieldControlProps>;

export interface FormFieldProps<T extends FormFieldControlProps = FormFieldControlProps> {
  label: string;
  children: ReactElement<T>;
  error?: string;
  helperText?: string;
  className?: string;
}

export function FormField<T extends FormFieldControlProps>({
  children,
  className,
  error,
  helperText,
  label,
}: FormFieldProps<T>): ReactElement {
  const controlProps = {
    ...children.props,
    label,
    ...(error === undefined ? {} : { error }),
    ...(helperText === undefined ? {} : { helperText }),
  } as T;
  const control = cloneElement(children, controlProps);

  return <div className={cn('w-full', className)}>{control}</div>;
}
