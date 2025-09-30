import { useEffect } from 'react';

// Lock body scrolling while `locked` is true. Preserves scroll position and restores on unlock.
export default function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;

  const body = document.body;

    if (!locked) return;

    const scrollY = window.scrollY || window.pageYOffset;
    // Apply styles to lock scroll and preserve visual position
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';

    return () => {
      // restore
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
