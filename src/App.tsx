import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/layout/Header';
import { FilterPanel } from './features/search/components/FilterPanel';
import { Library } from './components/library/Library';
import { BookmarksView } from './features/bookmarks/components/BookmarksView';
import { SearchOverlay } from './features/search/components/SearchOverlay';
import { SettingsModal } from './components/settings/SettingsModal';
import { TechniquePage } from './components/technique/TechniquePage';
import { type CollectionOption } from './components/technique/TechniqueHeader';
import { Toast } from './components/ui/Toast';
import { MobileFilters } from './components/ui/MobileFilters';
import { HomePage } from './features/home';
import { AboutPage } from './components/home/AboutPage';
import { GuidePage } from './components/home/GuidePage';
import { GlossaryPage, GlossaryDetailPage, GlossaryFilterPanel, MobileGlossaryFilters, loadAllTerms } from './features/glossary';
import { ConfirmClearModal } from './shared/components/dialogs/ConfirmClearDialog';
import { useMotionPreferences } from './components/ui/motion';
import { getCopy } from './shared/constants/i18n';
import useLockBodyScroll from './shared/hooks/useLockBodyScroll';
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
} from './shared/services/storageService';
import type { AppRoute, Collection, DB, Filters, GlossaryBookmarkCollection, GlossaryProgress, GlossaryTerm, Locale, Progress, Technique, Theme } from './shared/types';
import { gradeOrder } from './shared/utils/grades';
import { unique, upsert } from './shared/utils/array';
import { buildTechniqueUrl as buildUrl, parseTechniquePath } from './utils/urls';

const defaultFilters: Filters = {};

type SelectedCollectionId = 'all' | 'ungrouped' | string;

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

type HistoryState = {
  route?: AppRoute;
  slug?: string;
  trainerId?: string;
  entry?: 'irimi' | 'tenkan';
};

const routeToPath = (route: AppRoute): string => {
  switch (route) {
    case 'home':
      return '/';
    case 'about':
      return '/about';
    case 'guide':
      return '/guide';
    case 'library':
    case 'bookmarks':
    case 'glossary':
      return `/${route}`;
    default:
      return '/';
  }
};

export const buildTechniqueUrl = buildUrl;

type TechniqueParams = {
  slug: string;
  trainerId?: string;
  entry?: 'irimi' | 'tenkan';
};



const getGlossarySlugFromPath = (pathname: string): string | null => {
  const match = /^\/glossary\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const parseLocation = (
  pathname: string,
  state?: HistoryState,
): { route: AppRoute; slug: string | null; techniqueParams?: TechniqueParams } => {
  if (pathname.startsWith('/technique/')) {
    const techniqueParams = parseTechniquePath(pathname);
    if (techniqueParams) {
      const fallbackRoute = state?.route ?? 'library';
      return { route: fallbackRoute, slug: techniqueParams.slug, techniqueParams };
    }
  }

  if (pathname.startsWith('/glossary/')) {
    const slug = getGlossarySlugFromPath(pathname);
    return { route: 'glossary', slug };
  }

  if (pathname === '/bookmarks') {
    return { route: 'bookmarks', slug: null };
  }

  if (pathname === '/library') {
    return { route: 'library', slug: null };
  }

  if (pathname === '/glossary') {
    return { route: 'glossary', slug: null };
  }

  if (pathname === '/about') {
    return { route: 'about', slug: null };
  }

  if (pathname === '/guide') {
    return { route: 'guide', slug: null };
  }

  // Backwards compatibility for old /basics URL
  if (pathname === '/basics') {
    return { route: 'guide', slug: null };
  }

  return { route: 'home', slug: null };
};

const getInitialLocation = (): { route: AppRoute; slug: string | null; techniqueParams?: TechniqueParams } => {
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
    bookmarked: false,
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

function updateGlossaryProgressEntry(glossaryProgress: GlossaryProgress[], termId: string, patch: Partial<GlossaryProgress>): GlossaryProgress[] {
  const existing = glossaryProgress.find((entry) => entry.termId === termId);
  const timestamp = Date.now();
  const baseline: GlossaryProgress = existing ?? {
    termId,
    bookmarked: false,
    updatedAt: timestamp,
  };

  const nextEntry: GlossaryProgress = {
    ...baseline,
    ...patch,
    termId,
    updatedAt: timestamp,
  };

  return upsert(glossaryProgress, (entry) => entry.termId === termId, nextEntry);
}

const getGlossaryCollectionOptions = (
  collections: Collection[],
  glossaryBookmarkCollections: GlossaryBookmarkCollection[],
  termId: string,
): CollectionOption[] => {
  const termCollectionIds = new Set(
    glossaryBookmarkCollections
      .filter((entry) => entry.termId === termId)
      .map((entry) => entry.collectionId),
  );

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    icon: collection.icon ?? null,
    checked: termCollectionIds.has(collection.id),
  }));
};

const getSelectableValues = (techniques: Technique[], selector: (technique: Technique) => string | undefined): string[] =>
  unique(
    techniques
      .map(selector)
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .sort(),
  );

const getTrainerValues = (techniques: Technique[]): string[] =>
  unique(
    techniques
      .flatMap((technique) => technique.versions.map((version) => version.trainerId))
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .sort(),
  );

function applyFilters(techniques: Technique[], filters: Filters): Technique[] {
  return techniques.filter((technique) => {
    if (filters.category && technique.category !== filters.category) return false;
    if (filters.attack && technique.attack !== filters.attack) return false;
    if (filters.weapon && technique.weapon !== filters.weapon) return false;
    if (filters.level && technique.level !== filters.level) return false;
    if (filters.trainer && !technique.versions.some(version => version.trainerId === filters.trainer)) return false;
    return true;
  }).sort((a, b) => {
    // Sort all techniques alphabetically by name (English), regardless of category
    const aName = a.name.en || a.name.de || '';
    const bName = b.name.en || b.name.de || '';
    return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
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
  const [glossaryFilters, setGlossaryFilters] = useState<{ category?: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other' }>({});
  const [selectedCollectionId, setSelectedCollectionId] = useState<SelectedCollectionId>('all');
  const [route, setRoute] = useState<AppRoute>(() => getInitialLocation().route);
  const [activeSlug, setActiveSlug] = useState<string | null>(() => getInitialLocation().slug);
  const [activeTrainerId, setActiveTrainerId] = useState<string | null>(() => getInitialLocation().techniqueParams?.trainerId ?? null);
  const [activeEntry, setActiveEntry] = useState<'irimi' | 'tenkan' | null>(() => getInitialLocation().techniqueParams?.entry ?? null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);

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

  // Prevent page scroll while overlays/modals are open
  useLockBodyScroll(searchOpen || settingsOpen || confirmClearOpen);

  // Load glossary terms on component mount
  useEffect(() => {
    const loadGlossaryTerms = async () => {
      try {
        const terms = await loadAllTerms();
        setGlossaryTerms(terms);
      } catch (error) {
        console.error('Failed to load glossary terms:', error);
      }
    };

    loadGlossaryTerms();
  }, []);

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
    if (selectedCollectionId === 'all' || selectedCollectionId === 'ungrouped') {
      return;
    }

    if (!db.collections.some((collection) => collection.id === selectedCollectionId)) {
      setSelectedCollectionId('all');
    }
  }, [db.collections, selectedCollectionId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromLocation = (event?: PopStateEvent) => {
      const state = (event?.state as HistoryState | undefined) ?? (window.history.state as HistoryState | undefined);
      const { route: nextRoute, slug, techniqueParams } = parseLocation(window.location.pathname, state);
      setRoute(nextRoute);
      setActiveSlug(slug);
      setActiveTrainerId(techniqueParams?.trainerId ?? null);
      setActiveEntry(techniqueParams?.entry ?? null);
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
    () => ['irimi', 'tenkan'], // Fixed list for entry modes
    [],
  );
  const weapons = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.weapon),
    [db.techniques],
  );
  const trainers = useMemo(
    () => getTrainerValues(db.techniques),
    [db.techniques],
  );

  // Glossary categories - all possible categories sorted alphabetically by localized label
  const glossaryCategories: ('movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other')[] = useMemo(() => {
    const allCategories: ('movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other')[] = [
      'movement', 'stance', 'attack', 'etiquette', 'philosophy', 'other'
    ];
    
    const copy = getCopy(locale);
    const getCategoryLabel = (category: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other'): string => {
      const labels = {
        movement: copy.categoryMovement,
        stance: copy.categoryStance,
        attack: copy.categoryAttack,
        etiquette: copy.categoryEtiquette,
        philosophy: copy.categoryPhilosophy,
        other: copy.categoryOther,
      };
      return labels[category];
    };
    
    return allCategories.sort((a, b) => 
      getCategoryLabel(a).localeCompare(getCategoryLabel(b), locale, {
        sensitivity: 'accent',
        caseFirst: 'upper'
      })
    );
  }, [locale]);

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

  const currentGlossaryProgress = useMemo(() => {
    if (!activeSlug || route !== 'glossary') return null;
    // For glossary, activeSlug represents the glossary term slug/id
    return db.glossaryProgress.find((entry) => entry.termId === activeSlug) ?? null;
  }, [db.glossaryProgress, activeSlug, route]);

  const glossaryCollectionOptions = useMemo(() => {
    if (!activeSlug || route !== 'glossary') return [];
    return getGlossaryCollectionOptions(db.collections, db.glossaryBookmarkCollections, activeSlug);
  }, [db.collections, db.glossaryBookmarkCollections, activeSlug, route]);

  const updateProgress = (id: string, patch: Partial<Progress>): void => {
    setDB((prev) => {
      const nextProgress = updateProgressEntry(prev.progress, id, patch);
      const shouldRemoveAssignments = patch.bookmarked === false;
      const nextBookmarkCollections = shouldRemoveAssignments
        ? prev.bookmarkCollections.filter((entry) => entry.techniqueId !== id)
        : prev.bookmarkCollections;
      return {
        ...prev,
        progress: nextProgress,
        bookmarkCollections: nextBookmarkCollections,
      };
    });
  };

  const updateGlossaryProgress = (termId: string, patch: Partial<GlossaryProgress>): void => {
    setDB((prev) => {
      const nextGlossaryProgress = updateGlossaryProgressEntry(prev.glossaryProgress, termId, patch);
      const shouldRemoveAssignments = patch.bookmarked === false;
      const nextGlossaryBookmarkCollections = shouldRemoveAssignments
        ? prev.glossaryBookmarkCollections.filter((entry) => entry.termId !== termId)
        : prev.glossaryBookmarkCollections;
      return {
        ...prev,
        glossaryProgress: nextGlossaryProgress,
        glossaryBookmarkCollections: nextGlossaryBookmarkCollections,
      };
    });
  };

  const sanitizeCollectionName = (name: string): string => name.trim().slice(0, 40);

  const sortCollectionsByName = (collections: Collection[]): Collection[] =>
    [...collections]
      .sort((a, b) =>
        a.name.localeCompare(b.name, locale, {
          sensitivity: 'accent',
          caseFirst: 'upper',
        }),
      )
      .map((collection, index) => ({
        ...collection,
        sortOrder: index,
      }));

  const createCollection = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const now = Date.now();
    const id = generateId();

    setDB((prev) => ({
      ...prev,
      collections: sortCollectionsByName([
        ...prev.collections,
        {
          id,
          name: sanitizeCollectionName(trimmed),
          icon: null,
          sortOrder: prev.collections.length,
          createdAt: now,
          updatedAt: now,
        },
      ]),
    }));

    return id;
  };

  const renameCollection = (id: string, name: string): void => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const now = Date.now();

    setDB((prev) => ({
      ...prev,
      collections: sortCollectionsByName(
        prev.collections.map((collection) =>
          collection.id === id
            ? {
                ...collection,
                name: sanitizeCollectionName(trimmed),
                updatedAt: now,
              }
            : collection,
        ),
      ),
    }));
  };

  const deleteCollection = (id: string): void => {
    setDB((prev) => ({
      ...prev,
      collections: sortCollectionsByName(prev.collections.filter((collection) => collection.id !== id)),
      bookmarkCollections: prev.bookmarkCollections.filter((entry) => entry.collectionId !== id),
    }));
  };

  const assignToCollection = (techniqueId: string, collectionId: string): void => {
    setDB((prev) => {
      // Automatically bookmark if not already bookmarked
      const progressEntry = prev.progress.find((entry) => entry.techniqueId === techniqueId);
      const isBookmarked = progressEntry?.bookmarked;

      let nextProgress = prev.progress;
      if (!isBookmarked) {
        const now = Date.now();
        if (progressEntry) {
          nextProgress = prev.progress.map((p) =>
            p.techniqueId === techniqueId ? { ...p, bookmarked: true, updatedAt: now } : p,
          );
        } else {
          nextProgress = [
            ...prev.progress,
            { techniqueId, bookmarked: true, updatedAt: now },
          ];
        }
      }

      if (prev.bookmarkCollections.some((entry) => entry.techniqueId === techniqueId && entry.collectionId === collectionId)) {
        return { ...prev, progress: nextProgress };
      }

      const now = Date.now();

      return {
        ...prev,
        progress: nextProgress,
        bookmarkCollections: [
          ...prev.bookmarkCollections,
          {
            id: generateId(),
            techniqueId,
            collectionId,
            createdAt: now,
          },
        ],
      };
    });
  };

  const removeFromCollection = (techniqueId: string, collectionId: string): void => {
    setDB((prev) => ({
      ...prev,
      bookmarkCollections: prev.bookmarkCollections.filter(
        (entry) => !(entry.techniqueId === techniqueId && entry.collectionId === collectionId),
      ),
    }));
  };

  const assignGlossaryToCollection = (termId: string, collectionId: string): void => {
    setDB((prev) => {
      // Automatically bookmark if not already bookmarked
      const progressEntry = prev.glossaryProgress.find((entry) => entry.termId === termId);
      const isBookmarked = progressEntry?.bookmarked;

      let nextGlossaryProgress = prev.glossaryProgress;
      if (!isBookmarked) {
        const now = Date.now();
        if (progressEntry) {
          nextGlossaryProgress = prev.glossaryProgress.map((p) =>
            p.termId === termId ? { ...p, bookmarked: true, updatedAt: now } : p,
          );
        } else {
          nextGlossaryProgress = [
            ...prev.glossaryProgress,
            { termId, bookmarked: true, updatedAt: now },
          ];
        }
      }

      if (prev.glossaryBookmarkCollections.some((entry) => entry.termId === termId && entry.collectionId === collectionId)) {
        return { ...prev, glossaryProgress: nextGlossaryProgress };
      }

      const now = Date.now();

      return {
        ...prev,
        glossaryProgress: nextGlossaryProgress,
        glossaryBookmarkCollections: [
          ...prev.glossaryBookmarkCollections,
          {
            id: generateId(),
            termId,
            collectionId,
            createdAt: now,
          },
        ],
      };
    });
  };

  const removeGlossaryFromCollection = (termId: string, collectionId: string): void => {
    setDB((prev) => ({
      ...prev,
      glossaryBookmarkCollections: prev.glossaryBookmarkCollections.filter(
        (entry) => !(entry.termId === termId && entry.collectionId === collectionId),
      ),
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

  const openTechnique = (slug: string, trainerId?: string, entry?: 'irimi' | 'tenkan'): void => {
    if (!db.techniques.some((technique) => technique.slug === slug)) {
      return;
    }

    if (typeof window !== 'undefined') {
      const techniquePath = buildTechniqueUrl(slug, trainerId, entry);
      const state: HistoryState = { route, slug, trainerId, entry };

      if (window.location.pathname !== techniquePath) {
        window.history.pushState(state, '', techniquePath);
      } else {
        window.history.replaceState(state, '', techniquePath);
      }
    }

    setActiveSlug(slug);
    setActiveTrainerId(trainerId ?? null);
    setActiveEntry(entry ?? null);
  };

  const openGlossaryTerm = (slug: string): void => {
    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(slug);
      const glossaryPath = `/glossary/${encodedSlug}`;
      const state: HistoryState = { route: 'glossary', slug };

      if (window.location.pathname !== glossaryPath) {
        window.history.pushState(state, '', glossaryPath);
      } else {
        window.history.replaceState(state, '', glossaryPath);
      }
    }

    setRoute('glossary');
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

  const techniqueNotFound = Boolean(activeSlug) && !currentTechnique && route !== 'glossary';

  const techniqueBackLabel =
    route === 'bookmarks'
      ? copy.backToBookmarks
      : route === 'home'
      ? copy.backToHome
      : route === 'about'
      ? copy.backToAbout
      : route === 'guide'
      ? copy.backToGuide
      : route === 'glossary'
      ? copy.backToGlossary
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
        collections={db.collections}
        bookmarkCollections={db.bookmarkCollections}
        onAssignToCollection={(collectionId) => assignToCollection(currentTechnique.id, collectionId)}
        onRemoveFromCollection={(collectionId) => removeFromCollection(currentTechnique.id, collectionId)}
        onOpenGlossary={openGlossaryTerm}
        urlTrainerId={activeTrainerId}
        urlEntry={activeEntry}
        onUrlChange={(trainerId, entry) => {
          const newUrl = buildTechniqueUrl(currentTechnique.slug, trainerId, entry);
          const state: HistoryState = { route, slug: currentTechnique.slug, trainerId, entry };
          if (typeof window !== 'undefined') {
            window.history.replaceState(state, '', newUrl);
          }
          setActiveTrainerId(trainerId ?? null);
          setActiveEntry(entry ?? null);
        }}
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
        locale={locale}
        onOpenLibrary={() => navigateTo('library')}
        onViewBookmarks={() => navigateTo('bookmarks')}
        onViewGuide={() => navigateTo('guide')}
        onViewGlossary={() => navigateTo('glossary')}
        onViewAbout={() => navigateTo('about')}
      />
    );
  } else if (route === 'about') {
    mainContent = <AboutPage copy={copy} />;
  } else if (route === 'guide') {
    mainContent = (
      <GuidePage
        locale={locale}
        onNavigateToGlossaryWithMovementFilter={() => {
          setGlossaryFilters({ category: 'movement' });
          navigateTo('glossary');
        }}
      />
    );
  } else {
    mainContent = (
      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {route === 'library' && (
          <>
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
                trainers={trainers}
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
                  trainers={trainers}
                  onChange={setFilters}
                />
              </aside>
              <section>
                <Library
                  copy={copy}
                  locale={locale}
                  techniques={filteredTechniques}
                  progress={db.progress}
                  onOpen={openTechnique}
                />
              </section>
            </div>
          </>
        )}

        {route === 'bookmarks' && (
          <BookmarksView
            copy={copy}
            locale={locale}
            techniques={db.techniques}
            glossaryTerms={glossaryTerms}
            progress={db.progress}
            glossaryProgress={db.glossaryProgress}
            collections={db.collections}
            bookmarkCollections={db.bookmarkCollections}
            glossaryBookmarkCollections={db.glossaryBookmarkCollections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={(id) => setSelectedCollectionId(id)}
            onCreateCollection={createCollection}
            onRenameCollection={renameCollection}
            onDeleteCollection={deleteCollection}
            onAssign={assignToCollection}
            onUnassign={removeFromCollection}
            onAssignGlossary={assignGlossaryToCollection}
            onUnassignGlossary={removeGlossaryFromCollection}
            onOpenTechnique={openTechnique}
            onOpenGlossaryTerm={(slug) => openGlossaryTerm(slug)}
          />
        )}

        {route === 'glossary' && (
          <>
            {activeSlug ? (
              <GlossaryDetailPage
                slug={activeSlug}
                copy={copy}
                locale={locale}
                onBack={() => navigateTo('glossary', { replace: true })}
                isBookmarked={Boolean(currentGlossaryProgress?.bookmarked)}
                onToggleBookmark={() => updateGlossaryProgress(activeSlug, { bookmarked: !currentGlossaryProgress?.bookmarked })}
                collections={glossaryCollectionOptions}
                onToggleCollection={(collectionId, nextChecked) => {
                  if (nextChecked) {
                    assignGlossaryToCollection(activeSlug, collectionId);
                  } else {
                    removeGlossaryFromCollection(activeSlug, collectionId);
                  }
                }}
              />
            ) : (
              <>
                <div className="md:hidden">
                  <MobileGlossaryFilters
                    copy={copy}
                    filters={glossaryFilters}
                    categories={glossaryCategories}
                    onChange={setGlossaryFilters}
                  />
                </div>
                <div className="grid md:grid-cols-[16rem,1fr] gap-6">
                  <aside className="hidden md:block surface border surface-border rounded-2xl p-3 h-max sticky top-20">
                    <GlossaryFilterPanel
                      copy={copy}
                      filters={glossaryFilters}
                      categories={glossaryCategories}
                      onChange={setGlossaryFilters}
                    />
                  </aside>
                  <section>
                    <GlossaryPage
                      locale={locale}
                      copy={copy}
                      filters={glossaryFilters}
                      onOpenTerm={openGlossaryTerm}
                    />
                  </section>
                </div>
              </>
            )}
          </>
        )}
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
          key={currentTechnique ? `technique-${currentTechnique.id}` : activeSlug ? `glossary-${activeSlug}` : route}
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

  {/* Footer removed per request */}

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
            onOpenGlossary={(slug) => {
              openGlossaryTerm(slug);
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
