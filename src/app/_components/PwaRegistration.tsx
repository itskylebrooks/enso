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
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let updateIntervalId: number | undefined;
    let hasRefreshed = false;

    const handleControllerChange = () => {
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

        updateIntervalId = window.setInterval(() => {
          void registration.update();
        }, UPDATE_INTERVAL_MS);
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
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    void registerServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (updateIntervalId !== undefined) {
        window.clearInterval(updateIntervalId);
      }
    };
  }, []);

  return null;
};
