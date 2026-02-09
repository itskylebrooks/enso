'use client';

import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
import { FeedbackPage } from '@features/home/components/feedback/FeedbackPage';
import { GuideGradePage } from '@features/home/components/guide/GuideGradePage';
import { AboutPage } from '@features/home/components/home/AboutPage';
import { AdvancedPrograms } from '@features/home/components/home/AdvancedPrograms';
import { DanOverview } from '@features/home/components/home/DanOverview';
import { GuidePage } from '@features/home/components/home/GuidePage';
import { GuideRoutinePage } from '@features/home/components/home/GuideRoutinePage';
import { SettingsModal } from '@features/home/components/settings/SettingsModal';
import { TechniquesPage } from '@features/technique/components/TechniquesPage';
import { type CollectionOption } from '@features/technique/components/TechniqueHeader';
import { TechniquePage } from '@features/technique/components/TechniquePage';
import { Header } from '@shared/components/layout/Header';
import { MobileTabBar } from '@shared/components/layout/MobileTabBar';
import { ExpandableFilterBar } from '@shared/components/ui/ExpandableFilterBar';
import { MobileFilters } from '@shared/components/ui/MobileFilters';
import { setAnimationsDisabled, useMotionPreferences } from '@shared/components/ui/motion';
import { Toast } from '@shared/components/ui/Toast';
import {
  buildTechniqueUrlWithVariant,
  buildTechniqueUrl as buildUrl,
  parseTechniquePath,
} from '@shared/constants/urls';
import { enrichTechniqueWithVariants } from '@shared/constants/variantMapping';
import { PencilLine } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { BookmarksView } from './features/bookmarks/components/BookmarksView';
import {
  TermDetailPage,
  TermsFilterPanel,
  TermsPage,
  MobileTermsFilters,
  loadAllTerms,
} from './features/terms';
import {
  MobileExercisesFilters,
  ExerciseDetailPage,
  ExercisesFilterPanel,
  ExercisesPage,
  loadAllExercises,
} from './features/exercises';
import type { ExerciseFilters } from './features/exercises';
import { HomePage } from './features/home';
import { FilterPanel } from './features/search/components/FilterPanel';
import { SearchOverlay } from './features/search/components/SearchOverlay';
import { ConfirmClearModal } from './shared/components/dialogs/ConfirmClearDialog';
import { ENTRY_MODE_ORDER, isEntryMode } from './shared/constants/entryModes';
import { getCopy } from './shared/constants/i18n';
import useLockBodyScroll from './shared/hooks/useLockBodyScroll';
import {
  clearDB,
  clearFilters,
  clearThemePreference,
  hasStoredTheme,
  loadAnimationsDisabled,
  loadBeltPromptDismissed,
  loadDB,
  loadFilters,
  loadStoredLocale,
  loadPinnedBeltGrade,
  loadTheme,
  saveAnimationsDisabled,
  saveBeltPromptDismissed,
  saveDB,
  saveFilters,
  saveLocale,
  savePinnedBeltGrade,
  saveTheme,
} from './shared/services/storageService';
import type {
  AppRoute,
  Collection,
  DB,
  Direction,
  Exercise,
  ExerciseProgress,
  EntryMode,
  Filters,
  GlossaryBookmarkCollection,
  GlossaryProgress,
  GlossaryTerm,
  Grade,
  GuideRoutine,
  Locale,
  Progress,
  PracticeCategory,
  Technique,
  TechniqueVariant,
  TechniqueVariantKey,
  Theme,
  WeaponKind,
} from './shared/types';
import { unique, upsert } from './shared/utils/array';
import { gradeOrder } from './shared/utils/grades';
import { getExerciseCategoryLabel } from './shared/styles/exercises';
import {
  cameFromBackForwardNavigation,
  consumeBFCacheRestoreFlag,
  rememberScrollPosition,
} from './shared/utils/navigationLifecycle';

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
  sourceRoute?: AppRoute;
  sourceSlug?: string;
};

type AppProps = {
  initialLocale?: Locale;
  initialRoute?: AppRoute;
  initialSlug?: string | null;
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
    case 'guideKyu5':
      return '/guide/5-kyu';
    case 'guideKyu4':
      return '/guide/4-kyu';
    case 'guideKyu3':
      return '/guide/3-kyu';
    case 'guideKyu2':
      return '/guide/2-kyu';
    case 'guideKyu1':
      return '/guide/1-kyu';
    case 'guideDan1':
      return '/guide/1-dan';
    case 'guideDan2':
      return '/guide/2-dan';
    case 'guideDan3':
      return '/guide/3-dan';
    case 'guideDan4':
      return '/guide/4-dan';
    case 'guideDan5':
      return '/guide/5-dan';
    case 'guideRoutineWarmUp':
      return '/guide/routines/warm-up';
    case 'guideRoutineCooldown':
      return '/guide/routines/cooldown';
    case 'guideRoutineMobility':
      return '/guide/routines/mobility';
    case 'guideRoutineStrength':
      return '/guide/routines/strength';
    case 'guideRoutineSkill':
      return '/guide/routines/skill';
    case 'guideRoutineRecovery':
      return '/guide/routines/recovery';
    case 'feedback':
      return '/feedback';
    case 'techniques':
      return '/techniques';
    case 'exercises':
      return '/exercises';
    case 'terms':
      return '/terms';
    case 'bookmarks':
      return '/bookmarks';
    default:
      return '/';
  }
};

// Inline helper instead of exporting to fix react-refresh
const buildTechniqueUrl = buildUrl;

type TechniqueParams = {
  slug: string;
  trainerId?: string;
  entry?: EntryMode;
};

const guideRouteToGrade = (route: AppRoute): Grade | null => {
  switch (route) {
    case 'guideKyu5':
      return 'kyu5';
    case 'guideKyu4':
      return 'kyu4';
    case 'guideKyu3':
      return 'kyu3';
    case 'guideKyu2':
      return 'kyu2';
    case 'guideKyu1':
      return 'kyu1';
    case 'guideDan1':
      return 'dan1';
    case 'guideDan2':
      return 'dan2';
    case 'guideDan3':
      return 'dan3';
    case 'guideDan4':
      return 'dan4';
    case 'guideDan5':
      return 'dan5';
    default:
      return null;
  }
};

const gradeToGuideRoute = (grade: Grade): AppRoute | null => {
  switch (grade) {
    case 'kyu5':
      return 'guideKyu5';
    case 'kyu4':
      return 'guideKyu4';
    case 'kyu3':
      return 'guideKyu3';
    case 'kyu2':
      return 'guideKyu2';
    case 'kyu1':
      return 'guideKyu1';
    case 'dan1':
      return 'guideDan1';
    case 'dan2':
      return 'guideDan2';
    case 'dan3':
      return 'guideDan3';
    case 'dan4':
      return 'guideDan4';
    case 'dan5':
      return 'guideDan5';
    default:
      return null;
  }
};

const routineToGuideRoute = (routine: GuideRoutine): AppRoute => {
  switch (routine) {
    case 'warm-up':
      return 'guideRoutineWarmUp';
    case 'cooldown':
      return 'guideRoutineCooldown';
    case 'mobility':
      return 'guideRoutineMobility';
    case 'strength':
      return 'guideRoutineStrength';
    case 'skill':
      return 'guideRoutineSkill';
    case 'recovery':
      return 'guideRoutineRecovery';
  }
};

const guideRouteToRoutine = (route: AppRoute): GuideRoutine | null => {
  switch (route) {
    case 'guideRoutineWarmUp':
      return 'warm-up';
    case 'guideRoutineCooldown':
      return 'cooldown';
    case 'guideRoutineMobility':
      return 'mobility';
    case 'guideRoutineStrength':
      return 'strength';
    case 'guideRoutineSkill':
      return 'skill';
    case 'guideRoutineRecovery':
      return 'recovery';
    default:
      return null;
  }
};

const getGlossarySlugFromPath = (pathname: string): string | null => {
  const match = /^\/(?:terms|glossary)\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const getPracticeSlugFromPath = (pathname: string): string | null => {
  const match = /^\/(?:exercises|practice)\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const parseLocation = (
  pathname: string,
  state?: HistoryState,
  search?: string,
): { route: AppRoute; slug: string | null; techniqueParams?: TechniqueParams } => {
  const techniqueParams = parseTechniquePath(pathname, search);
  if (techniqueParams) {
    const fallbackRoute = state?.route ?? 'techniques';
    return { route: fallbackRoute, slug: techniqueParams.slug, techniqueParams };
  }

  if (pathname.startsWith('/terms/') || pathname.startsWith('/glossary/')) {
    const slug = getGlossarySlugFromPath(pathname);
    // Handle backwards compatibility redirects
    const slugRedirects: Record<string, string> = {
      'irimi-omote': 'irimi',
      'tenkan-ura': 'tenkan',
    };
    const finalSlug = slug && (slugRedirects[slug] || slug);
    const fallbackRoute = state?.route ?? 'terms';
    return { route: fallbackRoute, slug: finalSlug };
  }

  if (pathname.startsWith('/exercises/') || pathname.startsWith('/practice/')) {
    const slug = getPracticeSlugFromPath(pathname);
    return { route: 'exercises', slug };
  }

  if (pathname === '/bookmarks') {
    return { route: 'bookmarks', slug: null };
  }

  if (pathname === '/techniques' || pathname === '/library') {
    return { route: 'techniques', slug: null };
  }

  if (pathname === '/exercises' || pathname === '/practice') {
    return { route: 'exercises', slug: null };
  }

  if (pathname === '/terms' || pathname === '/glossary') {
    return { route: 'terms', slug: null };
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

  const guideRoutineMatch = /^\/guide\/routines\/(warm-up|cooldown|mobility|strength|skill|recovery)$/.exec(
    pathname,
  );
  if (guideRoutineMatch) {
    const [, routine] = guideRoutineMatch;
    return { route: routineToGuideRoute(routine as GuideRoutine), slug: null };
  }

  const guideGradeMatch = /^\/guide\/(\d+)-(kyu|dan)$/.exec(pathname);
  if (guideGradeMatch) {
    const [, number, type] = guideGradeMatch;
    if (type === 'kyu') {
      if (number === '5') return { route: 'guideKyu5', slug: null };
      if (number === '4') return { route: 'guideKyu4', slug: null };
      if (number === '3') return { route: 'guideKyu3', slug: null };
      if (number === '2') return { route: 'guideKyu2', slug: null };
      if (number === '1') return { route: 'guideKyu1', slug: null };
    } else if (type === 'dan') {
      if (number === '1') return { route: 'guideDan1', slug: null };
      if (number === '2') return { route: 'guideDan2', slug: null };
      if (number === '3') return { route: 'guideDan3', slug: null };
      if (number === '4') return { route: 'guideDan4', slug: null };
      if (number === '5') return { route: 'guideDan5', slug: null };
    }
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

const getInitialLocation = (): {
  route: AppRoute;
  slug: string | null;
  techniqueParams?: TechniqueParams;
} => {
  if (typeof window === 'undefined') {
    return { route: 'home', slug: null };
  }

  const state = window.history.state as HistoryState | undefined;
  return parseLocation(window.location.pathname, state, window.location.search);
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

function updateProgressEntry(
  progress: Progress[],
  id: string,
  patch: Partial<Progress>,
): Progress[] {
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

function updateGlossaryProgressEntry(
  glossaryProgress: GlossaryProgress[],
  termId: string,
  patch: Partial<GlossaryProgress>,
): GlossaryProgress[] {
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

function updateExerciseProgressEntry(
  exerciseProgress: ExerciseProgress[],
  exerciseId: string,
  patch: Partial<ExerciseProgress>,
): ExerciseProgress[] {
  const existing = exerciseProgress.find((entry) => entry.exerciseId === exerciseId);
  const timestamp = Date.now();
  const baseline: ExerciseProgress = existing ?? {
    exerciseId,
    bookmarked: false,
    updatedAt: timestamp,
  };

  const nextEntry: ExerciseProgress = {
    ...baseline,
    ...patch,
    exerciseId,
    updatedAt: timestamp,
  };

  return upsert(exerciseProgress, (entry) => entry.exerciseId === exerciseId, nextEntry);
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

const getSelectableValues = (
  techniques: Technique[],
  selector: (technique: Technique) => string | undefined,
): string[] =>
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

  const hasBaseVersions = techniques.some((technique) =>
    technique.versions.some((version) => !version.trainerId),
  );

  const values = unique(trainerIds).sort();
  if (hasBaseVersions) {
    // place 'base-forms' at the front so the option is visible
    return ['base-forms', ...values];
  }
  return values;
};

function applyFilters(techniques: Technique[], filters: Filters): Technique[] {
  return techniques
    .filter((technique) => {
      if (filters.category && technique.category !== filters.category) return false;
      if (filters.attack && technique.attack !== filters.attack) return false;
      if (filters.weapon && technique.weapon !== filters.weapon) return false;
      if (filters.level && technique.level !== filters.level) return false;
      if (filters.stance) {
        if (!isEntryMode(filters.stance)) {
          return false;
        }

        const requiredEntry: EntryMode = filters.stance;
        const hasEntryMode = technique.versions.some((version) =>
          Boolean(version.stepsByEntry?.[requiredEntry]),
        );
        if (!hasEntryMode) return false;
      }
      if (filters.trainer) {
        if (filters.trainer === 'base-forms') {
          // include techniques which have at least one base version (version without trainerId)
          if (!technique.versions.some((version) => !version.trainerId)) return false;
        } else {
          if (!technique.versions.some((version) => version.trainerId === filters.trainer))
            return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
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

export default function App({
  initialLocale = 'en',
  initialRoute,
  initialSlug,
}: AppProps): ReactElement {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [isHomePrefsReady, setIsHomePrefsReady] = useState(false);
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
  const [glossaryFilters, setGlossaryFilters] = useState<{
    category?: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other';
  }>({});
  const [practiceFilters, setPracticeFilters] = useState<ExerciseFilters>({
    categories: [],
    equipment: [],
  });
  const [selectedCollectionId, setSelectedCollectionId] = useState<SelectedCollectionId>('all');
  const [route, setRoute] = useState<AppRoute>(() =>
    initialRoute !== undefined ? initialRoute : getInitialLocation().route,
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(() =>
    initialSlug !== undefined ? initialSlug : getInitialLocation().slug,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [practiceExercises, setPracticeExercises] = useState<Exercise[]>([]);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType | null>(null);
  const [pinnedBeltGrade, setPinnedBeltGrade] = useState<Grade | null>(null);
  const [beltPromptDismissed, setBeltPromptDismissed] = useState<boolean>(false);

  const copy = getCopy(locale);
  const { pageMotion } = useMotionPreferences();
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const pendingScrollToTopRef = useRef(false);
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
    // No-op: TermsPage is now statically imported
  }, []);
  const prefetchBookmarks = useCallback(() => {
    // No-op: BookmarksView is now statically imported
  }, []);

  const navigateTo = useCallback(
    (next: AppRoute, options: { replace?: boolean; sourceRoute?: AppRoute } = {}) => {
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

  const goToFeedback = useCallback(
    (type?: FeedbackType) => {
      if (type) {
        setFeedbackInitialType(type);
      }
      navigateTo('feedback');
    },
    [navigateTo],
  );

  const openGuideGrade = useCallback(
    (grade: Grade, source?: { route: AppRoute; slug: string }) => {
      const nextRoute = gradeToGuideRoute(grade);
      if (!nextRoute) {
        navigateTo('guide');
        return;
      }

      rememberScrollPosition();
      setRoute(nextRoute);
      setActiveSlug(null);

      if (typeof window !== 'undefined') {
        const path = routeToPath(nextRoute);
        const state: HistoryState = { route: nextRoute };
        if (source) {
          state.sourceRoute = source.route;
          state.sourceSlug = source.slug;
        }

        if (window.location.pathname !== path) {
          window.history.pushState(state, '', path);
        } else {
          window.history.replaceState(state, '', path);
        }
      }
    },
    [navigateTo],
  );

  const showToast = useCallback((message: string) => {
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
  }, []);

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

  // Load practice exercises on component mount (for bookmarks)
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const exercises = await loadAllExercises();
        setPracticeExercises(exercises);
      } catch (error) {
        console.error('Failed to load practice exercises:', error);
      }
    };

    loadExercises();
  }, []);

  // Ensure exercise progress covers all known exercises
  useEffect(() => {
    if (practiceExercises.length === 0) return;
    setDB((prev) => {
      const existing = new Map(prev.exerciseProgress.map((entry) => [entry.exerciseId, entry]));
      const nextProgress = [...prev.exerciseProgress];
      let changed = false;

      practiceExercises.forEach((exercise) => {
        if (!existing.has(exercise.id)) {
          nextProgress.push({
            exerciseId: exercise.id,
            bookmarked: false,
            updatedAt: Date.now(),
          });
          changed = true;
        }
      });

      return changed ? { ...prev, exerciseProgress: nextProgress } : prev;
    });
  }, [practiceExercises]);

  const openSearch = useCallback((method: 'keyboard' | 'mouse' = 'mouse') => {
    // store how the search was opened so the overlay can adjust pointer behavior
    (openSearch as { lastOpenedBy?: 'keyboard' | 'mouse' }).lastOpenedBy = method;
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
    setLocale(loadStoredLocale() ?? initialLocale);
    setIsLocaleReady(true);
  }, [initialLocale]);

  useEffect(() => {
    setPinnedBeltGrade(loadPinnedBeltGrade());
    setBeltPromptDismissed(loadBeltPromptDismissed());
    setIsHomePrefsReady(true);
  }, []);

  useEffect(() => {
    if (!isLocaleReady) return;
    saveLocale(locale);
  }, [isLocaleReady, locale]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  useEffect(() => {
    if (!isHomePrefsReady) return;
    savePinnedBeltGrade(pinnedBeltGrade);
  }, [isHomePrefsReady, pinnedBeltGrade]);

  useEffect(() => {
    if (!isHomePrefsReady) return;
    saveBeltPromptDismissed(beltPromptDismissed);
  }, [beltPromptDismissed, isHomePrefsReady]);

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

  useKeyboardShortcuts(openSearch);

  // no-op placeholder: scroll/animation behavior is coordinated via
  // navigationLifecycle and the skipEntranceAnimations flag above.

  // Idle prefetch both heavy chunks after initial render
  useEffect(() => {
    const idle = (cb: () => void) =>
      (
        window as Window & {
          requestIdleCallback?: (cb: () => void, options: { timeout: number }) => void;
        }
      ).requestIdleCallback
        ? (
            window as Window & {
              requestIdleCallback?: (cb: () => void, options: { timeout: number }) => void;
            }
          ).requestIdleCallback(cb, { timeout: 1500 })
        : setTimeout(cb, 600);
    idle(() => {
      prefetchTechniquePage();
      prefetchFeedbackPage();
      prefetchGlossary();
      prefetchBookmarks();
    });
  }, [prefetchTechniquePage, prefetchFeedbackPage, prefetchGlossary, prefetchBookmarks]);

  useEffect(() => {
    if (
      hasManualTheme ||
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
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
  const trainers = useMemo(() => getTrainerValues(db.techniques), [db.techniques]);

  // Term categories - all possible categories sorted alphabetically by localized label
  const glossaryCategories: (
    | 'movement'
    | 'stance'
    | 'attack'
    | 'etiquette'
    | 'philosophy'
    | 'other'
  )[] = useMemo(() => {
    const allCategories: (
      | 'movement'
      | 'stance'
      | 'attack'
      | 'etiquette'
      | 'philosophy'
      | 'other'
    )[] = ['movement', 'stance', 'attack', 'etiquette', 'philosophy', 'other'];

    const copy = getCopy(locale);
    const getCategoryLabel = (
      category: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other',
    ): string => {
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
        caseFirst: 'upper',
      }),
    );
  }, [locale]);

  const practiceCategories: PracticeCategory[] = useMemo(() => {
    const allCategories: PracticeCategory[] = [
      'mobility',
      'strength',
      'core',
      'balance',
      'coordination',
      'power',
      'recovery',
    ];

    return allCategories.sort((a, b) =>
      getExerciseCategoryLabel(a, copy).localeCompare(getExerciseCategoryLabel(b, copy), locale, {
        sensitivity: 'accent',
        caseFirst: 'upper',
      }),
    );
  }, [copy, locale]);

  const filteredTechniques = useMemo(
    () => applyFilters(db.techniques, filters),
    [db.techniques, filters],
  );

  const currentTechnique = useMemo(
    () =>
      activeSlug
        ? (db.techniques.find((technique) => technique.slug === activeSlug) ?? null)
        : null,
    [db.techniques, activeSlug],
  );

  const currentProgress = useMemo(
    () =>
      currentTechnique
        ? (db.progress.find((entry) => entry.techniqueId === currentTechnique.id) ?? null)
        : null,
    [db.progress, currentTechnique],
  );

  const currentGlossaryTerm = useMemo(
    () => (activeSlug ? (glossaryTerms.find((term) => term.slug === activeSlug) ?? null) : null),
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
    const normalizedPatch: Partial<Progress> =
      patch.bookmarked === false ? { ...patch, bookmarkedVariant: undefined } : patch;

    setDB((prev) => {
      const nextProgress = updateProgressEntry(prev.progress, id, normalizedPatch);
      const shouldRemoveAssignments = normalizedPatch.bookmarked === false;
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
      const nextGlossaryProgress = updateGlossaryProgressEntry(
        prev.glossaryProgress,
        termId,
        patch,
      );
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

  const updateExerciseProgress = (exerciseId: string, patch: Partial<ExerciseProgress>): void => {
    setDB((prev) => {
      const nextExerciseProgress = updateExerciseProgressEntry(
        prev.exerciseProgress,
        exerciseId,
        patch,
      );
      const shouldRemoveAssignments = patch.bookmarked === false;
      const nextExerciseBookmarkCollections = shouldRemoveAssignments
        ? prev.exerciseBookmarkCollections.filter((entry) => entry.exerciseId !== exerciseId)
        : prev.exerciseBookmarkCollections;
      return {
        ...prev,
        exerciseProgress: nextExerciseProgress,
        exerciseBookmarkCollections: nextExerciseBookmarkCollections,
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
      collections: sortCollectionsByName(
        prev.collections.filter((collection) => collection.id !== id),
      ),
      bookmarkCollections: prev.bookmarkCollections.filter((entry) => entry.collectionId !== id),
      glossaryBookmarkCollections: prev.glossaryBookmarkCollections.filter(
        (entry) => entry.collectionId !== id,
      ),
      exerciseBookmarkCollections: prev.exerciseBookmarkCollections.filter(
        (entry) => entry.collectionId !== id,
      ),
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
          nextProgress = [...prev.progress, { techniqueId, bookmarked: true, updatedAt: now }];
        }
      }

      if (
        prev.bookmarkCollections.some(
          (entry) => entry.techniqueId === techniqueId && entry.collectionId === collectionId,
        )
      ) {
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

      if (
        prev.glossaryBookmarkCollections.some(
          (entry) => entry.termId === termId && entry.collectionId === collectionId,
        )
      ) {
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

  const assignExerciseToCollection = (exerciseId: string, collectionId: string): void => {
    setDB((prev) => {
      const progressEntry = prev.exerciseProgress.find((entry) => entry.exerciseId === exerciseId);
      const isBookmarked = progressEntry?.bookmarked;

      let nextExerciseProgress = prev.exerciseProgress;
      if (!isBookmarked) {
        const now = Date.now();
        if (progressEntry) {
          nextExerciseProgress = prev.exerciseProgress.map((p) =>
            p.exerciseId === exerciseId ? { ...p, bookmarked: true, updatedAt: now } : p,
          );
        } else {
          nextExerciseProgress = [
            ...prev.exerciseProgress,
            { exerciseId, bookmarked: true, updatedAt: now },
          ];
        }
      }

      if (
        prev.exerciseBookmarkCollections.some(
          (entry) => entry.exerciseId === exerciseId && entry.collectionId === collectionId,
        )
      ) {
        return { ...prev, exerciseProgress: nextExerciseProgress };
      }

      const now = Date.now();

      return {
        ...prev,
        exerciseProgress: nextExerciseProgress,
        exerciseBookmarkCollections: [
          ...prev.exerciseBookmarkCollections,
          {
            id: generateId(),
            exerciseId,
            collectionId,
            createdAt: now,
          },
        ],
      };
    });
  };

  const removeExerciseFromCollection = (exerciseId: string, collectionId: string): void => {
    setDB((prev) => ({
      ...prev,
      exerciseBookmarkCollections: prev.exerciseBookmarkCollections.filter(
        (entry) => !(entry.exerciseId === exerciseId && entry.collectionId === collectionId),
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

  const openTechnique = (
    slug: string,
    trainerId?: string,
    entry?: EntryMode,
    skipExistenceCheck?: boolean,
    options?: { originRoute?: AppRoute },
    bookmarkedVariant?: TechniqueVariantKey,
  ): void => {
    rememberScrollPosition();
    if (!skipExistenceCheck && !db.techniques.some((technique) => technique.slug === slug)) {
      return;
    }

    const sourceRoute = options?.originRoute ?? route;
    const tabRoute = sourceRoute === 'bookmarks' ? 'techniques' : sourceRoute;
    if (tabRoute !== route) {
      setRoute(tabRoute);
    }

    // If the caller didn't pass explicit trainer/entry params, try to apply
    // the current global filters so the technique opens to the matching
    // version/variation (direction/weapon/version). Fallback to the
    // legacy trainer/entry URL shape when no matching variant is found.
    let finalPath: string;
    let state: HistoryState = { route: tabRoute, slug, trainerId, entry, sourceRoute };

    if (bookmarkedVariant) {
      finalPath = buildTechniqueUrlWithVariant(slug, {
        hanmi: bookmarkedVariant.hanmi,
        direction: bookmarkedVariant.direction,
        weapon: bookmarkedVariant.weapon,
        versionId: bookmarkedVariant.versionId ?? null,
      });
      state = {
        route: tabRoute,
        slug,
        entry: bookmarkedVariant.direction,
        sourceRoute,
      };
    } else {
      const shouldAutoApplyFilters =
        !trainerId && !entry && (filters.trainer || filters.stance || filters.weapon);

      if (shouldAutoApplyFilters) {
        const technique = db.techniques.find((t) => t.slug === slug);
        if (technique) {
          const enriched = enrichTechniqueWithVariants(technique);

          // Map filter values to toolbar/variant values
          const direction = (filters.stance as Direction | undefined) ?? undefined; // irimi/tenkan/omote/ura
          const weaponFilter = filters.weapon as string | undefined;
          const weapon = weaponFilter
            ? weaponFilter === 'empty-hand'
              ? 'empty'
              : (weaponFilter as WeaponKind)
            : undefined;

          // Determine versionId candidate from trainer filter
          let versionIdCandidate: string | null | undefined = undefined;
          if (filters.trainer) {
            if (filters.trainer === 'base-forms') {
              // prefer a base version (null) if available
              const hasBase = (technique.versions || []).some(
                (v) => !v.trainerId || v.id === 'v-base',
              );
              versionIdCandidate = hasBase ? null : undefined;
            }
            if (versionIdCandidate === undefined) {
              // try to find a version authored by the selected trainer
              const authorVersion = (technique.versions || []).find(
                (v) => v.trainerId === filters.trainer,
              );
              if (authorVersion) versionIdCandidate = authorVersion.id;
            }
          }

          // Try to find the best matching variant
          const variants = enriched.variants || [];

          const matchPredicate = (v: TechniqueVariant) => {
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
            state = {
              route: tabRoute,
              slug,
              trainerId: filters.trainer,
              entry: (filters.stance as EntryMode) ?? undefined,
              sourceRoute,
            };
          } else {
            // fallback to legacy path with trainer/entry if available
            finalPath = buildTechniqueUrl(
              slug,
              filters.trainer ?? undefined,
              (filters.stance as EntryMode | undefined) ?? undefined,
            );
            state = {
              route: tabRoute,
              slug,
              trainerId: filters.trainer,
              entry: (filters.stance as EntryMode) ?? undefined,
              sourceRoute,
            };
          }
        } else {
          // technique not found in DB (edge case) - fallback to basic path
          finalPath = buildTechniqueUrl(slug, trainerId, entry);
        }
      } else {
        // explicit params were provided — respect them
        finalPath = buildTechniqueUrl(slug, trainerId, entry);
      }
    }

    if (typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (currentPath !== finalPath) {
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
    const nextRoute = route === 'home' || route === 'bookmarks' ? 'terms' : route;

    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(finalSlug);
      const glossaryPath = `/terms/${encodedSlug}`;
      // Push the current route into history state so the detail page knows where it was opened from
      const state: HistoryState = { route: nextRoute, slug: finalSlug, sourceRoute: route };

      if (window.location.pathname !== glossaryPath) {
        window.history.pushState(state, '', glossaryPath);
      } else {
        window.history.replaceState(state, '', glossaryPath);
      }
    }

    // Mirror technique behavior: set active slug but keep `route` unchanged unless coming from home,
    // where we want the glossary tab highlighted.
    if (route === 'home' || route === 'bookmarks') {
      setRoute('terms');
    }
    setActiveSlug(finalSlug);
  };

  const openPracticeExercise = (slug: string): void => {
    rememberScrollPosition();
    const nextRoute = route === 'home' || route === 'bookmarks' ? 'exercises' : route;

    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(slug);
      const practicePath = `/exercises/${encodedSlug}`;
      const state: HistoryState = { route: nextRoute, slug, sourceRoute: route };

      if (window.location.pathname !== practicePath) {
        window.history.pushState(state, '', practicePath);
      } else {
        window.history.replaceState(state, '', practicePath);
      }
    }

    if (route === 'home' || route === 'bookmarks') {
      setRoute('exercises');
    }
    setActiveSlug(slug);
  };

  const togglePinnedBeltGrade = useCallback((grade: Grade) => {
    setPinnedBeltGrade((current) => (current === grade ? null : grade));
  }, []);

  const handleOpenGuideFromPrompt = useCallback(() => {
    setBeltPromptDismissed(true);
    navigateTo('guide');
  }, [navigateTo]);

  const navigateToGuideGrade = useCallback(
    (grade: Grade, sourceRoute?: AppRoute) => {
      switch (grade) {
        case 'kyu5':
          navigateTo('guideKyu5', { sourceRoute });
          break;
        case 'kyu4':
          navigateTo('guideKyu4', { sourceRoute });
          break;
        case 'kyu3':
          navigateTo('guideKyu3', { sourceRoute });
          break;
        case 'kyu2':
          navigateTo('guideKyu2', { sourceRoute });
          break;
        case 'kyu1':
          navigateTo('guideKyu1', { sourceRoute });
          break;
        case 'dan1':
          navigateTo('guideDan1', { sourceRoute });
          break;
        case 'dan2':
          navigateTo('guideDan2', { sourceRoute });
          break;
        case 'dan3':
          navigateTo('guideDan3', { sourceRoute });
          break;
        case 'dan4':
          navigateTo('guideDan4', { sourceRoute });
          break;
        case 'dan5':
          navigateTo('guideDan5', { sourceRoute });
          break;
        default:
          navigateTo('guide', { sourceRoute });
          break;
      }
    },
    [navigateTo],
  );

  const navigateToGuideRoutine = useCallback(
    (routine: GuideRoutine, sourceRoute?: AppRoute) => {
      navigateTo(routineToGuideRoute(routine), { sourceRoute });
    },
    [navigateTo],
  );

  const techniqueHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const techniqueBackRoute = techniqueHistoryState?.sourceRoute ?? route;
  const closeTechnique = (): void => {
    navigateTo(techniqueBackRoute, { replace: true });
  };

  // focus/confident toggles removed — using bookmark only now

  const toggleBookmark = (
    technique: Technique,
    entry: Progress | null,
    bookmarkedVariant: TechniqueVariantKey,
  ): void => {
    const nextBookmarked = !entry?.bookmarked;
    updateProgress(technique.id, {
      bookmarked: nextBookmarked,
      bookmarkedVariant: nextBookmarked ? bookmarkedVariant : undefined,
    });
  };

  const toggleExerciseBookmark = (exerciseId: string, nextBookmarked: boolean): void => {
    updateExerciseProgress(exerciseId, {
      bookmarked: nextBookmarked,
    });
  };

  const techniqueNotFound =
    Boolean(activeSlug) && !currentTechnique && route !== 'terms' && route !== 'exercises';

  const flushScrollToTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!pendingScrollToTopRef.current) return;
    pendingScrollToTopRef.current = false;
    // Use a micro task to ensure any route transition DOM updates happen first.
    Promise.resolve().then(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
  }, []);

  // Ensure we scroll to the top whenever navigation changes to a new page or detail view.
  // This guarantees that if the user was scrolled down on the previous page, opening
  // a new route, technique, or glossary term always starts at the top of the page.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (consumeBFCacheRestoreFlag()) {
      return;
    }
    pendingScrollToTopRef.current = true;
    if (skipEntranceAnimations || animationsDisabled) {
      flushScrollToTop();
    }
  }, [
    route,
    activeSlug,
    currentTechnique?.id,
    skipEntranceAnimations,
    animationsDisabled,
    flushScrollToTop,
  ]);

  const techniqueBackLabel =
    techniqueBackRoute === 'bookmarks'
      ? copy.backToBookmarks
      : techniqueBackRoute === 'home'
        ? copy.backToHome
        : techniqueBackRoute === 'about'
          ? copy.backToAbout
          : techniqueBackRoute === 'guide'
              ? copy.backToGuide
              : techniqueBackRoute === 'terms'
                ? copy.backToGlossary
                : techniqueBackRoute === 'feedback'
                  ? copy.backToFeedback
                  : copy.backToLibrary;

  const glossaryHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const glossaryBackRoute = glossaryHistoryState?.sourceRoute ?? route;
  const glossaryBackLabel =
    glossaryBackRoute === 'bookmarks'
      ? copy.backToBookmarks
      : glossaryBackRoute === 'home'
        ? copy.backToHome
        : glossaryBackRoute === 'about'
          ? copy.backToAbout
          : glossaryBackRoute === 'guide'
              ? copy.backToGuide
              : glossaryBackRoute === 'feedback'
                ? copy.backToFeedback
                : copy.backToGlossary;

  const practiceHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const practiceBackRoute = practiceHistoryState?.sourceRoute ?? route;
  const practiceBackLabel =
    practiceBackRoute === 'bookmarks'
      ? copy.backToBookmarks
      : practiceBackRoute === 'home'
        ? copy.backToHome
        : practiceBackRoute === 'about'
          ? copy.backToAbout
          : practiceBackRoute === 'guide'
              ? copy.backToGuide
              : practiceBackRoute === 'feedback'
                ? copy.backToFeedback
                : copy.backToPractice;

  const guideHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const guideBackLabel = guideHistoryState?.sourceSlug
    ? copy.backToTechnique
    : guideHistoryState?.sourceRoute === 'home'
      ? copy.backToHome
      : copy.backToGuide;
  const handleGuideBack = (): void => {
    if (guideHistoryState?.sourceSlug) {
      openTechnique(guideHistoryState.sourceSlug, undefined, undefined, true, {
        originRoute: guideHistoryState.sourceRoute ?? 'techniques',
      });
      return;
    }
    if (guideHistoryState?.sourceRoute === 'home') {
      navigateTo('home');
      return;
    }
    navigateTo('guide');
  };

  let mainContent: ReactElement;

  if (currentTechnique) {
    mainContent = (
      <motion.div
        initial={skipEntranceAnimations ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={pageMotion.transition}
        style={{ willChange: 'opacity' }}
      >
        <TechniquePage
          technique={currentTechnique}
          progress={currentProgress ?? null}
          copy={copy}
          locale={locale}
          backLabel={techniqueBackLabel}
          onBack={() => closeTechnique()}
          onToggleBookmark={(bookmarkedVariant) =>
            toggleBookmark(currentTechnique, currentProgress ?? null, bookmarkedVariant)
          }
          collections={db.collections}
          bookmarkCollections={db.bookmarkCollections}
          onAssignToCollection={(collectionId) =>
            assignToCollection(currentTechnique.id, collectionId)
          }
          onRemoveFromCollection={(collectionId) =>
            removeFromCollection(currentTechnique.id, collectionId)
          }
          onOpenGlossary={openGlossaryTerm}
          onOpenGuideGrade={(grade) => {
            openGuideGrade(grade, { route, slug: currentTechnique.slug });
          }}
          onFeedbackClick={() => goToFeedback()}
          onCreateCollection={createCollection}
        />
      </motion.div>
    );
  } else if (currentGlossaryTerm) {
    // Render glossary detail when an active glossary term is set, regardless of current route
    mainContent = (
      <TermDetailPage
        slug={activeSlug!}
        copy={copy}
        locale={locale}
        backLabel={glossaryBackLabel}
        // Back should navigate to the route the user came from (stored in history state) —
        // when opened from bookmarks the current `route` will still be 'bookmarks', so navigate there.
        onBack={() => navigateTo(glossaryBackRoute, { replace: true })}
        isBookmarked={Boolean(currentGlossaryProgress?.bookmarked)}
        onToggleBookmark={() =>
          updateGlossaryProgress(activeSlug!, { bookmarked: !currentGlossaryProgress?.bookmarked })
        }
        collections={glossaryCollectionOptions}
        onToggleCollection={(collectionId, nextChecked) => {
          if (nextChecked) {
            assignGlossaryToCollection(activeSlug!, collectionId);
          } else {
            removeGlossaryFromCollection(activeSlug!, collectionId);
          }
        }}
        onCreateCollection={createCollection}
        onNavigateToTermsWithFilter={(category) => {
          setGlossaryFilters({ category });
          prefetchGlossary();
          navigateTo('terms');
        }}
      />
    );
  } else if (route === 'exercises' && activeSlug) {
    mainContent = (
      <ExerciseDetailPage
        slug={activeSlug}
        copy={copy}
        locale={locale}
        collections={db.collections}
        exerciseProgress={db.exerciseProgress}
        exerciseBookmarkCollections={db.exerciseBookmarkCollections}
        onToggleBookmark={toggleExerciseBookmark}
        onAssignToCollection={assignExerciseToCollection}
        onRemoveFromCollection={removeExerciseFromCollection}
        onCreateCollection={createCollection}
        backLabel={practiceBackLabel}
        onNavigateToExercisesWithFilter={(nextFilters) => {
          setPracticeFilters(nextFilters);
          navigateTo('exercises', { replace: true });
        }}
        onBack={() => navigateTo(practiceBackRoute, { replace: true })}
      />
    );
  } else if (techniqueNotFound) {
    mainContent = (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4 text-center">
        <p className="text-lg font-semibold">Technique not found.</p>
        <button
          type="button"
          onClick={() => navigateTo('techniques', { replace: true })}
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
        techniques={db.techniques}
        techniqueProgress={db.progress}
        glossaryTerms={glossaryTerms}
        exercises={practiceExercises}
        onOpenTechnique={openTechnique}
        onOpenGlossaryTerm={openGlossaryTerm}
        onOpenExercise={openPracticeExercise}
        pinnedBeltGrade={pinnedBeltGrade}
        onOpenPinnedBeltGrade={(grade) => navigateToGuideGrade(grade, 'home')}
        beltPromptDismissed={beltPromptDismissed}
        onOpenGuideFromPrompt={handleOpenGuideFromPrompt}
      />
    );
  } else if (route === 'about') {
    mainContent = <AboutPage copy={copy} />;
  } else if (route === 'guideAdvanced') {
    mainContent = (
      <AdvancedPrograms
        locale={locale}
        onOpenTechnique={openTechnique}
        onBack={() => navigateTo('guide')}
      />
    );
  } else if (route === 'guideDan') {
    mainContent = <DanOverview locale={locale} onBack={() => navigateTo('guide')} />;
  } else if (guideRouteToRoutine(route)) {
    const routine = guideRouteToRoutine(route) as GuideRoutine;
    const routineContent = copy.guidePage.routines.find((entry) => entry.id === routine);
    mainContent = (
      <GuideRoutinePage
        copy={copy}
        locale={locale}
        title={routineContent?.title ?? ''}
        description={routineContent?.description ?? ''}
        onBack={() => navigateTo('guide')}
      />
    );
  } else if (guideRouteToGrade(route)) {
    const grade = guideRouteToGrade(route) as Grade;
    mainContent = (
      <GuideGradePage
        copy={copy}
        locale={locale}
        grade={grade}
        backLabel={guideBackLabel}
        onBack={handleGuideBack}
        pinnedBeltGrade={pinnedBeltGrade}
        onTogglePin={togglePinnedBeltGrade}
      />
    );
  } else if (route === 'guide') {
    mainContent = (
      <GuidePage
        locale={locale}
        onNavigateToGuideGrade={navigateToGuideGrade}
        onNavigateToRoutine={navigateToGuideRoutine}
        onOpenTechnique={openTechnique}
        onNavigateToAdvanced={() => navigateTo('guideAdvanced')}
        onNavigateToDan={() => navigateTo('guideDan')}
      />
    );
  } else if (route === 'feedback') {
    mainContent = (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={pageMotion.transition}
        style={{ willChange: 'opacity' }}
      >
        <FeedbackPage
          copy={copy}
          locale={locale}
          techniques={db.techniques}
          onBack={() => navigateTo('techniques')}
          initialType={feedbackInitialType}
          onConsumeInitialType={() => setFeedbackInitialType(null)}
        />
      </motion.div>
    );
  } else {
    mainContent = (
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-4 space-y-4">
        {route === 'techniques' && (
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
                <TechniquesPage
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

        {route === 'exercises' && (
          <>
            <div className="lg:hidden">
              <MobileExercisesFilters
                copy={copy}
                filters={practiceFilters}
                categories={practiceCategories}
                onChange={setPracticeFilters}
              />
            </div>
            <div className="relative">
              <ExpandableFilterBar label={copy.filters}>
                <ExercisesFilterPanel
                  copy={copy}
                  filters={practiceFilters}
                  categories={practiceCategories}
                  onChange={setPracticeFilters}
                />
              </ExpandableFilterBar>
              <section>
                <ExercisesPage
                  copy={copy}
                  locale={locale}
                  filters={practiceFilters}
                  onOpenExercise={openPracticeExercise}
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
            exercises={practiceExercises}
            glossaryTerms={glossaryTerms}
            progress={db.progress}
            glossaryProgress={db.glossaryProgress}
            exerciseProgress={db.exerciseProgress}
            collections={db.collections}
            bookmarkCollections={db.bookmarkCollections}
            glossaryBookmarkCollections={db.glossaryBookmarkCollections}
            exerciseBookmarkCollections={db.exerciseBookmarkCollections}
            selectedCollectionId={selectedCollectionId}
            onSelectCollection={(id) => setSelectedCollectionId(id)}
            onCreateCollection={createCollection}
            onRenameCollection={renameCollection}
            onDeleteCollection={deleteCollection}
            onAssign={assignToCollection}
            onUnassign={removeFromCollection}
            onAssignGlossary={assignGlossaryToCollection}
            onUnassignGlossary={removeGlossaryFromCollection}
            onAssignExercise={assignExerciseToCollection}
            onUnassignExercise={removeExerciseFromCollection}
            onOpenTechnique={(slug, bookmarkedVariant) =>
              openTechnique(
                slug,
                undefined,
                undefined,
                undefined,
                { originRoute: 'bookmarks' },
                bookmarkedVariant,
              )
            }
            onOpenGlossaryTerm={(slug) => openGlossaryTerm(slug)}
            onOpenExercise={openPracticeExercise}
          />
        )}

        {route === 'terms' && (
          <>
            {activeSlug ? (
              <TermDetailPage
                slug={activeSlug}
                copy={copy}
                locale={locale}
                backLabel={glossaryBackLabel}
                onBack={() => navigateTo('terms', { replace: true })}
                isBookmarked={Boolean(currentGlossaryProgress?.bookmarked)}
                onToggleBookmark={() =>
                  updateGlossaryProgress(activeSlug, {
                    bookmarked: !currentGlossaryProgress?.bookmarked,
                  })
                }
                collections={glossaryCollectionOptions}
                onToggleCollection={(collectionId, nextChecked) => {
                  if (nextChecked) {
                    assignGlossaryToCollection(activeSlug, collectionId);
                  } else {
                    removeGlossaryFromCollection(activeSlug, collectionId);
                  }
                }}
                onCreateCollection={createCollection}
                onNavigateToTermsWithFilter={(category) => {
                  setGlossaryFilters({ category });
                  navigateTo('terms');
                }}
              />
            ) : (
              <>
                <div className="lg:hidden">
                  <MobileTermsFilters
                    copy={copy}
                    filters={glossaryFilters}
                    categories={glossaryCategories}
                    onChange={setGlossaryFilters}
                  />
                </div>
                <div className="relative">
                  <ExpandableFilterBar label={copy.filters}>
                    <TermsFilterPanel
                      copy={copy}
                      filters={glossaryFilters}
                      categories={glossaryCategories}
                      onChange={setGlossaryFilters}
                    />
                  </ExpandableFilterBar>
                  <section>
                    <TermsPage
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

  const pageKey = currentTechnique
    ? `technique-${currentTechnique.id}`
    : route === 'exercises' && activeSlug
      ? `exercises-${activeSlug}`
      : activeSlug
        ? `terms-${activeSlug}`
        : route;

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

        <AnimatePresence
          mode={skipEntranceAnimations ? 'sync' : 'wait'}
          initial={!skipEntranceAnimations}
          onExitComplete={flushScrollToTop}
        >
          <motion.main
            key={pageKey}
            variants={pageMotion.variants}
            initial={skipEntranceAnimations ? 'animate' : 'initial'}
            animate="animate"
            transition={pageMotion.transition}
            className="flex-1 pb-24 md:pb-0"
            style={{ willChange: 'opacity' }}
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
              exercises={practiceExercises}
              progress={db.progress}
              glossaryProgress={db.glossaryProgress}
              exerciseProgress={db.exerciseProgress}
              onClose={closeSearch}
              onOpen={(slug) => {
                openTechnique(slug);
                closeSearch();
              }}
              onOpenGlossary={(slug) => {
                openGlossaryTerm(slug);
                closeSearch();
              }}
              onOpenExercise={(slug) => {
                openPracticeExercise(slug);
                closeSearch();
              }}
              onToggleTechniqueBookmark={(techniqueId: string) =>
                updateProgress(techniqueId, {
                  bookmarked: !db.progress.find((p) => p.techniqueId === techniqueId)?.bookmarked,
                })
              }
              onToggleGlossaryBookmark={(termId: string) =>
                updateGlossaryProgress(termId, {
                  bookmarked: !db.glossaryProgress.find((g) => g.termId === termId)?.bookmarked,
                })
              }
              onToggleExerciseBookmark={(exerciseId: string) =>
                updateExerciseProgress(exerciseId, {
                  bookmarked: !db.exerciseProgress.find((p) => p.exerciseId === exerciseId)
                    ?.bookmarked,
                })
              }
              openedBy={
                (openSearch as { lastOpenedBy?: 'keyboard' | 'mouse' }).lastOpenedBy ?? 'mouse'
              }
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
