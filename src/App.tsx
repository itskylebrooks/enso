import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header';
import { FilterPanel } from './components/filters/FilterPanel';
import { Library } from './components/library/Library';
import { ProgressLists } from './components/progress/ProgressLists';
import { SearchOverlay } from './components/overlay/SearchOverlay';
import { SettingsModal } from './components/settings/SettingsModal';
import { TechniquePage } from './components/technique/TechniquePage';
import { Footer } from './components/ui/Footer';
import { Toast } from './components/ui/Toast';
import { MobileFilters } from './components/ui/MobileFilters';
import { HomePage } from './components/home/HomePage';
import { AboutPage } from './components/home/AboutPage';
import { BasicsPage } from './components/home/BasicsPage';
import { ConfirmClearModal } from './components/dialogs/ConfirmClearModal';
import { useMotionPreferences } from './components/ui/motion';
import { getCopy } from './constants/i18n';
import {
  clearDB,
  clearThemePreference,
  hasStoredTheme,
  loadDB,
  loadLocale,
  loadTheme,
  saveDB,
  saveLocale,
  saveTheme,
} from './services/storageService';
import type { AppRoute, DB, Filters, Locale, Progress, Technique, Theme } from './types';
import { gradeOrder } from './utils/grades';
import { unique, upsert } from './utils/array';

const defaultFilters: Filters = {};

type HistoryState = {
  route?: AppRoute;
  slug?: string;
};

const routeToPath = (route: AppRoute): string => {
  switch (route) {
    case 'home':
      return '/';
    case 'about':
      return '/about';
    case 'basics':
      return '/basics';
    case 'library':
    case 'progress':
      return `/${route}`;
    default:
      return '/';
  }
};

const getSlugFromPath = (pathname: string): string | null => {
  const match = /^\/technique\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const parseLocation = (
  pathname: string,
  state?: HistoryState,
): { route: AppRoute; slug: string | null } => {
  if (pathname.startsWith('/technique/')) {
    const slug = getSlugFromPath(pathname);
    const fallbackRoute = state?.route ?? 'library';
    return { route: fallbackRoute, slug };
  }

  if (pathname === '/progress') {
    return { route: 'progress', slug: null };
  }

  if (pathname === '/library') {
    return { route: 'library', slug: null };
  }

  if (pathname === '/about') {
    return { route: 'about', slug: null };
  }

  if (pathname === '/basics') {
    return { route: 'basics', slug: null };
  }

  return { route: 'home', slug: null };
};

const getInitialLocation = (): { route: AppRoute; slug: string | null } => {
  if (typeof window === 'undefined') {
    return { route: 'home', slug: null };
  }

  const state = window.history.state as HistoryState | undefined;
  return parseLocation(window.location.pathname, state);
};

const isEditableElement = (element: EventTarget | null): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const tag = element.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || element.isContentEditable || tag === 'select';
};

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function updateProgressEntry(progress: Progress[], id: string, patch: Partial<Progress>): Progress[] {
  const existing = progress.find((entry) => entry.techniqueId === id);
  const timestamp = Date.now();
  const baseline: Progress = existing ?? {
    techniqueId: id,
    focus: false,
    notNow: false,
    confident: false,
    personalNote: '',
    updatedAt: timestamp,
  };

  const nextEntry: Progress = {
    ...baseline,
    ...patch,
    techniqueId: id,
    updatedAt: timestamp,
  };

  return upsert(progress, (entry) => entry.techniqueId === id, nextEntry);
}

const getSelectableValues = (techniques: Technique[], selector: (technique: Technique) => string | undefined): string[] =>
  unique(
    techniques
      .map(selector)
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .sort(),
  );

function applyFilters(techniques: Technique[], filters: Filters): Technique[] {
  return techniques.filter((technique) => {
    if (filters.category && technique.category !== filters.category) return false;
    if (filters.attack && technique.attack !== filters.attack) return false;
    if (filters.stance && technique.stance !== filters.stance) return false;
    if (filters.weapon && technique.weapon !== filters.weapon) return false;
    if (filters.level && technique.level !== filters.level) return false;
    return true;
  });
}

function useKeyboardShortcuts(onSearch: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (isEditableElement(event.target)) {
        if ((event.metaKey || event.ctrlKey) && key === 'k') {
          event.preventDefault();
          onSearch();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        onSearch();
      } else if (key === '/') {
        event.preventDefault();
        onSearch();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearch]);
}

export default function App(): ReactElement {
  const [locale, setLocale] = useState<Locale>(() => loadLocale());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [hasManualTheme, setHasManualTheme] = useState<boolean>(() => hasStoredTheme());
  const [db, setDB] = useState<DB>(() => loadDB());
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [route, setRoute] = useState<AppRoute>(() => getInitialLocation().route);
  const [activeSlug, setActiveSlug] = useState<string | null>(() => getInitialLocation().slug);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const copy = getCopy(locale);
  const { pageMotion } = useMotionPreferences();
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const navigateTo = useCallback(
    (next: AppRoute, options: { replace?: boolean } = {}) => {
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

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      if (typeof window !== 'undefined') {
        if (toastTimeoutRef.current) {
          window.clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = window.setTimeout(() => {
          setToast(null);
          toastTimeoutRef.current = null;
        }, 2400);
      }
    },
    [],
  );

  useEffect(
    () => () => {
      if (toastTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(toastTimeoutRef.current);
      }
    },
    [],
  );

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        searchTriggerRef.current?.focus();
      }, 0);
    }
  }, []);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    setConfirmClearOpen(false);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        settingsTriggerRef.current?.focus();
      }, 0);
    }
  }, []);

  const handleRequestClear = useCallback(() => {
    setConfirmClearOpen(true);
  }, []);

  const handleCancelClear = useCallback(() => {
    setConfirmClearOpen(false);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        settingsClearButtonRef.current?.focus();
      }, 0);
    }
  }, []);

  const handleConfirmClear = useCallback(() => {
    setDB(clearDB());
    handleCancelClear();
    showToast(copy.toastDataCleared);
  }, [copy.toastDataCleared, handleCancelClear, setDB, showToast]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (hasManualTheme) {
      saveTheme(theme);
    } else {
      clearThemePreference();
    }
  }, [hasManualTheme, theme]);

  useEffect(() => {
    saveLocale(locale);
  }, [locale]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromLocation = (event?: PopStateEvent) => {
      const state = (event?.state as HistoryState | undefined) ?? (window.history.state as HistoryState | undefined);
      const { route: nextRoute, slug } = parseLocation(window.location.pathname, state);
      setRoute(nextRoute);
      setActiveSlug(slug);
    };

    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  useKeyboardShortcuts(openSearch);

  useEffect(() => {
    if (hasManualTheme || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      setTheme(media.matches ? 'dark' : 'light');
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [hasManualTheme]);

  const categories = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.category),
    [db.techniques],
  );
  const attacks = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.attack),
    [db.techniques],
  );
  const stances = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.stance),
    [db.techniques],
  );
  const weapons = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.weapon),
    [db.techniques],
  );

  const filteredTechniques = useMemo(
    () => applyFilters(db.techniques, filters),
    [db.techniques, filters],
  );

  const currentTechnique = useMemo(
    () => (activeSlug ? db.techniques.find((technique) => technique.slug === activeSlug) ?? null : null),
    [db.techniques, activeSlug],
  );

  const currentProgress = useMemo(
    () => (currentTechnique ? db.progress.find((entry) => entry.techniqueId === currentTechnique.id) ?? null : null),
    [db.progress, currentTechnique],
  );

  const updateProgress = (id: string, patch: Partial<Progress>): void => {
    setDB((prev) => ({
      ...prev,
      progress: updateProgressEntry(prev.progress, id, patch),
    }));
  };

  const handleLocaleChange = (next: Locale): void => {
    setLocale(next);
  };

  const handleThemeChange = (next: Theme | 'system'): void => {
    if (next === 'system') {
      setHasManualTheme(false);
      setTheme(getSystemTheme());
      return;
    }

    setHasManualTheme(true);
    setTheme(next);
  };

  const handleDBChange = (next: DB): void => {
    setDB(next);
  };

  const openTechnique = (slug: string): void => {
    if (!db.techniques.some((technique) => technique.slug === slug)) {
      return;
    }

    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(slug);
      const techniquePath = `/technique/${encodedSlug}`;
      const state: HistoryState = { route, slug };

      if (window.location.pathname !== techniquePath) {
        window.history.pushState(state, '', techniquePath);
      } else {
        window.history.replaceState(state, '', techniquePath);
      }
    }

    setActiveSlug(slug);
  };

  const closeTechnique = (): void => {
    navigateTo(route, { replace: true });
  };

  // focus/confident toggles removed — using bookmark only now

  const toggleBookmark = (technique: Technique, entry: Progress | null): void => {
    const nextBookmarked = !entry?.bookmarked;
    updateProgress(technique.id, {
      bookmarked: nextBookmarked,
    });
  };

  const techniqueNotFound = Boolean(activeSlug) && !currentTechnique;

  const techniqueBackLabel =
    route === 'progress'
      ? copy.backToProgress
      : route === 'home'
      ? copy.backToHome
      : route === 'about'
      ? copy.backToAbout
      : route === 'basics'
      ? copy.backToBasics
      : copy.backToLibrary;

  let mainContent: ReactElement;

  if (currentTechnique) {
    mainContent = (
      <TechniquePage
        technique={currentTechnique}
        progress={currentProgress ?? null}
        copy={copy}
        locale={locale}
        backLabel={techniqueBackLabel}
        onBack={() => closeTechnique()}
        onToggleBookmark={() => toggleBookmark(currentTechnique, currentProgress ?? null)}
      />
    );
  } else if (techniqueNotFound) {
    mainContent = (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4 text-center">
        <p className="text-lg font-semibold">Technique not found.</p>
        <button
          type="button"
          onClick={() => navigateTo('library', { replace: true })}
          className="text-sm underline"
        >
          {copy.backToLibrary}
        </button>
      </div>
    );
  } else if (route === 'home') {
    mainContent = (
      <HomePage
        copy={copy}
        onOpenLibrary={() => navigateTo('library')}
        onViewProgress={() => navigateTo('progress')}
        onViewBasics={() => navigateTo('basics')}
      />
    );
  } else if (route === 'about') {
    mainContent = <AboutPage copy={copy} />;
  } else if (route === 'basics') {
    mainContent = <BasicsPage locale={locale} />;
  } else {
    mainContent = (
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="md:hidden">
          <MobileFilters
            copy={copy}
            locale={locale}
            filters={filters}
            categories={categories}
            attacks={attacks}
            stances={stances}
            weapons={weapons}
            levels={gradeOrder}
            onChange={setFilters}
          />
        </div>
        <div className="grid md:grid-cols-[16rem,1fr] gap-6">
          <aside className="hidden md:block surface border surface-border rounded-2xl p-3 h-max sticky top-20">
            <FilterPanel
              copy={copy}
              locale={locale}
              filters={filters}
              categories={categories}
              attacks={attacks}
              stances={stances}
              weapons={weapons}
              levels={gradeOrder}
              onChange={setFilters}
            />
          </aside>
          <section>
            {route === 'library' && (
              <Library
                copy={copy}
                locale={locale}
                techniques={filteredTechniques}
                progress={db.progress}
                onOpen={openTechnique}
              />
            )}
            {route === 'progress' && (
              <ProgressLists
                copy={copy}
                locale={locale}
                techniques={db.techniques}
                progress={db.progress}
                onOpen={openTechnique}
              />
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col app-bg">
      <Header
        copy={copy}
        route={route}
        onNavigate={navigateTo}
        onSearch={openSearch}
        onSettings={openSettings}
        searchButtonRef={searchTriggerRef}
        settingsButtonRef={settingsTriggerRef}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={currentTechnique ? `technique-${currentTechnique.id}` : route}
          variants={pageMotion.variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageMotion.transition}
          className="flex-1"
        >
          {mainContent}
        </motion.main>
      </AnimatePresence>

      <Footer copy={copy} onNavigate={navigateTo} />

      <AnimatePresence>
        {searchOpen && (
          <SearchOverlay
            key="search-overlay"
            copy={copy}
            locale={locale}
            techniques={db.techniques}
            onClose={closeSearch}
            onOpen={(slug) => {
              openTechnique(slug);
              closeSearch();
            }}
          />
        )}

        {settingsOpen && (
          <SettingsModal
            key="settings-modal"
            copy={copy}
            locale={locale}
            theme={theme}
            isSystemTheme={!hasManualTheme}
            db={db}
            onClose={closeSettings}
            onRequestClear={handleRequestClear}
            onChangeLocale={handleLocaleChange}
            onChangeTheme={handleThemeChange}
            onChangeDB={handleDBChange}
            clearButtonRef={settingsClearButtonRef}
            trapEnabled={!confirmClearOpen}
          />
        )}

        {confirmClearOpen && (
          <ConfirmClearModal
            key="confirm-clear"
            copy={copy}
            onCancel={handleCancelClear}
            onConfirm={handleConfirmClear}
          />
        )}
      </AnimatePresence>

      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}
