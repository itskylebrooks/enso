import { useEffect } from 'react';

// Lock body scrolling while `locked` is true.
export default function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (typeof document === 'undefined' || !locked) return;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;

    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Lock scroll and compensate for scrollbar
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
    };
  }, [locked]);
}
