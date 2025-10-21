const SCROLL_STORAGE_KEY = 'enso:scroll-positions';

let isInitialized = false;
let scrollPositions = new Map<string, number>();

const loadStoredScrollPositions = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (!raw) {
      scrollPositions = new Map();
      return;
    }
    const parsed = JSON.parse(raw) as Array<[string, number]>;
    scrollPositions = new Map(parsed);
  } catch {
    scrollPositions = new Map();
  }
};

const persistScrollPositions = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(Array.from(scrollPositions.entries()));
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage errors (private browsing, quota, etc.)
  }
};

const getLocationKey = (): string => {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
};

let didRestoreFromBFCache = false;

const detectNavigationEntry = (): PerformanceNavigationTiming | PerformanceNavigation | undefined => {
  if (typeof performance === 'undefined') return undefined;
  if ('getEntriesByType' in performance) {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      return entries[0] as PerformanceNavigationTiming;
    }
  }
  if ('navigation' in performance) {
    return (performance as Performance & { navigation?: PerformanceNavigation }).navigation;
  }
  return undefined;
};

const navigationEntry = detectNavigationEntry();

let initialNavigationWasBackForward = navigationEntry?.type === 'back_forward';

const restoreScrollPosition = (): void => {
  if (typeof window === 'undefined') return;
  const key = getLocationKey();
  const stored = scrollPositions.get(key);
  const y = typeof stored === 'number' ? stored : 0;
  window.requestAnimationFrame(() => {
    window.scrollTo(0, y);
  });
};

const cacheCurrentScrollPosition = (): void => {
  if (typeof window === 'undefined') return;
  const key = getLocationKey();
  scrollPositions.set(key, window.scrollY);
  persistScrollPositions();
};

const handlePageHide = (): void => {
  cacheCurrentScrollPosition();
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.add('suppress-transitions');
  }
};

const handlePageShow = (event: PageTransitionEvent): void => {
  didRestoreFromBFCache = event.persisted;
  if (event.persisted) {
    initialNavigationWasBackForward = true;
  }

  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.remove('suppress-transitions');
  }

  restoreScrollPosition();
};

export const setupNavigationLifecycle = (): void => {
  if (typeof window === 'undefined' || isInitialized) {
    return;
  }

  isInitialized = true;
  loadStoredScrollPositions();

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('pageshow', handlePageShow);

  // Capture the first scroll position once the app hydrates so back navigations have a baseline.
  window.requestAnimationFrame(cacheCurrentScrollPosition);
};

export const cameFromBackForwardNavigation = (): boolean => initialNavigationWasBackForward || didRestoreFromBFCache;

export const consumeBFCacheRestoreFlag = (): boolean => {
  const wasRestored = didRestoreFromBFCache;
  didRestoreFromBFCache = false;
  return wasRestored;
};

export const rememberScrollPosition = (): void => {
  cacheCurrentScrollPosition();
};

