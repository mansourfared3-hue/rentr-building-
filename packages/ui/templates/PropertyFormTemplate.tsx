import type { ReactElement, ReactNode } from 'react';

export interface PropertyFormTemplateProps {
  navigation: ReactNode;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function PropertyFormTemplate({
  navigation,
  title,
  description,
  aside,
  children,
}: PropertyFormTemplateProps): ReactElement {
  return (
    <>
      {navigation}
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            بيانات العقار
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-3 leading-7 text-ink-muted">{description}</p>
        </header>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-7">
            {children}
          </section>
          {aside ? <aside className="space-y-4">{aside}</aside> : null}
        </div>
      </main>
    </>
  );
}
