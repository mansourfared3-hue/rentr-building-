import type { ReactElement, ReactNode } from 'react';

import { SiteHeader } from '../organisms';

export interface PageTemplateProps {
  brand: string;
  children: ReactNode;
}

export function PageTemplate({ brand, children }: PageTemplateProps): ReactElement {
  return (
    <>
      <SiteHeader brand={brand} />
      <main>{children}</main>
    </>
  );
}
