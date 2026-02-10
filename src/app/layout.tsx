import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PwaRegistration } from './_components/PwaRegistration';
import './globals.css';

const resolveMetadataBase = (): URL => {
  const parseCandidate = (value: string): URL | null => {
    try {
      return new URL(value);
    } catch {
      try {
        return new URL(`https://${value}`);
      } catch {
        return null;
      }
    }
  };

  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (explicitSiteUrl) {
    const parsed = parseCandidate(explicitSiteUrl);
    if (parsed) {
      return parsed;
    }
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) {
    const parsed = parseCandidate(vercelUrl);
    if (parsed) {
      return parsed;
    }
  }

  return new URL('http://localhost:3000');
};

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
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

const pwaInstallPromptScript = `
(() => {
  if (typeof window === 'undefined' || window.__ensoPwaPromptInit) {
    return;
  }

  window.__ensoPwaPromptInit = true;
  window.__ensoDeferredPrompt = window.__ensoDeferredPrompt ?? null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    window.__ensoDeferredPrompt = event;
    window.dispatchEvent(new Event('enso:pwa-install-available'));
  });

  window.addEventListener('appinstalled', () => {
    window.__ensoDeferredPrompt = null;
    window.dispatchEvent(new Event('enso:pwa-installed'));
  });
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
        <script dangerouslySetInnerHTML={{ __html: pwaInstallPromptScript }} />
      </head>
      <body suppressHydrationWarning>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
