import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '@shared/components/layout/Header';
import { FilterPanel } from './features/search/components/FilterPanel';
import { Library } from '@features/technique/components/Library';
// Lazy-load heavy pages to keep initial bundle small
const BookmarksView = lazy(() => import('./features/bookmarks/components/BookmarksView').then(m => ({ default: m.BookmarksView })));
import { SearchOverlay } from './features/search/components/SearchOverlay';
import { SettingsModal } from '@features/home/components/settings/SettingsModal';
// Lazy-load heavy pages to reduce initial bundle size
const TechniquePage = lazy(() => import('@features/technique/components/TechniquePage').then(m => ({ default: m.TechniquePage })));
import { type CollectionOption } from '@features/technique/components/TechniqueHeader';
import { Toast } from '@shared/components/ui/Toast';
import { MobileFilters } from '@shared/components/ui/MobileFilters';
import { HomePage } from './features/home';
import { AboutPage } from '@features/home/components/home/AboutPage';
import { AdvancedPrograms } from '@features/home/components/home/AdvancedPrograms';
import { DanOverview } from '@features/home/components/home/DanOverview';
import { GuidePage } from '@features/home/components/home/GuidePage';
const FeedbackPage = lazy(() => import('@features/home/components/feedback/FeedbackPage').then(m => ({ default: m.FeedbackPage })));
import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
const GlossaryPage = lazy(() => import('./features/glossary').then(m => ({ default: m.GlossaryPage })));
const GlossaryDetailPage = lazy(() => import('./features/glossary').then(m => ({ default: m.GlossaryDetailPage })));
import { GlossaryFilterPanel, MobileGlossaryFilters, loadAllTerms } from './features/glossary';
import { ConfirmClearModal } from './shared/components/dialogs/ConfirmClearDialog';
import { useMotionPreferences } from '@shared/components/ui/motion';
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
import type {
  AppRoute,
  Collection,
  DB,
  EntryMode,
  Filters,
  GlossaryBookmarkCollection,
  GlossaryProgress,
  GlossaryTerm,
  Grade,
  Locale,
  Progress,
  Technique,
  Theme,
} from './shared/types';
import { gradeOrder } from './shared/utils/grades';
import { unique, upsert } from './shared/utils/array';
import { buildTechniqueUrl as buildUrl, parseTechniquePath } from '@shared/constants/urls';
import { ENTRY_MODE_ORDER, isEntryMode } from './shared/constants/entryModes';
import { PencilLineIcon } from '@shared/components/ui/icons';

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
  entry?: EntryMode;
};

const routeToPath = (route: AppRoute): string => {
  switch (route) {
    case 'home':
      return '/';
    case 'about':
      return '/about';
    case 'guide':
      return '/guide';
    case 'guideAdvanced':
      return '/guide/advanced';
    case 'guideDan':
      return '/guide/dan';
    case 'feedback':
      return '/feedback';
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
  entry?: EntryMode;
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
    // Handle backwards compatibility redirects
    const slugRedirects: Record<string, string> = {
      'irimi-omote': 'irimi',
      'tenkan-ura': 'tenkan',
    };
    const finalSlug = slug && (slugRedirects[slug] || slug);
    const fallbackRoute = state?.route ?? 'glossary';
    return { route: fallbackRoute, slug: finalSlug };
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

  if (pathname === '/guide/advanced') {
    return { route: 'guideAdvanced', slug: null };
  }

  if (pathname === '/guide/dan') {
    return { route: 'guideDan', slug: null };
  }

  if (pathname === '/feedback') {
    return { route: 'feedback', slug: null };
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
    if (filters.stance) {
      if (!isEntryMode(filters.stance)) {
        return false;
      }

  const requiredEntry: EntryMode = filters.stance;
      const hasEntryMode = technique.versions.some((version) => Boolean(version.stepsByEntry?.[requiredEntry]));
      if (!hasEntryMode) return false;
    }
    if (filters.trainer && !technique.versions.some(version => version.trainerId === filters.trainer)) return false;
    return true;
  }).sort((a, b) => {
    // Sort all techniques alphabetically by name (English), regardless of category
    const aName = a.name.en || a.name.de || '';
    const bName = b.name.en || b.name.de || '';
    return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
  });
}

function useKeyboardShortcuts(onSearch: (method?: 'keyboard' | 'mouse') => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (isEditableElement(event.target)) {
        if ((event.metaKey || event.ctrlKey) && key === 'k') {
          event.preventDefault();
          onSearch('keyboard');
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        onSearch('keyboard');
      } else if (key === '/') {
        event.preventDefault();
        onSearch('keyboard');
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType | null>(null);

  const copy = getCopy(locale);
  const { pageMotion } = useMotionPreferences();
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Prefetch helpers for lazily loaded chunks (kept idempotent)
  const prefetchedTechniqueRef = useRef(false);
  const prefetchedFeedbackRef = useRef(false);
  const prefetchedGlossaryRef = useRef(false);
  const prefetchedBookmarksRef = useRef(false);
  const prefetchTechniquePage = useCallback(() => {
    if (!prefetchedTechniqueRef.current) {
      prefetchedTechniqueRef.current = true;
      void import('@features/technique/components/TechniquePage');
    }
  }, []);
  const prefetchFeedbackPage = useCallback(() => {
    if (!prefetchedFeedbackRef.current) {
      prefetchedFeedbackRef.current = true;
      void import('@features/home/components/feedback/FeedbackPage');
    }
  }, []);
  const prefetchGlossary = useCallback(() => {
    if (!prefetchedGlossaryRef.current) {
      prefetchedGlossaryRef.current = true;
      void import('./features/glossary');
    }
  }, []);
  const prefetchBookmarks = useCallback(() => {
    if (!prefetchedBookmarksRef.current) {
      prefetchedBookmarksRef.current = true;
      void import('./features/bookmarks/components/BookmarksView');
    }
  }, []);

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

  const goToFeedback = useCallback(
    (type?: FeedbackType) => {
      if (type) {
        setFeedbackInitialType(type);
      }
      navigateTo('feedback');
    },
    [navigateTo],
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

  const openSearch = useCallback((method: 'keyboard' | 'mouse' = 'mouse') => {
    // store how the search was opened so the overlay can adjust pointer behavior
    (openSearch as any).lastOpenedBy = method;
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
      const { route: nextRoute, slug } = parseLocation(window.location.pathname, state);
      setRoute(nextRoute);
      setActiveSlug(slug);
    };

    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  useKeyboardShortcuts(openSearch);

  // Idle prefetch both heavy chunks after initial render
  useEffect(() => {
    const idle = (cb: () => void) =>
      (window as any).requestIdleCallback ? (window as any).requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 600);
    idle(() => {
      prefetchTechniquePage();
      prefetchFeedbackPage();
      prefetchGlossary();
      prefetchBookmarks();
    });
  }, [prefetchTechniquePage, prefetchFeedbackPage, prefetchGlossary, prefetchBookmarks]);

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
  const stances = ENTRY_MODE_ORDER;
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

  const currentGlossaryTerm = useMemo(
    () => (activeSlug ? glossaryTerms.find((term) => term.slug === activeSlug) ?? null : null),
    [glossaryTerms, activeSlug],
  );

  const currentGlossaryProgress = useMemo(() => {
    if (!activeSlug || !currentGlossaryTerm) return null;
    return db.glossaryProgress.find((entry) => entry.termId === activeSlug) ?? null;
  }, [db.glossaryProgress, activeSlug, currentGlossaryTerm]);

  const glossaryCollectionOptions = useMemo(() => {
    if (!activeSlug || !currentGlossaryTerm) return [];
    return getGlossaryCollectionOptions(db.collections, db.glossaryBookmarkCollections, activeSlug);
  }, [db.collections, db.glossaryBookmarkCollections, activeSlug, currentGlossaryTerm]);

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

  const createCollectionWithGrade = (name: string, grade: Grade): string | null => {
    const collectionId = createCollection(name);
    if (!collectionId) return null;

    // Find all techniques matching this grade
    const matchingTechniques = db.techniques.filter((technique) => technique.level === grade);
    const now = Date.now();

    setDB((prev) => {
      // Create bookmark collection entries for all matching techniques
      const newBookmarkCollections = matchingTechniques.map((technique) => ({
        id: generateId(),
        techniqueId: technique.id,
        collectionId,
        createdAt: now,
      }));

      // Auto-bookmark all these techniques
      const techniqueIds = new Set(matchingTechniques.map((t) => t.id));
      const nextProgress = prev.progress.map((p) =>
        techniqueIds.has(p.techniqueId) && !p.bookmarked
          ? { ...p, bookmarked: true, updatedAt: now }
          : p
      );

      // Add progress entries for techniques that don't have them yet
      const existingProgressIds = new Set(prev.progress.map((p) => p.techniqueId));
      const newProgressEntries = matchingTechniques
        .filter((t) => !existingProgressIds.has(t.id))
        .map((technique) => ({
          techniqueId: technique.id,
          bookmarked: true,
          updatedAt: now,
        }));

      return {
        ...prev,
        progress: [...nextProgress, ...newProgressEntries],
        bookmarkCollections: [...prev.bookmarkCollections, ...newBookmarkCollections],
      };
    });

    return collectionId;
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

  const openTechnique = (slug: string, trainerId?: string, entry?: EntryMode, skipExistenceCheck?: boolean): void => {
    if (!skipExistenceCheck && !db.techniques.some((technique) => technique.slug === slug)) {
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
  };

  const openGlossaryTerm = (slug: string): void => {
    // Handle backwards compatibility redirects
    const slugRedirects: Record<string, string> = {
      'irimi-omote': 'irimi',
      'tenkan-ura': 'tenkan',
    };
    const finalSlug = slugRedirects[slug] || slug;

    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(finalSlug);
      const glossaryPath = `/glossary/${encodedSlug}`;
      // Push the current route into history state so the detail page knows where it was opened from
      const state: HistoryState = { route, slug: finalSlug };

      if (window.location.pathname !== glossaryPath) {
        window.history.pushState(state, '', glossaryPath);
      } else {
        window.history.replaceState(state, '', glossaryPath);
      }
    }

    // Mirror technique behavior: set active slug but keep `route` unchanged so the header/back label
    // can still reflect the page the user opened the term from (e.g. bookmarks).
    setActiveSlug(finalSlug);
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

  // Ensure we scroll to the top whenever navigation changes to a new page or detail view.
  // This guarantees that if the user was scrolled down on the previous page, opening
  // a new route, technique, or glossary term always starts at the top of the page.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Use a micro task to ensure any route transition DOM updates happen first.
    // This is particularly helpful when used with animated transitions.
    Promise.resolve().then(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }, [route, activeSlug, currentTechnique?.id]);

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
      : route === 'feedback'
      ? copy.backToFeedback
      : copy.backToLibrary;

  const glossaryBackLabel =
    route === 'bookmarks'
      ? copy.backToBookmarks
      : route === 'home'
      ? copy.backToHome
      : route === 'about'
  ? copy.backToAbout
      : route === 'guide'
      ? copy.backToGuide
      : route === 'feedback'
      ? copy.backToFeedback
      : copy.backToGlossary;

  let mainContent: ReactElement;

  if (currentTechnique) {
    mainContent = (
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-5 text-sm text-subtle">
              {copy.loading}
            </div>
          </div>
        }
      >
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={pageMotion.transition}>
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
          onFeedbackClick={() => goToFeedback()}
          onCreateCollection={createCollection}
        />
        </motion.div>
      </Suspense>
    );
  } else if (currentGlossaryTerm) {
    // Render glossary detail when an active glossary term is set, regardless of current route
    mainContent = (
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-5 text-sm text-subtle">{copy.loading}</div>
          </div>
        }
      >
        <GlossaryDetailPage
          slug={activeSlug!}
          copy={copy}
          locale={locale}
          backLabel={glossaryBackLabel}
          // Back should navigate to the route the user came from (stored in history state) —
          // when opened from bookmarks the current `route` will still be 'bookmarks', so navigate there.
          onBack={() => navigateTo(route, { replace: true })}
          isBookmarked={Boolean(currentGlossaryProgress?.bookmarked)}
          onToggleBookmark={() => updateGlossaryProgress(activeSlug!, { bookmarked: !currentGlossaryProgress?.bookmarked })}
          collections={glossaryCollectionOptions}
          onToggleCollection={(collectionId, nextChecked) => {
            if (nextChecked) {
              assignGlossaryToCollection(activeSlug!, collectionId);
            } else {
              removeGlossaryFromCollection(activeSlug!, collectionId);
            }
          }}
          onNavigateToGlossaryWithFilter={(category) => {
            setGlossaryFilters({ category });
            prefetchGlossary();
            navigateTo('glossary');
          }}
        />
      </Suspense>
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
  } else if (route === 'guideAdvanced') {
    mainContent = (
      <AdvancedPrograms
        locale={locale}
        onOpenTechnique={openTechnique}
      />
    );
  } else if (route === 'guideDan') {
    mainContent = (
      <DanOverview
        locale={locale}
      />
    );
  } else if (route === 'guide') {
    mainContent = (
      <GuidePage
        locale={locale}
        collections={db.collections}
        onNavigateToGlossaryWithMovementFilter={() => {
          setGlossaryFilters({ category: 'movement' });
          prefetchGlossary();
          navigateTo('glossary');
        }}
        onCreateCollectionWithGrade={createCollectionWithGrade}
        onNavigateToBookmarks={(collectionId) => {
          setSelectedCollectionId(collectionId);
          prefetchBookmarks();
          navigateTo('bookmarks');
        }}
        onOpenTechnique={openTechnique}
        onNavigateToAdvanced={() => navigateTo('guideAdvanced')}
        onNavigateToDan={() => navigateTo('guideDan')}
      />
    );
  } else if (route === 'feedback') {
    mainContent = (
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-5 text-sm text-subtle">
              {copy.loading}
            </div>
          </div>
        }
      >
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={pageMotion.transition}>
        <FeedbackPage
          copy={copy}
          locale={locale}
          techniques={db.techniques}
          onBack={() => navigateTo('library')}
          initialType={feedbackInitialType}
          onConsumeInitialType={() => setFeedbackInitialType(null)}
        />
        </motion.div>
      </Suspense>
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
            {/* Mobile CTA under filters, above grid */}
            <div className="md:hidden mb-4">
              <button
                type="button"
                onClick={() => goToFeedback('newTechnique')}
                onMouseEnter={prefetchFeedbackPage}
                onFocus={prefetchFeedbackPage}
                className="inline-flex items-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
              >
                <PencilLineIcon width={20} height={20} aria-hidden />
                {copy.feedbackAddTechniqueCta}
              </button>
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
                {/* Desktop CTA under filter panel */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => goToFeedback('newTechnique')}
                    onMouseEnter={prefetchFeedbackPage}
                    onFocus={prefetchFeedbackPage}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
                  >
                    <PencilLineIcon width={20} height={20} aria-hidden />
                    {copy.feedbackAddTechniqueCta}
                  </button>
                </div>
              </aside>
              <section>
                {/* Button moved to under filters (desktop) and above grid (mobile) */}
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
          <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-6"><div className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-5 text-sm text-subtle">{copy.loading}</div></div>}>
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
          </Suspense>
        )}

        {route === 'glossary' && (
          <>
            {activeSlug ? (
              <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-6"><div className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-5 text-sm text-subtle">{copy.loading}</div></div>}>
                <GlossaryDetailPage
                  slug={activeSlug}
                  copy={copy}
                  locale={locale}
                  backLabel={glossaryBackLabel}
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
                  onNavigateToGlossaryWithFilter={(category) => {
                    setGlossaryFilters({ category });
                    navigateTo('glossary');
                  }}
                />
              </Suspense>
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
                    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-6"><div className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-5 text-sm text-subtle">{copy.loading}</div></div>}>
                      <GlossaryPage
                      locale={locale}
                      copy={copy}
                      filters={glossaryFilters}
                      onOpenTerm={openGlossaryTerm}
                      />
                    </Suspense>
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
            progress={db.progress}
            glossaryProgress={db.glossaryProgress}
            onClose={closeSearch}
            onOpen={(slug) => {
              openTechnique(slug);
              closeSearch();
            }}
            onOpenGlossary={(slug) => {
              openGlossaryTerm(slug);
              closeSearch();
            }}
            onToggleTechniqueBookmark={(techniqueId: string) => updateProgress(techniqueId, { bookmarked: !(db.progress.find(p => p.techniqueId === techniqueId)?.bookmarked) })}
            onToggleGlossaryBookmark={(termId: string) => updateGlossaryProgress(termId, { bookmarked: !(db.glossaryProgress.find(g => g.termId === termId)?.bookmarked) })}
            openedBy={(openSearch as any).lastOpenedBy ?? 'mouse'}
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
            onNavigateToFeedback={() => {
              closeSettings();
              navigateTo('feedback');
            }}
            onNavigateToAbout={() => {
              closeSettings();
              navigateTo('about');
            }}
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
