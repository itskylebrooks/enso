import { useEffect, useState } from 'react';
import type { Copy } from '@shared/constants/i18n';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

// Store the event globally to catch it even before the component mounts
let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Catch the event as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('PWA: beforeinstallprompt event captured globally');
  });
}

export const usePwaInstall = (copy: Copy) => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(deferredPrompt);
  const [isInstallable, setIsInstallable] = useState(true); // Default to true, assume installable until proven otherwise
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
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    // On iOS, always show as installable (since they use Share menu)
    if (iosDevice) {
      setIsInstallable(true);
      return;
    }

    // If we already caught the event globally, use it
    if (deferredPrompt) {
      setInstallPromptEvent(deferredPrompt);
      setIsInstallable(true);
      console.log('PWA: Using globally captured install prompt');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      // Save the event for later use
      deferredPrompt = event;
      setInstallPromptEvent(event);
      setIsInstallable(true);
      console.log('PWA: beforeinstallprompt event captured in hook');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
      deferredPrompt = null;
      console.log('PWA: App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    console.log('PWA: Install button clicked');
    console.log('PWA: isIosDevice:', isIosDevice);
    console.log('PWA: isSafariDesktop:', isSafariDesktop);
    console.log('PWA: installPromptEvent:', installPromptEvent);
    console.log('PWA: deferredPrompt:', deferredPrompt);

    // For iOS, show instructions
    if (isIosDevice) {
      alert(copy.installPwaIosInstructions);
      return true;
    }

    // For desktop Safari, show instructions
    if (isSafariDesktop) {
      alert(copy.installPwaSafariInstructions);
      return true;
    }

    // Use the global deferred prompt or the state one
    const promptToUse = installPromptEvent || deferredPrompt;

    // For Android/Chrome
    if (!promptToUse) {
      console.warn('PWA: Install prompt not available. The beforeinstallprompt event may not have fired.');
      console.warn('PWA: This can happen if the app is already installed, or PWA criteria are not met.');
      alert(copy.installPwaUnavailable);
      return false;
    }

    try {
      console.log('PWA: Showing install prompt...');
      // Show the install prompt
      await promptToUse.prompt();

      // Wait for the user to respond to the prompt
      const choiceResult = await promptToUse.userChoice;
      console.log('PWA: User choice:', choiceResult.outcome);

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPromptEvent(null);
        deferredPrompt = null;
        return true;
      }

      // Clear the saved prompt since it can't be used again
      setInstallPromptEvent(null);
      deferredPrompt = null;
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
