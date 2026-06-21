'use client';

import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
import {
  prepareLearnSessionCards,
  type LearnCard,
  type LearnSession,
  type LearnSetupOptions,
} from '@features/learn';
import { AppShell } from '@shared/components/layout/AppShell';
import { useMotionPreferences } from '@shared/components/ui/motion';
import {
  buildTechniqueUrlWithVariant,
  buildTechniqueUrl as buildUrl,
} from '@shared/constants/urls';
import { enrichTechniqueWithVariants } from '@shared/constants/variantMapping';
import {
  buildLibraryRoutinePath,
  gradeToExamsRoute,
  isExamsLikeRoute,
  routeToPath,
  routeToRoutine,
  routineToLibraryRoute,
  type HistoryState,
} from '@shared/navigation/appRoutes';
import { useAppNavigation } from '@shared/navigation/useAppNavigation';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AppScreenRouter } from './shared/app/AppScreenRouter';
import { generateId, getGlossaryCollectionOptions } from './shared/app/appModel';
import { useContentController } from './shared/app/useContentController';
import {
  useOnboardingController,
  type OnboardingSyncController,
} from './shared/app/useOnboardingController';
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
  saveDB,
} from './shared/services/storageService';
import type {
  AppRoute,
  DB,
  Direction,
  EntryMode,
  Grade,
  LibraryRoutine,
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

type SelectedCollectionId = 'all' | 'ungrouped' | string;

type AppProps = {
  initialLocale?: Locale;
  initialRoute?: AppRoute;
  initialSlug?: string | null;
};

type OpenTechnique = (
  slug: string,
  trainerId?: string,
  entry?: EntryMode,
  skipExistenceCheck?: boolean,
  options?: { originRoute?: AppRoute },
  bookmarkedVariant?: TechniqueVariantKey,
) => void;

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

  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const pendingScrollToTopRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const dbPersistedRef = useRef(false);
  const preferencesSyncRef = useRef<PreferencesSyncController | null>(null);
  const onboardingSyncRef = useRef<OnboardingSyncController | null>(null);
  const openTechniqueRef = useRef<OpenTechnique>(() => {});
  const openTechniqueForOnboarding = useCallback<OpenTechnique>((...args) => {
    openTechniqueRef.current(...args);
  }, []);
  const { prefersReducedMotion, pageMotion } = useMotionPreferences();
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
    onboardingSyncRef,
  });
  const tourTechniqueSlug = db.techniques[0]?.slug ?? null;
  const isTechniqueDetailOpenForOnboarding = Boolean(
    activeSlug && route !== 'libraryTerms' && route !== 'libraryExercises' && !routeToRoutine(route),
  );
  const {
    state: {
      onboardingDismissed,
      onboardingCompleted,
      onboardingStep,
      tourOpen,
      tourSegmentIndex,
      tourCompletionVisible,
      showTourCompletionConfetti,
      activeTourSegment,
      showHomeOnboardingCard,
    },
    actions: {
      handleStartOnboardingTour,
      handleSkipOnboarding,
      handleTourBack,
      handleTourNext,
      handleTourGoHome,
      syncTourSegment,
      closeTourForSettings,
    },
    sync: onboardingSync,
  } = useOnboardingController({
    route,
    activeSlug,
    searchOpen,
    setSearchOpen,
    navigateTo,
    openTechnique: openTechniqueForOnboarding,
    tourTechniqueSlug,
    isTechniqueDetailOpen: isTechniqueDetailOpenForOnboarding,
    markHomepageChanged,
    syncPauseAutoPushRef,
    lastAppliedSyncSnapshotRef,
    getCurrentHomepageSyncSnapshot,
    prefersReducedMotion,
  });
  onboardingSyncRef.current = onboardingSync;
  const {
    settings: {
      locale,
      theme,
      hasManualTheme,
      filters,
      glossaryFilters,
      practiceFilters,
      showTeachInPrimaryNav,
    },
    homepage: { pinnedBeltGrade, beltPromptDismissed },
    actions: {
      setFilters,
      setGlossaryFilters,
      setPracticeFilters,
      setShowTeachInPrimaryNav,
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
    onboardingStep,
    markSettingsChanged,
    markHomepageChanged,
    scheduleAutoSync,
    setSyncMeta,
    syncPauseAutoPushRef,
    lastAppliedSyncSnapshotRef,
  });
  preferencesSyncRef.current = preferencesSync;
  const copy = getCopy(locale);
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
      const sessionCards = prepareLearnSessionCards(cards, options);
      if (sessionCards.length === 0) return;
      setLearnSession({
        id: generateId(),
        cards: sessionCards,
        options,
        sourceRoute,
        sourceLabel,
      });
      navigateTo('studyLearn');
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

  const openExamsGrade = useCallback(
    (grade: Grade, source?: { route: AppRoute; slug: string }) => {
      const nextRoute = gradeToExamsRoute(grade);
      if (!nextRoute) {
        navigateTo('exams');
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
      const tabRoute = sourceRoute === 'study' ? 'libraryTechniques' : sourceRoute;
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
  openTechniqueRef.current = openTechnique;

  const openGlossaryTerm = (slug: string): void => {
    rememberScrollPosition();
    // Handle backwards compatibility redirects
    const slugRedirects: Record<string, string> = {
      'irimi-omote': 'irimi',
      'tenkan-ura': 'tenkan',
    };
    const finalSlug = slugRedirects[slug] || slug;
    const nextRoute = route === 'home' || route === 'study' ? 'libraryTerms' : route;

    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(finalSlug);
      const glossaryPath = `/library/terms/${encodedSlug}`;
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
    if (route === 'home' || route === 'study') {
      setRoute('libraryTerms');
    }
    setActiveSlug(finalSlug);
  };

  const openPracticeExercise = (slug: string): void => {
    rememberScrollPosition();
    const nextRoute: AppRoute = 'libraryExercises';

    if (typeof window !== 'undefined') {
      const encodedSlug = encodeURIComponent(slug);
      const practicePath = `/library/exercises/${encodedSlug}`;
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

    if (route !== 'libraryExercises') {
      setRoute('libraryExercises');
    }
    setActiveSlug(slug);
  };

  const handleOpenExamsFromPrompt = useCallback(() => {
    setBeltPromptDismissed(true);
    navigateTo('exams');
  }, [navigateTo, setBeltPromptDismissed]);

  const navigateToExamsGrade = useCallback(
    (grade: Grade, sourceRoute?: AppRoute) => {
      switch (grade) {
        case 'kyu5':
          navigateTo('examsKyu5', { sourceRoute });
          break;
        case 'kyu4':
          navigateTo('examsKyu4', { sourceRoute });
          break;
        case 'kyu3':
          navigateTo('examsKyu3', { sourceRoute });
          break;
        case 'kyu2':
          navigateTo('examsKyu2', { sourceRoute });
          break;
        case 'kyu1':
          navigateTo('examsKyu1', { sourceRoute });
          break;
        case 'dan1':
          navigateTo('examsDan1', { sourceRoute });
          break;
        case 'dan2':
          navigateTo('examsDan2', { sourceRoute });
          break;
        case 'dan3':
          navigateTo('examsDan3', { sourceRoute });
          break;
        case 'dan4':
          navigateTo('examsDan4', { sourceRoute });
          break;
        case 'dan5':
          navigateTo('examsDan5', { sourceRoute });
          break;
        default:
          navigateTo('exams', { sourceRoute });
          break;
      }
    },
    [navigateTo],
  );

  const navigateToLibraryRoutine = useCallback(
    (routine: LibraryRoutine, sourceRoute?: AppRoute) => {
      navigateTo(routineToLibraryRoute(routine), { sourceRoute });
    },
    [navigateTo],
  );

  const openLibraryRoutinePreset = useCallback(
    (routine: LibraryRoutine, routineSlug: string) => {
      rememberScrollPosition();
      const nextRoute = routineToLibraryRoute(routine);
      const nextPath = buildLibraryRoutinePath(routine, routineSlug);

      setRoute(nextRoute);
      setActiveSlug(routineSlug);

      if (typeof window !== 'undefined') {
        const state: HistoryState = {
          route: nextRoute,
          slug: routineSlug,
          sourceRoute: 'library',
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

  const closeLibraryRoutinePreset = useCallback(
    (routine: LibraryRoutine) => {
      rememberScrollPosition();
      const nextRoute = routineToLibraryRoute(routine);
      const nextPath = buildLibraryRoutinePath(routine);

      setRoute(nextRoute);
      setActiveSlug(null);

      if (typeof window !== 'undefined') {
        const state: HistoryState = { route: nextRoute, sourceRoute: 'library' };
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
    route !== 'libraryTerms' &&
    route !== 'libraryExercises' &&
    !routeToRoutine(route);
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
    techniqueBackRoute === 'study'
      ? copy.backToBookmarks
      : techniqueBackRoute === 'home'
        ? copy.backToHome
        : techniqueBackRoute === 'about'
          ? copy.backToAbout
          : isExamsLikeRoute(techniqueBackRoute)
            ? copy.backToExams
            : techniqueBackRoute === 'libraryTerms'
              ? copy.backToGlossary
              : techniqueBackRoute === 'feedback'
                ? copy.backToFeedback
                : copy.backToLibrary;

  const glossaryHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const glossaryBackRoute = glossaryHistoryState?.sourceRoute ?? route;
  const glossaryBackLabel =
    glossaryBackRoute === 'study'
      ? copy.backToBookmarks
      : glossaryBackRoute === 'home'
        ? copy.backToHome
        : glossaryBackRoute === 'about'
          ? copy.backToAbout
          : isExamsLikeRoute(glossaryBackRoute)
            ? copy.backToExams
            : glossaryBackRoute === 'feedback'
              ? copy.backToFeedback
              : copy.backToGlossary;

  const practiceHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const practiceBackRoute = practiceHistoryState?.sourceRoute ?? route;
  const practiceBackSourceSlug = practiceHistoryState?.sourceSlug ?? null;
  const practiceBackLabel =
    practiceBackRoute === 'study'
      ? copy.backToBookmarks
      : practiceBackRoute === 'home'
        ? copy.backToHome
        : practiceBackRoute === 'about'
          ? copy.backToAbout
          : isExamsLikeRoute(practiceBackRoute)
            ? copy.backToExams
            : practiceBackRoute === 'feedback'
              ? copy.backToFeedback
              : copy.backToLibrary;
  const handlePracticeBack = () => {
    const libraryRoutine = routeToRoutine(practiceBackRoute);
    if (libraryRoutine && practiceBackSourceSlug) {
      const path = buildLibraryRoutinePath(libraryRoutine, practiceBackSourceSlug);
      setRoute(practiceBackRoute);
      setActiveSlug(practiceBackSourceSlug);
      if (typeof window !== 'undefined') {
        window.history.replaceState(
          { route: practiceBackRoute, slug: practiceBackSourceSlug, sourceRoute: 'library' },
          '',
          path,
        );
      }
      return;
    }
    navigateTo(practiceBackRoute, { replace: true });
  };

  const examsHistoryState =
    typeof window !== 'undefined' ? (window.history.state as HistoryState | null) : null;
  const examsBackLabel = examsHistoryState?.sourceSlug
    ? copy.backToTechnique
    : examsHistoryState?.sourceRoute === 'home'
      ? copy.backToHome
      : copy.backToExams;
  const handleExamsBack = (): void => {
    if (examsHistoryState?.sourceSlug) {
      openTechnique(examsHistoryState.sourceSlug, undefined, undefined, true, {
        originRoute: examsHistoryState.sourceRoute ?? 'libraryTechniques',
      });
      return;
    }
    if (examsHistoryState?.sourceRoute === 'home') {
      navigateTo('home');
      return;
    }
    navigateTo('exams');
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
      openExamsGrade,
      navigateToExamsGrade,
      navigateToLibraryRoutine,
      openLibraryRoutinePreset,
      closeLibraryRoutinePreset,
      handlePracticeBack,
      handleExamsBack,
      techniqueBackLabel,
      glossaryBackLabel,
      glossaryBackRoute,
      practiceBackLabel,
      examsBackLabel,
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
      handleOpenExamsFromPrompt,
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
      showTeachInPrimaryNav={showTeachInPrimaryNav}
      onChangeShowTeachInPrimaryNav={setShowTeachInPrimaryNav}
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
        closeTourForSettings();
        openSettings();
      }}
      showTourCompletionConfetti={showTourCompletionConfetti}
      toast={toast}
    />
  );
}
