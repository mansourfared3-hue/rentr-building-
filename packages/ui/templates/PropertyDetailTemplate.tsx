import type { ReactElement, ReactNode } from 'react';

export interface PropertyDetailTemplateProps {
  navigation: ReactNode;
  backHref: string;
  backLabel?: string;
  children: ReactNode;
}

export function PropertyDetailTemplate({
  navigation,
  backHref,
  backLabel = 'Back to homes',
  children,
}: PropertyDetailTemplateProps): ReactElement {
  return (
    <>
      {navigation}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <a
          href={backHref}
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </a>
        <div className="mt-6">{children}</div>
      </main>
    </>
  );
}
