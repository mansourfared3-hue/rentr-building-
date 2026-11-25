import type { ReactElement, ReactNode } from 'react';

export interface PropertyListTemplateProps {
  navigation: ReactNode;
  title: string;
  description: string;
  listingCount?: number;
  action?: ReactNode;
  children: ReactNode;
}

export function PropertyListTemplate({
  navigation,
  title,
  description,
  listingCount,
  action,
  children,
}: PropertyListTemplateProps): ReactElement {
  return (
    <>
      {navigation}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
              Homes for rent
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-base leading-7 text-ink-muted">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {listingCount !== undefined ? (
              <p className="text-sm text-ink-muted">
                {listingCount} {listingCount === 1 ? 'home' : 'homes'}
              </p>
            ) : null}
            {action}
          </div>
        </header>
        <section aria-label="Rental properties">{children}</section>
      </main>
    </>
  );
}
