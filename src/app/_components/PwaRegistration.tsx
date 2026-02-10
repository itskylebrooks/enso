'use client';

import { useEffect } from 'react';

const UPDATE_INTERVAL_MS = 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PwaWindow = Window & {
  __ensoDeferredPrompt?: BeforeInstallPromptEvent | null;
};

export const PwaRegistration = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isLocalDevHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const canRegisterServiceWorker =
      'serviceWorker' in navigator && (isProduction || isLocalDevHost);

    let updateIntervalId: number | undefined;
    let hasRefreshed = false;

    const handleControllerChange = () => {
      // In development, avoid force-reloading on controller updates to keep
      // hot-reload workflows stable.
      if (!isProduction) {
        return;
      }
      if (hasRefreshed) {
        return;
      }
      hasRefreshed = true;
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              installingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        if (isProduction) {
          updateIntervalId = window.setInterval(() => {
            void registration.update();
          }, UPDATE_INTERVAL_MS);
        }
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const installEvent = event as BeforeInstallPromptEvent;
      (window as PwaWindow).__ensoDeferredPrompt = installEvent;
      window.dispatchEvent(new Event('enso:pwa-install-available'));
    };

    const handleAppInstalled = () => {
      (window as PwaWindow).__ensoDeferredPrompt = null;
      window.dispatchEvent(new Event('enso:pwa-installed'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (canRegisterServiceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      void registerServiceWorker();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (canRegisterServiceWorker) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
      if (updateIntervalId !== undefined) {
        window.clearInterval(updateIntervalId);
      }
    };
  }, []);

  return null;
};
