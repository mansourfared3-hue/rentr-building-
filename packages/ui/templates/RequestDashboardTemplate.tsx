import type { ReactElement, ReactNode } from 'react';

export interface RequestDashboardTemplateProps {
  navigation: ReactNode;
  title: string;
  description: string;
  summary?: ReactNode;
  children: ReactNode;
}

export function RequestDashboardTemplate({
  navigation,
  title,
  description,
  summary,
  children,
}: RequestDashboardTemplateProps): ReactElement {
  return (
    <>
      {navigation}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Owner dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mt-3 leading-7 text-ink-muted">{description}</p>
          </div>
          {summary}
        </header>
        <section aria-label="Rental requests">{children}</section>
      </main>
    </>
  );
}
