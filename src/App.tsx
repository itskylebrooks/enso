'use client';

import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
import {
  orderLearnCards,
  type LearnCard,
  type LearnSession,
  type LearnSetupOptions,
} from '@features/learn';
import { ONBOARDING_TOUR_SEGMENTS } from '@features/onboarding/constants';
import { AppShell } from '@shared/components/layout/AppShell';
import { useMotionPreferences } from '@shared/components/ui/motion';
import {
  buildTechniqueUrlWithVariant,
  buildTechniqueUrl as buildUrl,
} from '@shared/constants/urls';
import { enrichTechniqueWithVariants } from '@shared/constants/variantMapping';
import {
  buildGuideRoutinePath,
  gradeToGuideRoute,
  guideRouteToRoutine,
  isGuideLikeRoute,
  routeToPath,
  routineToGuideRoute,
  type HistoryState,
} from '@shared/navigation/appRoutes';
import { useAppNavigation } from '@shared/navigation/useAppNavigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AppScreenRouter } from './shared/app/AppScreenRouter';
import { generateId, getGlossaryCollectionOptions } from './shared/app/appModel';
import { useContentController } from './shared/app/useContentController';
import {
  usePreferencesController,
  type PreferencesSyncController,
} from './shared/app/usePreferencesController';
import { useSyncController } from './shared/app/useSyncController';
import { useUserLibraryController } from './shared/app/useUserLibraryController';
import { getCopy } from './shared/constants/i18n';
import useLockBodyScroll from './shared/hooks/useLockBodyScroll';
import {
  clearDB,
  clearFilters,
  loadDB,
  loadDefaultDB,
  loadOnboardingCompleted,
  loadOnboardingDismissed,
  loadOnboardingStep,
  saveDB,
  saveOnboardingCompleted,
  saveOnboardingDismissed,
  saveOnboardingStep,
} from './shared/services/storageService';
import type {
  AppRoute,
  DB,
  Direction,
  EntryMode,
  Grade,
  GuideRoutine,
  Locale,
  TechniqueVariant,
  TechniqueVariantKey,
  WeaponKind,
} from './shared/types';
import {
  cameFromBackForwardNavigation,
  consumeBFCacheRestoreFlag,
  rememberScrollPosition,
} from './shared/utils/navigationLifecycle';
import { isStudyCollectionId } from './shared/utils/studyStatus';

const normalizeTourSegmentIndex = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const maxIndex = ONBOARDING_TOUR_SEGMENTS.length - 1;
  if (value < 0) return 0;
  if (value > maxIndex) return maxIndex;
  return Math.trunc(value);
};

type SelectedCollectionId = 'all' | 'ungrouped' | string;

type AppProps = {
  initialLocale?: Locale;
  initialRoute?: AppRoute;
  initialSlug?: string | null;
};

// Inline helper instead of exporting to fix react-refresh
const buildTechniqueUrl = buildUrl;

const isEditableElement = (element: EventTarget | null): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const tag = element.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || element.isContentEditable || tag === 'select';
};

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
  const [db, setDB] = useState<DB>(() => loadDefaultDB());
  const [isDBReady, setIsDBReady] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<SelectedCollectionId>('all');
  const { route, setRoute, activeSlug, setActiveSlug, navigateTo } = useAppNavigation({
    initialRoute,
    initialSlug,
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteAccountOpen, setConfirmDeleteAccountOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [feedbackInitialType, setFeedbackInitialType] = useState<FeedbackType | null>(null);
  const [learnSession, setLearnSession] = useState<LearnSession | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() =>
    loadOnboardingDismissed(),
  );
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() =>
    loadOnboardingCompleted(),
  );
  const [tourOpen, setTourOpen] = useState(false);
  const [tourSegmentIndex, setTourSegmentIndex] = useState<number>(() =>
    normalizeTourSegmentIndex(loadOnboardingStep()),
  );
  const [tourCompletionVisible, setTourCompletionVisible] = useState(false);
  const [showTourCompletionConfetti, setShowTourCompletionConfetti] = useState(false);

  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const pendingScrollToTopRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const dbPersistedRef = useRef(false);
  const onboardingDismissedPersistedRef = useRef(false);
  const onboardingCompletedPersistedRef = useRef(false);
  const preferencesSyncRef = useRef<PreferencesSyncController | null>(null);
  const {
    state: { authSession, isAuthBootstrapping, syncStatus, syncError, syncMeta, isOnline },
    refs: { syncPauseAutoPushRef, lastAppliedSyncSnapshotRef },
    actions: {
      setSyncMeta,
      markSyncMutationPending,
      addSyncTombstones,
      markDBChanged,
      markSettingsChanged,
      markHomepageChanged,
      scheduleAutoSync,
      syncNow,
      requestOtpForSync,
      verifyOtpForSync,
      signOutFromSync,
      deleteAccountFromSync,
      markSyncedDBCleared,
      getCurrentDBSyncSnapshot,
      getCurrentHomepageSyncSnapshot,
    },
  } = useSyncController({
    db,
    setDB,
    preferencesSyncRef,
    setOnboardingDismissed,
    setOnboardingCompleted,
    setTourSegmentIndex,
  });
  const {
    settings: { locale, theme, hasManualTheme, filters, glossaryFilters, practiceFilters },
    homepage: { pinnedBeltGrade, beltPromptDismissed },
    actions: {
      setFilters,
      setGlossaryFilters,
      setPracticeFilters,
      setBeltPromptDismissed,
      handleLocaleChange,
      handleThemeChange,
      togglePinnedBeltGrade,
    },
    sync: preferencesSync,
  } = usePreferencesController({
    initialLocale,
    onboardingDismissed,
    onboardingCompleted,
    markSettingsChanged,
    markHomepageChanged,
    scheduleAutoSync,
    setSyncMeta,
    syncPauseAutoPushRef,
    lastAppliedSyncSnapshotRef,
  });
  preferencesSyncRef.current = preferencesSync;
  const copy = getCopy(locale);
  const { pageMotion, prefersReducedMotion } = useMotionPreferences();
  const {
    glossaryTerms,
    practiceExercises,
    categories,
    attacks,
    stances,
    weapons,
    trainers,
    glossaryCategories,
    practiceCategories,
    filteredTechniques,
    currentTechnique,
    currentProgress,
    currentGlossaryTerm,
    currentGlossaryProgress,
    currentGlossaryStudyStatus,
    currentExerciseStudyStatus,
  } = useContentController({
    db,
    route,
    activeSlug,
    filters,
    locale,
    copy,
  });
  // Detect if this render follows a back/forward restore and skip entrance
  // animations to avoid the brief re-appearance/flicker on iOS Safari.
  const skipEntranceAnimations = cameFromBackForwardNavigation();

  const prefetchFeedbackPage = useCallback(() => {
    // Component APIs still accept prefetch callbacks; pages are static imports now.
  }, []);

  const startLearnSession = useCallback(
    (
      cards: LearnCard[],
      options: LearnSetupOptions,
      sourceRoute: AppRoute,
      sourceLabel: string,
    ) => {
      if (cards.length === 0) return;
      setLearnSession({
        id: generateId(),
        cards: orderLearnCards(cards, options.order),
        options,
        sourceRoute,
        sourceLabel,
      });
      navigateTo('learn');
    },
    [navigateTo],
  );

  const goToFeedback = useCallback(
    (type?: FeedbackType) => {
      setFeedbackInitialType(type ?? null);
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
    [navigateTo, setActiveSlug, setRoute],
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

  const handleConfirmDeleteAccount = useCallback(async (): Promise<void> => {
    await deleteAccountFromSync();
    setConfirmDeleteAccountOpen(false);
  }, [deleteAccountFromSync]);

  // Prevent page scroll while overlays/modals are open
  useLockBodyScroll(
    searchOpen || settingsOpen || confirmClearOpen || confirmDeleteAccountOpen || tourOpen,
  );

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
    setConfirmDeleteAccountOpen(false);
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
    const now = Date.now();
    const nextDB = clearDB();
    markSyncedDBCleared(now);
    setDB(nextDB);
    handleCancelClear();
    showToast(copy.toastDataCleared);
  }, [copy.toastDataCleared, handleCancelClear, markSyncedDBCleared, setDB, showToast]);

  const handleRequestDeleteAccount = useCallback(() => {
    setConfirmDeleteAccountOpen(true);
  }, []);

  const handleCancelDeleteAccount = useCallback(() => {
    setConfirmDeleteAccountOpen(false);
  }, []);

  // When clearing the DB, also clear persisted filters to avoid stale state
  useEffect(() => {
    // detect when DB becomes the default (clearDB was called)
    if (db.techniques.length === 0) {
      // unlikely — keep as a safety net
      clearFilters();
    }
  }, [db]);

  useEffect(() => {
    setDB(loadDB());
    setIsDBReady(true);
  }, []);

  useEffect(() => {
    if (!isDBReady) return;
    saveDB(db);

    if (!dbPersistedRef.current) {
      dbPersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.db === getCurrentDBSyncSnapshot()) {
      return;
    }

    markDBChanged();
  }, [
    db,
    getCurrentDBSyncSnapshot,
    isDBReady,
    lastAppliedSyncSnapshotRef,
    markDBChanged,
    syncPauseAutoPushRef,
  ]);

  useEffect(() => {
    saveOnboardingDismissed(onboardingDismissed);

    if (!onboardingDismissedPersistedRef.current) {
      onboardingDismissedPersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.homepage === getCurrentHomepageSyncSnapshot()) {
      return;
    }

    markHomepageChanged();
  }, [
    getCurrentHomepageSyncSnapshot,
    lastAppliedSyncSnapshotRef,
    markHomepageChanged,
    onboardingDismissed,
    syncPauseAutoPushRef,
  ]);

  useEffect(() => {
    saveOnboardingCompleted(onboardingCompleted);

    if (!onboardingCompletedPersistedRef.current) {
      onboardingCompletedPersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.homepage === getCurrentHomepageSyncSnapshot()) {
      return;
    }

    markHomepageChanged();
  }, [
    getCurrentHomepageSyncSnapshot,
    lastAppliedSyncSnapshotRef,
    markHomepageChanged,
    onboardingCompleted,
    syncPauseAutoPushRef,
  ]);

  useEffect(() => {
    if (selectedCollectionId === 'all' || selectedCollectionId === 'ungrouped') {
      return;
    }

    if (
      !db.collections.some((collection) => collection.id === selectedCollectionId) &&
      !isStudyCollectionId(selectedCollectionId)
    ) {
      setSelectedCollectionId('all');
    }
  }, [db.collections, selectedCollectionId]);

  useKeyboardShortcuts(openSearch);

  const isTechniqueDetailOpen = Boolean(currentTechnique);
  const tourTechniqueSlug = db.techniques[0]?.slug ?? null;

  const glossaryCollectionOptions = useMemo(() => {
    if (!activeSlug || !currentGlossaryTerm) return [];
    return getGlossaryCollectionOptions(db.collections, db.glossaryBookmarkCollections, activeSlug);
  }, [db.collections, db.glossaryBookmarkCollections, activeSlug, currentGlossaryTerm]);

  const {
    updateGlossaryProgress,
    updateExerciseProgress,
    cycleItemStudyStatus,
    createCollection,
    renameCollection,
    deleteCollection,
    assignToCollection,
    removeFromCollection,
    assignGlossaryToCollection,
    removeGlossaryFromCollection,
    assignExerciseToCollection,
    removeExerciseFromCollection,
    reorderCollectionItem,
    toggleBookmark,
    toggleExerciseBookmark,
    handleDBChange,
    toggleSearchTechniqueBookmark,
  } = useUserLibraryController({
    db,
    setDB,
    locale,
    markSyncMutationPending,
    addSyncTombstones,
  });

  const handleManageSync = useCallback((): void => {
    closeSettings();
    navigateTo('sync');
  }, [closeSettings, navigateTo]);

  const openTechnique = useCallback(
    (
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
    },
    [
      db.techniques,
      filters.stance,
      filters.trainer,
      filters.weapon,
      route,
      setActiveSlug,
      setRoute,
    ],
  );

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
    const nextRoute: AppRoute = 'exercises';

    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(slug);
      const practicePath = `/exercises/${encodedSlug}`;
      const state: HistoryState = {
        route: nextRoute,
        slug,
        sourceRoute: route,
        sourceSlug: activeSlug ?? undefined,
      };

      if (window.location.pathname !== practicePath) {
        window.history.pushState(state, '', practicePath);
      } else {
        window.history.replaceState(state, '', practicePath);
      }
    }

    if (route !== 'exercises') {
      setRoute('exercises');
    }
    setActiveSlug(slug);
  };

  const syncTourSegment = useCallback(
    (segmentIndex: number): void => {
      const segment = ONBOARDING_TOUR_SEGMENTS[normalizeTourSegmentIndex(segmentIndex)];
      if (!segment) return;

      if (segment.id !== 'search-input' && searchOpen) {
        setSearchOpen(false);
      }

      switch (segment.id) {
        case 'guide-tab': {
          if (route !== 'guide' || activeSlug) {
            navigateTo('guide');
          }
          return;
        }
        case 'techniques-tab':
        case 'techniques-filters': {
          if (route !== 'techniques' || activeSlug) {
            navigateTo('techniques');
          }
          return;
        }
        case 'terms-tab': {
          if (route !== 'terms' || activeSlug) {
            navigateTo('terms');
          }
          return;
        }
        case 'exercises-tab': {
          if (route !== 'exercises' || activeSlug) {
            navigateTo('exercises');
          }
          return;
        }
        case 'detail-study-status':
        case 'detail-bookmarks-collections': {
          if (!tourTechniqueSlug) return;
          if (!currentTechnique || currentTechnique.slug !== tourTechniqueSlug) {
            openTechnique(tourTechniqueSlug, undefined, undefined, false, {
              originRoute: 'techniques',
            });
          }
          return;
        }
        case 'bookmarks-collections': {
          if (route !== 'bookmarks' || activeSlug) {
            navigateTo('bookmarks');
          }
          return;
        }
        case 'search-input': {
          if (route !== 'bookmarks' || activeSlug) {
            navigateTo('bookmarks');
            if (!searchOpen) {
              window.setTimeout(() => {
                setSearchOpen(true);
              }, 0);
            }
            return;
          }
          if (!searchOpen) {
            setSearchOpen(true);
          }
          return;
        }
      }
    },
    [activeSlug, currentTechnique, navigateTo, openTechnique, route, searchOpen, tourTechniqueSlug],
  );

  const handleSkipOnboarding = useCallback((): void => {
    setTourOpen(false);
    setTourCompletionVisible(false);
    setSearchOpen(false);
    setOnboardingDismissed(true);
    saveOnboardingStep(null);
    if (!syncPauseAutoPushRef.current) {
      markHomepageChanged();
    }
  }, [markHomepageChanged, syncPauseAutoPushRef]);

  const handleStartOnboardingTour = useCallback((): void => {
    const nextSegment = 0;
    setTourSegmentIndex(nextSegment);
    setTourCompletionVisible(false);
    setSearchOpen(false);
    setTourOpen(true);
    setOnboardingDismissed(false);
    setOnboardingCompleted(false);
    saveOnboardingStep(nextSegment);
    if (!syncPauseAutoPushRef.current) {
      markHomepageChanged();
    }
  }, [markHomepageChanged, syncPauseAutoPushRef]);

  const isTourSegmentAligned = useMemo(() => {
    const segment = ONBOARDING_TOUR_SEGMENTS[normalizeTourSegmentIndex(tourSegmentIndex)];
    if (!segment) return false;

    switch (segment.id) {
      case 'guide-tab':
        return route === 'guide';
      case 'techniques-tab':
      case 'techniques-filters':
        return route === 'techniques' && !isTechniqueDetailOpen;
      case 'terms-tab':
        return route === 'terms';
      case 'exercises-tab':
        return route === 'exercises';
      case 'detail-study-status':
      case 'detail-bookmarks-collections':
        return isTechniqueDetailOpen;
      case 'bookmarks-collections':
        return route === 'bookmarks' && !searchOpen;
      case 'search-input':
        return route === 'bookmarks' && searchOpen;
      default:
        return false;
    }
  }, [isTechniqueDetailOpen, route, searchOpen, tourSegmentIndex]);

  const handleTourBack = useCallback(() => {
    if (tourCompletionVisible) {
      setTourCompletionVisible(false);
      return;
    }
    setTourSegmentIndex((current) => normalizeTourSegmentIndex(current - 1));
  }, [tourCompletionVisible]);

  const handleTourNext = useCallback(() => {
    if (!isTourSegmentAligned) {
      syncTourSegment(tourSegmentIndex);
      return;
    }

    const lastIndex = ONBOARDING_TOUR_SEGMENTS.length - 1;
    if (tourSegmentIndex >= lastIndex) {
      setTourCompletionVisible(true);
      setOnboardingCompleted(true);
      setOnboardingDismissed(false);
      saveOnboardingStep(null);
      if (!syncPauseAutoPushRef.current) {
        markHomepageChanged();
      }
      return;
    }

    setTourSegmentIndex((current) => normalizeTourSegmentIndex(current + 1));
  }, [
    isTourSegmentAligned,
    markHomepageChanged,
    syncPauseAutoPushRef,
    syncTourSegment,
    tourSegmentIndex,
  ]);

  const handleTourGoHome = useCallback(() => {
    setTourOpen(false);
    setTourCompletionVisible(false);
    setSearchOpen(false);
    navigateTo('home');
    if (!prefersReducedMotion) {
      setShowTourCompletionConfetti(true);
    }
  }, [navigateTo, prefersReducedMotion]);

  useEffect(() => {
    if (!tourOpen || tourCompletionVisible) return;
    const normalized = normalizeTourSegmentIndex(tourSegmentIndex);
    saveOnboardingStep(normalized);
    if (!syncPauseAutoPushRef.current) {
      markHomepageChanged();
    }
    syncTourSegment(normalized);
  }, [
    markHomepageChanged,
    syncPauseAutoPushRef,
    tourCompletionVisible,
    tourOpen,
    tourSegmentIndex,
    syncTourSegment,
  ]);

  useEffect(() => {
    if (!showTourCompletionConfetti) return;
    const timeoutId = window.setTimeout(() => {
      setShowTourCompletionConfetti(false);
    }, 2200);
    return () => window.clearTimeout(timeoutId);
  }, [showTourCompletionConfetti]);

  const handleOpenGuideFromPrompt = useCallback(() => {
    setBeltPromptDismissed(true);
    navigateTo('guide');
  }, [navigateTo, setBeltPromptDismissed]);

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

  const openGuideRoutinePreset = useCallback(
    (routine: GuideRoutine, routineSlug: string) => {
      rememberScrollPosition();
      const nextRoute = routineToGuideRoute(routine);
      const nextPath = buildGuideRoutinePath(routine, routineSlug);

      setRoute(nextRoute);
      setActiveSlug(routineSlug);

      if (typeof window !== 'undefined') {
        const state: HistoryState = {
          route: nextRoute,
          slug: routineSlug,
          sourceRoute: 'guide',
        };
        if (`${window.location.pathname}${window.location.search}` !== nextPath) {
          window.history.pushState(state, '', nextPath);
        } else {
          window.history.replaceState(state, '', nextPath);
        }
      }
    },
    [setActiveSlug, setRoute],
  );

  const closeGuideRoutinePreset = useCallback(
    (routine: GuideRoutine) => {
      rememberScrollPosition();
      const nextRoute = routineToGuideRoute(routine);
      const nextPath = buildGuideRoutinePath(routine);

      setRoute(nextRoute);
      setActiveSlug(null);

      if (typeof window !== 'undefined') {
        const state: HistoryState = { route: nextRoute, sourceRoute: 'guide' };
        window.history.replaceState(state, '', nextPath);
      }
    },
    [setActiveSlug, setRoute],
  );

  const techniqueHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const techniqueBackRoute = techniqueHistoryState?.sourceRoute ?? route;
  const closeTechnique = (): void => {
    navigateTo(techniqueBackRoute, { replace: true });
  };

  const techniqueNotFound =
    Boolean(activeSlug) &&
    !currentTechnique &&
    route !== 'terms' &&
    route !== 'exercises' &&
    !guideRouteToRoutine(route);
  const activeTourSegment = tourOpen
    ? (ONBOARDING_TOUR_SEGMENTS[normalizeTourSegmentIndex(tourSegmentIndex)] ?? null)
    : null;
  const showHomeOnboardingCard = !tourOpen && !onboardingDismissed && !onboardingCompleted;

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
      isInitialMountRef.current = false;
      return;
    }
    pendingScrollToTopRef.current = true;
    if (skipEntranceAnimations || prefersReducedMotion) {
      flushScrollToTop();
      isInitialMountRef.current = false;
      return;
    }

    if (isInitialMountRef.current) {
      // On initial mount there is no AnimatePresence exit cycle, so flush once
      // after first paint to avoid compounded browser scroll restoration on reload.
      isInitialMountRef.current = false;
      window.requestAnimationFrame(() => {
        flushScrollToTop();
      });
    }
  }, [
    route,
    activeSlug,
    currentTechnique?.id,
    skipEntranceAnimations,
    prefersReducedMotion,
    flushScrollToTop,
  ]);

  const techniqueBackLabel =
    techniqueBackRoute === 'bookmarks'
      ? copy.backToBookmarks
      : techniqueBackRoute === 'home'
        ? copy.backToHome
        : techniqueBackRoute === 'about'
          ? copy.backToAbout
          : isGuideLikeRoute(techniqueBackRoute)
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
          : isGuideLikeRoute(glossaryBackRoute)
            ? copy.backToGuide
            : glossaryBackRoute === 'feedback'
              ? copy.backToFeedback
              : copy.backToGlossary;

  const practiceHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const practiceBackRoute = practiceHistoryState?.sourceRoute ?? route;
  const practiceBackSourceSlug = practiceHistoryState?.sourceSlug ?? null;
  const practiceBackLabel =
    practiceBackRoute === 'bookmarks'
      ? copy.backToBookmarks
      : practiceBackRoute === 'home'
        ? copy.backToHome
        : practiceBackRoute === 'about'
          ? copy.backToAbout
          : isGuideLikeRoute(practiceBackRoute)
            ? copy.backToGuide
            : practiceBackRoute === 'feedback'
              ? copy.backToFeedback
              : copy.backToPractice;
  const handlePracticeBack = () => {
    const guideRoutine = guideRouteToRoutine(practiceBackRoute);
    if (guideRoutine && practiceBackSourceSlug) {
      const path = buildGuideRoutinePath(guideRoutine, practiceBackSourceSlug);
      setRoute(practiceBackRoute);
      setActiveSlug(practiceBackSourceSlug);
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          { route: practiceBackRoute, slug: practiceBackSourceSlug, sourceRoute: 'guide' },
          '',
          path,
        );
      }
      return;
    }
    navigateTo(practiceBackRoute, { replace: true });
  };

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

  const { mainContent, pageKey } = AppScreenRouter({
    state: {
      route,
      activeSlug,
      activeTourSegment,
      techniqueNotFound,
      showHomeOnboardingCard,
      skipEntranceAnimations,
    },
    data: {
      db,
      copy,
      locale,
      currentTechnique,
      currentProgress,
      currentGlossaryTerm,
      currentGlossaryProgress,
      currentGlossaryStudyStatus,
      currentExerciseStudyStatus,
      glossaryCollectionOptions,
      glossaryTerms,
      practiceExercises,
      filteredTechniques,
      categories,
      attacks,
      stances,
      weapons,
      trainers,
      glossaryCategories,
      practiceCategories,
      authSession,
      isAuthBootstrapping,
      syncStatus,
      syncError,
      syncMeta,
      learnSession,
      feedbackInitialType,
      pinnedBeltGrade,
      beltPromptDismissed,
    },
    filters: {
      filters,
      setFilters,
      glossaryFilters,
      setGlossaryFilters,
      practiceFilters,
      setPracticeFilters,
    },
    navigation: {
      navigateTo,
      openTechnique,
      closeTechnique,
      openGlossaryTerm,
      openPracticeExercise,
      openGuideGrade,
      navigateToGuideGrade,
      navigateToGuideRoutine,
      openGuideRoutinePreset,
      closeGuideRoutinePreset,
      handlePracticeBack,
      handleGuideBack,
      techniqueBackLabel,
      glossaryBackLabel,
      glossaryBackRoute,
      practiceBackLabel,
      guideBackLabel,
    },
    library: {
      updateGlossaryProgress,
      cycleItemStudyStatus,
      createCollection,
      renameCollection,
      deleteCollection,
      assignToCollection,
      removeFromCollection,
      assignGlossaryToCollection,
      removeGlossaryFromCollection,
      assignExerciseToCollection,
      removeExerciseFromCollection,
      reorderCollectionItem,
      toggleBookmark,
      toggleExerciseBookmark,
    },
    workflow: {
      pageMotion,
      prefetchFeedbackPage,
      goToFeedback,
      handleOpenGuideFromPrompt,
      handleStartOnboardingTour,
      handleSkipOnboarding,
      togglePinnedBeltGrade,
      startLearnSession,
      requestOtpForSync,
      verifyOtpForSync,
      signOutFromSync,
      syncNow,
      handleRequestDeleteAccount,
      setFeedbackInitialType,
      selectedCollectionId,
      setSelectedCollectionId,
    },
  });

  return (
    <AppShell
      copy={copy}
      locale={locale}
      route={route}
      mainContent={mainContent}
      pageKey={pageKey}
      pageMotion={pageMotion}
      skipEntranceAnimations={skipEntranceAnimations}
      onExitComplete={flushScrollToTop}
      onNavigate={navigateTo}
      onSearch={openSearch}
      onSettings={openSettings}
      onStartTour={handleStartOnboardingTour}
      searchButtonRef={searchTriggerRef}
      settingsButtonRef={settingsTriggerRef}
      searchOpen={searchOpen}
      searchOpenedBy={
        (openSearch as { lastOpenedBy?: 'keyboard' | 'mouse' }).lastOpenedBy ?? 'mouse'
      }
      onCloseSearch={closeSearch}
      techniques={db.techniques}
      exercises={practiceExercises}
      progress={db.progress}
      glossaryProgress={db.glossaryProgress}
      exerciseProgress={db.exerciseProgress}
      studyStatus={db.studyStatus}
      onSearchOpenTechnique={(slug) => {
        openTechnique(slug);
        closeSearch();
      }}
      onSearchOpenGlossary={(slug) => {
        openGlossaryTerm(slug);
        closeSearch();
      }}
      onSearchOpenExercise={(slug) => {
        openPracticeExercise(slug);
        closeSearch();
      }}
      onToggleSearchTechniqueBookmark={toggleSearchTechniqueBookmark}
      onToggleSearchGlossaryBookmark={(termId) =>
        updateGlossaryProgress(termId, {
          bookmarked: !db.glossaryProgress.find((g) => g.termId === termId)?.bookmarked,
        })
      }
      onToggleSearchExerciseBookmark={(exerciseId) =>
        updateExerciseProgress(exerciseId, {
          bookmarked: !db.exerciseProgress.find((p) => p.exerciseId === exerciseId)?.bookmarked,
        })
      }
      settingsOpen={settingsOpen}
      theme={theme}
      isSystemTheme={!hasManualTheme}
      db={db}
      isOnline={isOnline}
      isSignedIn={Boolean(authSession)}
      isAuthBootstrapping={isAuthBootstrapping}
      syncStatus={syncStatus}
      hasSyncError={Boolean(syncError && syncError !== 'Unauthorized')}
      onCloseSettings={closeSettings}
      onRequestClear={handleRequestClear}
      onChangeLocale={handleLocaleChange}
      onChangeTheme={handleThemeChange}
      onManageSync={handleManageSync}
      onChangeDB={handleDBChange}
      settingsClearButtonRef={settingsClearButtonRef}
      confirmClearOpen={confirmClearOpen}
      onCancelClear={handleCancelClear}
      onConfirmClear={handleConfirmClear}
      confirmDeleteAccountOpen={confirmDeleteAccountOpen}
      onCancelDeleteAccount={handleCancelDeleteAccount}
      onConfirmDeleteAccount={() => {
        void handleConfirmDeleteAccount();
      }}
      tourOpen={tourOpen}
      tourSegmentIndex={tourSegmentIndex}
      isTechniqueDetailOpen={isTechniqueDetailOpen}
      tourCompletionVisible={tourCompletionVisible}
      onTourBack={handleTourBack}
      onTourNext={handleTourNext}
      onSkipOnboarding={handleSkipOnboarding}
      onReturnToTourStep={() => syncTourSegment(tourSegmentIndex)}
      onTourGoHome={handleTourGoHome}
      onOpenSettingsFromTour={() => {
        setTourOpen(false);
        setTourCompletionVisible(false);
        openSettings();
      }}
      showTourCompletionConfetti={showTourCompletionConfetti}
      toast={toast}
    />
  );
}
