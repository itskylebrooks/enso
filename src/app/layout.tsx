import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PwaRegistration } from './_components/PwaRegistration';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://enso.jetzt'),
  title: 'Enso',
  description: 'Aikidō study companion',
  applicationName: 'Enso',
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icons/favicon.ico' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Enso',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'light dark',
};

const themeInitScript = `
(() => {
  try {
    const stored = window.localStorage.getItem('enso-theme');
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
  } catch {
    // noop
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="darkreader-lock" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
