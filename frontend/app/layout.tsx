import type { Metadata } from 'next';
import type { ReactElement, ReactNode } from 'react';

import 'leaflet/dist/leaflet.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'رنتر كونكت | سكن مباشر بلا وسيط',
  description: 'اكتشف عقارات للإيجار وتواصل مباشرة مع المالك بطلبات آمنة وخاصة.',
  icons: {
    icon: '/rentr-connect-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
