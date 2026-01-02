/**
 * Get the initial theme state from the DOM to prevent light mode flash
 */
export const getInitialThemeState = (): boolean => {
  if (typeof document === 'undefined') {
    return false; // SSR fallback
  }
  return document.documentElement.classList.contains('dark');
};
