import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Header } from '@shared/components/layout/Header';
import { MobileTabBar } from '@shared/components/layout/MobileTabBar';
import { FilterPanel } from './features/search/components/FilterPanel';
import { ExpandableFilterBar } from '@shared/components/ui/ExpandableFilterBar';
import { Library } from '@features/technique/components/Library';
import { BookmarksView } from './features/bookmarks/components/BookmarksView';
import { SearchOverlay } from './features/search/components/SearchOverlay';
import { SettingsModal } from '@features/home/components/settings/SettingsModal';
import { TechniquePage } from '@features/technique/components/TechniquePage';
import { type CollectionOption } from '@features/technique/components/TechniqueHeader';
import { Toast } from '@shared/components/ui/Toast';
import { MobileFilters } from '@shared/components/ui/MobileFilters';
import { HomePage } from './features/home';
import { AboutPage } from '@features/home/components/home/AboutPage';
import { AdvancedPrograms } from '@features/home/components/home/AdvancedPrograms';
import { DanOverview } from '@features/home/components/home/DanOverview';
import { GuidePage } from '@features/home/components/home/GuidePage';
import { RoadmapPage } from '@features/home/components/home/RoadmapPage';
import { FeedbackPage } from '@features/home/components/feedback/FeedbackPage';
import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
import { GlossaryPage, GlossaryDetailPage } from './features/glossary';
import { GlossaryFilterPanel, MobileGlossaryFilters, loadAllTerms } from './features/glossary';
import { ConfirmClearModal } from './shared/components/dialogs/ConfirmClearDialog';
import { setAnimationsDisabled, useMotionPreferences } from '@shared/components/ui/motion';
import { getCopy } from './shared/constants/i18n';
import useLockBodyScroll from './shared/hooks/useLockBodyScroll';
import { cameFromBackForwardNavigation, consumeBFCacheRestoreFlag, rememberScrollPosition } from './shared/utils/navigationLifecycle';
import {
  clearDB,
  clearThemePreference,
  hasStoredTheme,
  loadDB,
  loadAnimationsDisabled,
  loadLocale,
  loadTheme,
  saveDB,
  saveAnimationsDisabled,
  saveLocale,
  saveTheme,
  loadFilters,
  saveFilters,
  clearFilters,
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
import { buildTechniqueUrl as buildUrl, parseTechniquePath, buildTechniqueUrlWithVariant } from '@shared/constants/urls';
import { enrichTechniqueWithVariants } from '@shared/constants/variantMapping';
import { ENTRY_MODE_ORDER, isEntryMode } from './shared/constants/entryModes';
import { PencilLine } from 'lucide-react';

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
    case 'roadmap':
      return '/roadmap';
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

  if (pathname === '/roadmap') {
    return { route: 'roadmap', slug: null };
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

const getTrainerValues = (techniques: Technique[]): string[] => {
  const trainerIds = techniques
    .flatMap((technique) => technique.versions.map((version) => version.trainerId))
    .filter((v): v is string => Boolean(v && v.trim().length > 0));

  const hasBaseVersions = techniques.some((technique) => technique.versions.some((version) => !version.trainerId));

  const values = unique(trainerIds).sort();
  if (hasBaseVersions) {
    // place 'base-forms' at the front so the option is visible
    return ['base-forms', ...values];
  }
  return values;
};

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
    if (filters.trainer) {
      if (filters.trainer === 'base-forms') {
        // include techniques which have at least one base version (version without trainerId)
        if (!technique.versions.some((version) => !version.trainerId)) return false;
      } else {
        if (!technique.versions.some((version) => version.trainerId === filters.trainer)) return false;
      }
    }
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
  const [animationsDisabled, setAnimationsDisabledState] = useState<boolean>(() => {
    const initial = loadAnimationsDisabled();
    setAnimationsDisabled(initial);
    return initial;
  });
  const [db, setDB] = useState<DB>(() => loadDB());
  const [filters, setFilters] = useState<Filters>(() => {
    try {
      const persisted = loadFilters<Filters>();
      return persisted ?? defaultFilters;
    } catch {
      return defaultFilters;
    }
  });
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
  // Detect if this render follows a back/forward restore and skip entrance
  // animations to avoid the brief re-appearance/flicker on iOS Safari.
  const skipEntranceAnimations = cameFromBackForwardNavigation();

  useEffect(() => {
    setAnimationsDisabled(animationsDisabled);
  }, [animationsDisabled]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const { body } = document;
    root.classList.toggle('disable-animations', animationsDisabled);
    if (body) {
      body.classList.toggle('disable-animations', animationsDisabled);
    }
  }, [animationsDisabled]);

  // Prefetch helpers - no longer needed since pages are statically imported
  const prefetchTechniquePage = useCallback(() => {
    // No-op: TechniquePage is now statically imported
  }, []);
  const prefetchFeedbackPage = useCallback(() => {
    // No-op: FeedbackPage is now statically imported
  }, []);
  const prefetchGlossary = useCallback(() => {
    // No-op: GlossaryPage is now statically imported
  }, []);
  const prefetchBookmarks = useCallback(() => {
    // No-op: BookmarksView is now statically imported
  }, []);

  const navigateTo = useCallback(
    (next: AppRoute, options: { replace?: boolean } = {}) => {
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
    // Reload preferences after clearing (clearDB resets them to defaults)
    setAnimationsDisabledState(loadAnimationsDisabled());
    handleCancelClear();
    showToast(copy.toastDataCleared);
  }, [copy.toastDataCleared, handleCancelClear, setDB, showToast]);

  // When clearing the DB, also clear persisted filters to avoid stale state
  useEffect(() => {
    // detect when DB becomes the default (clearDB was called)
    if (db.techniques.length === 0) {
      // unlikely — keep as a safety net
      clearFilters();
    }
  }, [db]);

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

  // Persist filters to local storage so they survive reloads/navigation
  useEffect(() => {
    try {
      saveFilters(filters);
    } catch {
      // noop
    }
  }, [filters]);

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

  // no-op placeholder: scroll/animation behavior is coordinated via
  // navigationLifecycle and the skipEntranceAnimations flag above.

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

  const handleAnimationsPreferenceChange = (disabled: boolean): void => {
    setAnimationsDisabledState(disabled);
    setAnimationsDisabled(disabled);
    saveAnimationsDisabled(disabled);
  };

  const handleDBChange = (next: DB): void => {
    setDB(next);
  };

  const openTechnique = (slug: string, trainerId?: string, entry?: EntryMode, skipExistenceCheck?: boolean): void => {
    rememberScrollPosition();
    if (!skipExistenceCheck && !db.techniques.some((technique) => technique.slug === slug)) {
      return;
    }

    // If the caller didn't pass explicit trainer/entry params, try to apply
    // the current global filters so the technique opens to the matching
    // version/variation (direction/weapon/version). Fallback to the
    // legacy trainer/entry URL shape when no matching variant is found.
    let finalPath: string;
    let state: HistoryState = { route, slug, trainerId, entry };

    const shouldAutoApplyFilters = !trainerId && !entry && (filters.trainer || filters.stance || filters.weapon);

    if (shouldAutoApplyFilters) {
      const technique = db.techniques.find((t) => t.slug === slug);
      if (technique) {
        const enriched = enrichTechniqueWithVariants(technique);

        // Map filter values to toolbar/variant values
        const direction = (filters.stance as any) ?? undefined; // irimi/tenkan/omote/ura
        const weaponFilter = filters.weapon as string | undefined;
        const weapon = weaponFilter ? (weaponFilter === 'empty-hand' ? 'empty' : (weaponFilter as any)) : undefined;

        // Determine versionId candidate from trainer filter
        let versionIdCandidate: string | null | undefined = undefined;
        if (filters.trainer) {
          if (filters.trainer === 'base-forms') {
            // prefer a base version (null) if available
            const hasBase = (technique.versions || []).some((v) => !v.trainerId || v.id === 'v-base');
            versionIdCandidate = hasBase ? null : undefined;
          }
          if (versionIdCandidate === undefined) {
            // try to find a version authored by the selected trainer
            const authorVersion = (technique.versions || []).find((v) => v.trainerId === filters.trainer);
            if (authorVersion) versionIdCandidate = authorVersion.id;
          }
        }

        // Try to find the best matching variant
        const variants = enriched.variants || [];

        const matchPredicate = (v: any) => {
          if (direction && v.key.direction !== direction) return false;
          if (weapon && v.key.weapon !== weapon) return false;
          if (versionIdCandidate !== undefined) {
            // if candidate explicitly null, require null; otherwise allow matching id
            if (versionIdCandidate === null) {
              if (v.key.versionId !== null && v.key.versionId !== undefined) return false;
            } else if (v.key.versionId !== versionIdCandidate) return false;
          }
          return true;
        };

        let found = variants.find(matchPredicate);

        // If no strict match, relax version constraint (allow any version) if direction/weapon match
        if (!found && (direction || weapon)) {
          found = variants.find((v) => {
            if (direction && v.key.direction !== direction) return false;
            if (weapon && v.key.weapon !== weapon) return false;
            return true;
          });
        }

        if (found) {
          // Build variant path so TechniquePage will pick the correct toolbar state
          finalPath = buildTechniqueUrlWithVariant(slug, {
            hanmi: found.key.hanmi,
            direction: found.key.direction,
            weapon: found.key.weapon,
            versionId: found.key.versionId,
          });
          // store state for history (also include trainer/entry for back navigation)
          state = { route, slug, trainerId: filters.trainer, entry: (filters.stance as EntryMode) ?? undefined };
        } else {
          // fallback to legacy path with trainer/entry if available
          finalPath = buildTechniqueUrl(slug, filters.trainer ?? undefined, (filters.stance as any) ?? undefined);
          state = { route, slug, trainerId: filters.trainer, entry: (filters.stance as EntryMode) ?? undefined };
        }
      } else {
        // technique not found in DB (edge case) - fallback to basic path
        finalPath = buildTechniqueUrl(slug, trainerId, entry);
      }
    } else {
      // explicit params were provided — respect them
      finalPath = buildTechniqueUrl(slug, trainerId, entry);
    }

    if (typeof window !== 'undefined') {
      if (window.location.pathname !== finalPath) {
        window.history.pushState(state, '', finalPath);
      } else {
        window.history.replaceState(state, '', finalPath);
      }
    }

    setActiveSlug(slug);
  };

  const openGlossaryTerm = (slug: string): void => {
    rememberScrollPosition();
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
    if (consumeBFCacheRestoreFlag()) {
      return;
    }
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
          : route === 'roadmap'
            ? copy.backToRoadmap
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
          : route === 'roadmap'
            ? copy.backToRoadmap
            : route === 'guide'
              ? copy.backToGuide
              : route === 'feedback'
                ? copy.backToFeedback
                : copy.backToGlossary;

  let mainContent: ReactElement;

  if (currentTechnique) {
    mainContent = (
      <motion.div
        initial={skipEntranceAnimations ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={pageMotion.transition}
        style={{ willChange: 'transform, opacity' }}
      >
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
    );
  } else if (currentGlossaryTerm) {
    // Render glossary detail when an active glossary term is set, regardless of current route
    mainContent = (
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
        onCreateCollection={createCollection}
        onNavigateToGlossaryWithFilter={(category) => {
          setGlossaryFilters({ category });
          prefetchGlossary();
          navigateTo('glossary');
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
        onViewRoadmap={() => navigateTo('roadmap')}
        onViewAbout={() => navigateTo('about')}
      />
    );
  } else if (route === 'roadmap') {
    mainContent = <RoadmapPage copy={copy} locale={locale} />;
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
    );
  } else {
    mainContent = (
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-4 space-y-4">
        {route === 'library' && (
          <>
            <div className="lg:hidden">
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
                onContribute={() => goToFeedback('newTechnique')}
                onContributePrefetch={prefetchFeedbackPage}
              />
            </div>
            {/* Mobile CTA removed here — now rendered inside the MobileFilters panel */}
            <div className="relative">
              <ExpandableFilterBar label={copy.filters}>
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
                    <PencilLine width={20} height={20} aria-hidden />
                    {copy.feedbackAddTechniqueCta}
                  </button>
                </div>
              </ExpandableFilterBar>
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
                onCreateCollection={createCollection}
                onNavigateToGlossaryWithFilter={(category) => {
                  setGlossaryFilters({ category });
                  navigateTo('glossary');
                }}
              />
            ) : (
              <>
                <div className="lg:hidden">
                  <MobileGlossaryFilters
                    copy={copy}
                    filters={glossaryFilters}
                    categories={glossaryCategories}
                    onChange={setGlossaryFilters}
                  />
                </div>
                <div className="relative">
                  <ExpandableFilterBar label={copy.filters}>
                    <GlossaryFilterPanel
                      copy={copy}
                      filters={glossaryFilters}
                      categories={glossaryCategories}
                      onChange={setGlossaryFilters}
                    />
                  </ExpandableFilterBar>
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

  const pageKey = currentTechnique ? `technique-${currentTechnique.id}` : activeSlug ? `glossary-${activeSlug}` : route;

  return (
    <MotionConfig reducedMotion={animationsDisabled ? 'always' : 'user'}>
      <div className="min-h-dvh flex flex-col app-bg">
        <Header
          copy={copy}
          route={route}
          onNavigate={navigateTo}
          onSearch={openSearch}
          onSettings={openSettings}
          searchButtonRef={searchTriggerRef}
          settingsButtonRef={settingsTriggerRef}
        />

        <AnimatePresence mode={skipEntranceAnimations ? 'sync' : 'wait'} initial={!skipEntranceAnimations}>
          <motion.main
            key={pageKey}
            variants={pageMotion.variants}
            initial={skipEntranceAnimations ? 'animate' : 'initial'}
            animate="animate"
            exit={skipEntranceAnimations ? undefined : 'exit'}
            transition={pageMotion.transition}
            className="flex-1 pb-24 md:pb-0"
            style={{ willChange: 'transform, opacity' }}
          >
            {mainContent}
          </motion.main>

          {/* Footer removed as requested */}
        </AnimatePresence>

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
              onToggleTechniqueBookmark={(techniqueId: string) =>
                updateProgress(techniqueId, {
                  bookmarked: !(db.progress.find((p) => p.techniqueId === techniqueId)?.bookmarked),
                })}
              onToggleGlossaryBookmark={(termId: string) =>
                updateGlossaryProgress(termId, {
                  bookmarked: !(db.glossaryProgress.find((g) => g.termId === termId)?.bookmarked),
                })}
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
              animationsDisabled={animationsDisabled}
              onClose={closeSettings}
              onRequestClear={handleRequestClear}
              onChangeLocale={handleLocaleChange}
              onChangeTheme={handleThemeChange}
              onChangeAnimations={handleAnimationsPreferenceChange}
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

        <MobileTabBar copy={copy} route={route} onNavigate={navigateTo} />

        {toast && <Toast>{toast}</Toast>}
      </div>
    </MotionConfig>
  );
}
