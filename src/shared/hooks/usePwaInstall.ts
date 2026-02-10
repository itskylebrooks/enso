import type { Copy } from '@shared/constants/i18n';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PwaWindow = Window & {
  __ensoDeferredPrompt?: BeforeInstallPromptEvent | null;
};

const getStoredDeferredPrompt = (): BeforeInstallPromptEvent | null => {
  if (typeof window === 'undefined') {
    return deferredPrompt;
  }
  return (window as PwaWindow).__ensoDeferredPrompt ?? deferredPrompt;
};

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Check for Safari but not Chrome (Chrome also has Safari in UA)
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

function canAttemptBrowserInstall(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return window.isSecureContext && 'serviceWorker' in navigator;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const usePwaInstall = (copy: Copy) => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    getStoredDeferredPrompt(),
  );
  const [isInstallable, setIsInstallable] = useState(Boolean(getStoredDeferredPrompt()));
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const [isSafariDesktop, setIsSafariDesktop] = useState(false);

  useEffect(() => {
    // Check device type
    const iosDevice = isIOS();
    const androidDevice = isAndroid();
    const safariDesktop = isSafari() && !iosDevice;
    setIsIosDevice(iosDevice);
    setIsAndroidDevice(androidDevice);
    setIsSafariDesktop(safariDesktop);

    // Check if already installed
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    // iOS/Safari desktop install flows are browser-menu based, not beforeinstallprompt.
    if (iosDevice || safariDesktop) {
      setIsInstallable(true);
      return;
    }

    const existingPrompt = getStoredDeferredPrompt();
    const supportsBrowserInstallFlow = canAttemptBrowserInstall();
    if (existingPrompt) {
      deferredPrompt = existingPrompt;
      setInstallPromptEvent(existingPrompt);
      setIsInstallable(true);
    } else {
      // Chromium may delay `beforeinstallprompt` until engagement criteria are met.
      // Keep the action enabled so users can still use browser-menu install paths.
      setIsInstallable(supportsBrowserInstallFlow);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      deferredPrompt = event;
      (window as PwaWindow).__ensoDeferredPrompt = event;
      setInstallPromptEvent(event);
      setIsInstallable(true);
    };

    const handleInstallAvailable = () => {
      const prompt = getStoredDeferredPrompt();
      if (!prompt) {
        setIsInstallable(canAttemptBrowserInstall());
        return;
      }
      deferredPrompt = prompt;
      setInstallPromptEvent(prompt);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
      deferredPrompt = null;
      (window as PwaWindow).__ensoDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('enso:pwa-install-available', handleInstallAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('enso:pwa-install-available', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (isIosDevice) {
      alert(copy.installPwaIosInstructions);
      return true;
    }

    if (isSafariDesktop) {
      alert(copy.installPwaSafariInstructions);
      return true;
    }

    const promptToUse = installPromptEvent || getStoredDeferredPrompt();
    if (!promptToUse) {
      alert(copy.installPwaUnavailable);
      return false;
    }

    try {
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPromptEvent(null);
        deferredPrompt = null;
        (window as PwaWindow).__ensoDeferredPrompt = null;
        return true;
      }

      // Clear the saved prompt since it can't be used again
      setInstallPromptEvent(null);
      deferredPrompt = null;
      (window as PwaWindow).__ensoDeferredPrompt = null;
      return false;
    } catch (error) {
      console.error('PWA: Error showing install prompt:', error);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    install,
    isIosDevice,
    isAndroidDevice,
  };
};
