import { useEffect, useRef, useState } from 'react';

// Detect scroll direction and manage smart sticky visibility on mobile.
export const useSmartSticky = (pathname?: string) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const lastDirection = useRef<'up' | 'down' | null>(null);
  const accumulatedDelta = useRef(0);
  const headerRef = useRef<HTMLElement>(null);
  const isNavigating = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
      if (!event.matches) {
        setIsVisible(true);
      }
    };

    handleMediaChange(mediaQuery);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange);
      };
    }

    mediaQuery.addListener(handleMediaChange);
    return () => {
      mediaQuery.removeListener(handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!(pathname && isMobile) || typeof window === 'undefined') return;

    isNavigating.current = true;
    accumulatedDelta.current = 0;
    lastDirection.current = null;
    lastScrollY.current = 0;

    queueMicrotask(() => {
      setIsVisible(true);
    });

    const timeoutId = window.setTimeout(() => {
      isNavigating.current = false;
      lastScrollY.current = window.scrollY;
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;

    let ticking = false;
    const TOP_THRESHOLD = 40;
    const HIDE_THRESHOLD = 18;
    const SHOW_THRESHOLD = 28;
    const MIN_DELTA = 2;

    const handleScroll = () => {
      if (isNavigating.current || ticking) return;

      window.requestAnimationFrame(() => {
        if (isNavigating.current) {
          ticking = false;
          return;
        }

        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;

        if (Math.abs(delta) < MIN_DELTA) {
          lastScrollY.current = currentScrollY;
          ticking = false;
          return;
        }

        const direction: 'up' | 'down' = delta > 0 ? 'down' : 'up';
        if (direction !== lastDirection.current) {
          accumulatedDelta.current = 0;
          lastDirection.current = direction;
        }

        accumulatedDelta.current += Math.abs(delta);

        if (currentScrollY < TOP_THRESHOLD) {
          setIsVisible(true);
          accumulatedDelta.current = 0;
        } else if (direction === 'down' && accumulatedDelta.current > HIDE_THRESHOLD) {
          setIsVisible(false);
          accumulatedDelta.current = 0;
        } else if (direction === 'up' && accumulatedDelta.current > SHOW_THRESHOLD) {
          setIsVisible(true);
          accumulatedDelta.current = 0;
        }

        lastScrollY.current = currentScrollY;
        ticking = false;
      });

      ticking = true;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return { isVisible, headerRef, isMobile };
};
