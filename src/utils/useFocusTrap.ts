import { useEffect, type RefObject } from 'react';

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(focusableSelectors)).filter((element) => {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.offsetParent === null && element.getClientRects().length === 0) return false;
    return true;
  });

export const useFocusTrap = (
  active: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onEscape?: () => void,
): void => {
  useEffect(() => {
    if (!active) {
      return;
    }

    const container = containerRef.current;
    if (container && typeof window !== 'undefined') {
      window.setTimeout(() => {
        const focusable = getFocusableElements(container);
        if (focusable.length > 0) {
          const activeElement = document.activeElement as HTMLElement | null;
          if (!activeElement || !container.contains(activeElement)) {
            focusable[0].focus();
          }
        }
      }, 0);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const targetContainer = containerRef.current;
      if (!targetContainer) {
        return;
      }

      const focusable = getFocusableElements(targetContainer);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (!activeElement || activeElement === first || !targetContainer.contains(activeElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, containerRef, onEscape]);
};
