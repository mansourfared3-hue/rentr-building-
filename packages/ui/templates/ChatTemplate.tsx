import type { ReactElement, ReactNode } from 'react';

export interface ChatTemplateProps {
  navigation: ReactNode;
  backHref: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function ChatTemplate({
  navigation,
  backHref,
  title,
  description,
  children,
}: ChatTemplateProps): ReactElement {
  return (
    <>
      {navigation}
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <a
          href={backHref}
          className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">←</span>
          Back to requests
        </a>
        <header className="mb-5 mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
            Conversation
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">{description}</p>
        </header>
        {children}
      </main>
    </>
  );
}
