import { useCallback, useEffect, useState } from 'react';
import type { AppRoute } from '@shared/types';
import { rememberScrollPosition } from '@shared/utils/navigationLifecycle';
import { getInitialLocation, parseLocation, routeToPath, type HistoryState } from './appRoutes';

type UseAppNavigationParams = {
  initialRoute?: AppRoute;
  initialSlug?: string | null;
};

type NavigateOptions = {
  replace?: boolean;
  sourceRoute?: AppRoute;
};

export const useAppNavigation = ({ initialRoute, initialSlug }: UseAppNavigationParams) => {
  const [route, setRoute] = useState<AppRoute>(() =>
    initialRoute !== undefined ? initialRoute : getInitialLocation().route,
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    initialSlug !== undefined ? initialSlug : getInitialLocation().slug,
  );

  const navigateTo = useCallback(
    (next: AppRoute, options: NavigateOptions = {}) => {
      rememberScrollPosition();
      const path = typeof window !== 'undefined' ? routeToPath(next) : '';
      const shouldSkip =
        !options.replace &&
        route === next &&
        !activeSlug &&
        (typeof window === 'undefined' || window.location.pathname === path);

      if (shouldSkip) {
        return;
      }

      setRoute(next);
      setActiveSlug(null);

      if (typeof window !== 'undefined') {
        const state: HistoryState = { route: next };
        if (options.sourceRoute) {
          state.sourceRoute = options.sourceRoute;
        }
        if (options.replace) {
          window.history.replaceState(state, '', path);
        } else if (window.location.pathname !== path) {
          window.history.pushState(state, '', path);
        } else {
          window.history.replaceState(state, '', path);
        }
      }
    },
    [activeSlug, route],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromLocation = (event?: PopStateEvent) => {
      const state =
        (event?.state as HistoryState | undefined) ??
        (window.history.state as HistoryState | undefined);
      const { route: nextRoute, slug } = parseLocation(
        window.location.pathname,
        state,
        window.location.search,
      );
      setRoute(nextRoute);
      setActiveSlug(slug);
    };

    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  return {
    route,
    setRoute,
    activeSlug,
    setActiveSlug,
    navigateTo,
  };
};
