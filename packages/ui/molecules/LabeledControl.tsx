import type { ReactElement, ReactNode } from 'react';

export interface LabeledControlProps {
  htmlFor: string;
  label: string;
  children: ReactNode;
  hint?: string;
}

export function LabeledControl({
  htmlFor,
  label,
  children,
  hint,
}: LabeledControlProps): ReactElement {
  return (
    <div>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <p>{hint}</p> : null}
    </div>
  );
}
