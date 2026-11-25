import type { ReactElement } from 'react';

export interface SiteHeaderProps {
  brand: string;
}

export function SiteHeader({ brand }: SiteHeaderProps): ReactElement {
  return (
    <header>
      <a href="/">{brand}</a>
    </header>
  );
}
