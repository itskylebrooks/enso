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
    const setThemeFavicon = (isDark) => {
      const href = isDark ? '/icons/favicon-dark.svg?v=2' : '/icons/favicon-light.svg?v=2';
      let icon = document.getElementById('theme-favicon');
      if (!icon) {
        icon = document.createElement('link');
        icon.id = 'theme-favicon';
        icon.rel = 'icon';
        icon.type = 'image/svg+xml';
        document.head.appendChild(icon);
      }
      icon.href = href;

      let shortcut = document.getElementById('theme-favicon-shortcut');
      if (!shortcut) {
        shortcut = document.createElement('link');
        shortcut.id = 'theme-favicon-shortcut';
        shortcut.rel = 'shortcut icon';
        shortcut.type = 'image/svg+xml';
        document.head.appendChild(shortcut);
      }
      shortcut.href = href;
    };

    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
    const prefersDark = media ? media.matches : false;
    const stored = window.localStorage.getItem('enso-theme');
    const isDarkTheme = stored ? stored === 'dark' : prefersDark;
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkTheme);
    root.style.colorScheme = isDarkTheme ? 'dark' : 'light';
    setThemeFavicon(prefersDark);

    if (media) {
      media.addEventListener('change', (event) => {
        setThemeFavicon(event.matches);
      });
    }
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
