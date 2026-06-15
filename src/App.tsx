'use client';

import type { FeedbackType } from '@features/home/components/feedback/FeedbackPage';
import { FeedbackPage } from '@features/home/components/feedback/FeedbackPage';
import { GuideGradePage } from '@features/home/components/guide/GuideGradePage';
import {
  LearnSessionPage,
  orderLearnCards,
  type LearnCard,
  type LearnSession,
  type LearnSetupOptions,
} from '@features/learn';
import { AboutPage } from '@features/home/components/home/AboutPage';
import { AdvancedPrograms } from '@features/home/components/home/AdvancedPrograms';
import { DanOverview } from '@features/home/components/home/DanOverview';
import { GuidePage } from '@features/home/components/home/GuidePage';
import { GuideRoutinePage } from '@features/home/components/home/GuideRoutinePage';
import { SyncPage } from '@features/home/components/home/SyncPage';
import { ONBOARDING_TOUR_SEGMENTS } from '@features/onboarding/constants';
import { TechniquePage } from '@features/technique/components/TechniquePage';
import { TechniquesPage } from '@features/technique/components/TechniquesPage';
import { AppShell } from '@shared/components/layout/AppShell';
import { ExpandableFilterBar } from '@shared/components/ui/ExpandableFilterBar';
import { MobileFilters } from '@shared/components/ui/MobileFilters';
import { useMotionPreferences } from '@shared/components/ui/motion';
import {
  buildTechniqueUrlWithVariant,
  buildTechniqueUrl as buildUrl,
} from '@shared/constants/urls';
import { enrichTechniqueWithVariants } from '@shared/constants/variantMapping';
import {
  buildGuideRoutinePath,
  gradeToGuideRoute,
  guideRouteToGrade,
  guideRouteToRoutine,
  isGuideLikeRoute,
  routeToPath,
  routineToGuideRoute,
  type HistoryState,
} from '@shared/navigation/appRoutes';
import { useAppNavigation } from '@shared/navigation/useAppNavigation';
import { PencilLine } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { BookmarksView } from './features/bookmarks/components/BookmarksView';
import type { ExerciseFilters } from './features/exercises';
import {
  ExerciseDetailPage,
  ExercisesFilterPanel,
  ExercisesPage,
  MobileExercisesFilters,
} from './features/exercises';
import { HomePage } from './features/home';
import { FilterPanel } from './features/search/components/FilterPanel';
import { MobileTermsFilters, TermDetailPage, TermsFilterPanel, TermsPage } from './features/terms';
import { authService } from './lib/backend/auth';
import { syncClient } from './lib/backend/sync';
import {
  applySyncedDBState,
  buildHomepageState,
  buildSettingsState,
  buildSyncPayloadData,
  buildTombstonesForSyncedState,
  computeDBUpdatedAt,
  pruneSyncTombstones,
  mergeSyncPayload,
  pickSyncedDBState,
} from './lib/backend/syncMerge';
import type {
  AuthSession,
  SyncMetaState,
  SyncPayloadData,
  SyncTombstones,
} from './lib/supabase/types';
import { generateId, getGlossaryCollectionOptions, getSystemTheme } from './shared/app/appModel';
import { useContentController } from './shared/app/useContentController';
import { useUserLibraryController } from './shared/app/useUserLibraryController';
import { getCopy } from './shared/constants/i18n';
import useLockBodyScroll from './shared/hooks/useLockBodyScroll';
import {
  clearDB,
  clearFilters,
  clearThemePreference,
  hasStoredTheme,
  loadBeltPromptDismissed,
  loadDB,
  loadDefaultDB,
  loadFilterPanelPinned,
  loadFilters,
  loadOnboardingCompleted,
  loadOnboardingDismissed,
  loadOnboardingStep,
  loadPinnedBeltGrade,
  loadStoredLocale,
  loadSyncMeta,
  loadTheme,
  saveBeltPromptDismissed,
  saveDB,
  saveFilterPanelPinned,
  saveFilters,
  saveLocale,
  saveOnboardingCompleted,
  saveOnboardingDismissed,
  saveOnboardingStep,
  savePinnedBeltGrade,
  saveSyncMeta,
  saveTheme,
} from './shared/services/storageService';
import type {
  AppRoute,
  DB,
  Direction,
  EntryMode,
  Filters,
  Grade,
  GuideRoutine,
  Locale,
  TechniqueVariant,
  TechniqueVariantKey,
  Theme,
  WeaponKind,
} from './shared/types';
import { gradeOrder } from './shared/utils/grades';
import {
  cameFromBackForwardNavigation,
  consumeBFCacheRestoreFlag,
  rememberScrollPosition,
} from './shared/utils/navigationLifecycle';
import { isStudyCollectionId } from './shared/utils/studyStatus';

const defaultFilters: Filters = {};

type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'error';

const AUTH_TRIGGERED_SYNC_MIN_INTERVAL_MS = 60_000;

type LastAppliedSyncSnapshot = {
  db: string;
  settings: string;
  homepage: string;
};

const stringifyForSyncCompare = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stringifyForSyncCompare).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stringifyForSyncCompare(entryValue)}`)
    .join(',')}}`;
};

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
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [isHomePrefsReady, setIsHomePrefsReady] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [hasManualTheme, setHasManualTheme] = useState<boolean>(() => hasStoredTheme());
  const [db, setDB] = useState<DB>(() => loadDefaultDB());
  const [isDBReady, setIsDBReady] = useState(false);
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
  const [pinnedBeltGrade, setPinnedBeltGrade] = useState<Grade | null>(null);
  const [beltPromptDismissed, setBeltPromptDismissed] = useState<boolean>(false);
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
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('signed-out');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMeta, setSyncMeta] = useState<SyncMetaState>(() => loadSyncMeta());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

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
  const searchTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settingsClearButtonRef = useRef<HTMLButtonElement | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const pendingScrollToTopRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const dbPersistedRef = useRef(false);
  const settingsPersistedRef = useRef(false);
  const localePersistedRef = useRef(false);
  const filtersPersistedRef = useRef(false);
  const pinnedBeltPersistedRef = useRef(false);
  const beltPromptPersistedRef = useRef(false);
  const onboardingDismissedPersistedRef = useRef(false);
  const onboardingCompletedPersistedRef = useRef(false);
  const syncPauseAutoPushRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const syncDirtyRef = useRef(false);
  const syncDirtyDuringFlightRef = useRef(false);
  const syncMutationVersionRef = useRef(0);
  const syncDebounceTimeoutRef = useRef<number | null>(null);
  const authAccessTokenRef = useRef<string | null>(null);
  const lastAuthTriggeredSyncAtRef = useRef(0);
  const runSyncWithTokenRef = useRef<(accessToken: string) => Promise<void>>(async () => {});
  const lastAppliedSyncSnapshotRef = useRef<Partial<LastAppliedSyncSnapshot>>({});
  const filterPanelPinnedRef = useRef<boolean>(loadFilterPanelPinned());
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

      if (syncDebounceTimeoutRef.current && typeof window !== 'undefined') {
        window.clearTimeout(syncDebounceTimeoutRef.current);
      }
    },
    [],
  );

  const persistSyncMeta = useCallback((nextMeta: SyncMetaState): void => {
    setSyncMeta(nextMeta);
    saveSyncMeta(nextMeta);
  }, []);

  const markSyncMutationPending = useCallback((): void => {
    if (syncPauseAutoPushRef.current) return;
    syncMutationVersionRef.current += 1;
    syncDirtyRef.current = true;
    if (syncInFlightRef.current) {
      syncDirtyDuringFlightRef.current = true;
    }
  }, []);

  const addSyncTombstones = useCallback(
    (tombstones: SyncTombstones): void => {
      if (Object.keys(tombstones).length === 0) return;

      markSyncMutationPending();

      setSyncMeta((prev) => {
        const nextTombstones: SyncTombstones = { ...prev.tombstones };
        Object.entries(tombstones).forEach(([key, deletedAt]) => {
          nextTombstones[key] = Math.max(nextTombstones[key] ?? 0, deletedAt);
        });
        const nextMeta: SyncMetaState = {
          ...prev,
          dbUpdatedAt: Math.max(prev.dbUpdatedAt, ...Object.values(tombstones)),
          tombstones: pruneSyncTombstones(nextTombstones),
        };
        saveSyncMeta(nextMeta);
        return nextMeta;
      });
    },
    [markSyncMutationPending],
  );

  const buildLocalSyncPayload = useCallback((): SyncPayloadData => {
    const syncedDB = pickSyncedDBState(db);
    const tombstones = pruneSyncTombstones(syncMeta.tombstones);
    const computedDbUpdatedAt = computeDBUpdatedAt(syncedDB, tombstones);
    const dbTimestamp = Math.max(syncMeta.dbUpdatedAt, computedDbUpdatedAt);

    return buildSyncPayloadData({
      db: syncedDB,
      settings: buildSettingsState({
        themePreference: hasManualTheme ? theme : null,
        locale,
        filters,
        filterPanelPinned: loadFilterPanelPinned(),
      }),
      homepage: buildHomepageState({
        pinnedBeltGrade,
        beltPromptDismissed,
        onboardingDismissed,
        onboardingCompleted,
        onboardingStep: loadOnboardingStep(),
      }),
      timestamps: {
        db: dbTimestamp,
        settings: syncMeta.settingsUpdatedAt,
        homepage: syncMeta.homepageUpdatedAt,
      },
      tombstones,
    });
  }, [
    beltPromptDismissed,
    db,
    filters,
    hasManualTheme,
    locale,
    onboardingCompleted,
    onboardingDismissed,
    pinnedBeltGrade,
    syncMeta.dbUpdatedAt,
    syncMeta.homepageUpdatedAt,
    syncMeta.settingsUpdatedAt,
    syncMeta.tombstones,
    theme,
  ]);

  const getCurrentDBSyncSnapshot = useCallback(
    (): string => stringifyForSyncCompare(pickSyncedDBState(db)),
    [db],
  );

  const getCurrentSettingsSyncSnapshot = useCallback(
    (): string =>
      stringifyForSyncCompare(
        buildSettingsState({
          themePreference: hasManualTheme ? theme : null,
          locale,
          filters,
          filterPanelPinned: loadFilterPanelPinned(),
        }),
      ),
    [filters, hasManualTheme, locale, theme],
  );

  const getCurrentHomepageSyncSnapshot = useCallback(
    (): string =>
      stringifyForSyncCompare(
        buildHomepageState({
          pinnedBeltGrade,
          beltPromptDismissed,
          onboardingDismissed,
          onboardingCompleted,
          onboardingStep: loadOnboardingStep(),
        }),
      ),
    [beltPromptDismissed, onboardingCompleted, onboardingDismissed, pinnedBeltGrade],
  );

  const applySyncPayloadToLocalState = useCallback(
    (payload: SyncPayloadData, syncedAt?: number): void => {
      syncPauseAutoPushRef.current = true;
      lastAppliedSyncSnapshotRef.current = {
        db: stringifyForSyncCompare(payload.db),
        settings: stringifyForSyncCompare(payload.settings),
        homepage: stringifyForSyncCompare(payload.homepage),
      };

      setDB((prev) => applySyncedDBState(prev, payload.db));

      const nextThemePreference = payload.settings.themePreference;
      if (nextThemePreference === null) {
        setHasManualTheme(false);
        setTheme(getSystemTheme());
      } else {
        setHasManualTheme(true);
        setTheme(nextThemePreference);
      }

      setLocale(payload.settings.locale);
      setFilters(payload.settings.filters ?? defaultFilters);
      saveFilterPanelPinned(payload.settings.filterPanelPinned);
      filterPanelPinnedRef.current = payload.settings.filterPanelPinned;

      setPinnedBeltGrade(payload.homepage.pinnedBeltGrade);
      setBeltPromptDismissed(payload.homepage.beltPromptDismissed);
      setOnboardingDismissed(payload.homepage.onboardingDismissed);
      setOnboardingCompleted(payload.homepage.onboardingCompleted);
      saveOnboardingStep(payload.homepage.onboardingStep);
      setTourSegmentIndex(normalizeTourSegmentIndex(payload.homepage.onboardingStep));

      const now = syncedAt ?? Date.now();
      persistSyncMeta({
        dbUpdatedAt: payload.timestamps.db,
        settingsUpdatedAt: payload.timestamps.settings,
        homepageUpdatedAt: payload.timestamps.homepage,
        lastSyncedAt: now,
        tombstones: pruneSyncTombstones(payload.tombstones, now),
      });

      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          syncPauseAutoPushRef.current = false;
        }, 0);
      } else {
        syncPauseAutoPushRef.current = false;
      }
    },
    [persistSyncMeta],
  );

  const runSyncWithToken = useCallback(
    async (accessToken: string): Promise<void> => {
      if (syncInFlightRef.current) {
        syncDirtyRef.current = true;
        syncDirtyDuringFlightRef.current = true;
        return;
      }

      syncInFlightRef.current = true;
      setSyncStatus('syncing');
      setSyncError(null);

      try {
        let shouldSyncAgain = true;
        while (shouldSyncAgain) {
          shouldSyncAgain = false;
          syncDirtyDuringFlightRef.current = false;
          const startedMutationVersion = syncMutationVersionRef.current;
          const localPayload = buildLocalSyncPayload();
          const pullResponse = await syncClient.pull(accessToken);

          const mergedPayload = pullResponse.payload
            ? mergeSyncPayload(localPayload, pullResponse.payload)
            : localPayload;

          const pushResponse = await syncClient.push(accessToken, mergedPayload);
          const changedDuringFlight =
            syncDirtyDuringFlightRef.current ||
            syncMutationVersionRef.current !== startedMutationVersion;

          if (changedDuringFlight) {
            syncDirtyRef.current = true;
            shouldSyncAgain = true;
          } else {
            applySyncPayloadToLocalState(pushResponse.payload, Date.now());
            syncDirtyRef.current = false;
          }
        }
        setSyncStatus('idle');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sync failed';
        if (message === 'Unauthorized') {
          authAccessTokenRef.current = null;
          setAuthSession(null);
          setSyncError(null);
          setSyncStatus('signed-out');
        } else {
          syncDirtyRef.current = true;
          setSyncError(message);
          setSyncStatus('error');
        }
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [applySyncPayloadToLocalState, buildLocalSyncPayload],
  );

  useEffect(() => {
    runSyncWithTokenRef.current = runSyncWithToken;
  }, [runSyncWithToken]);

  const scheduleAutoSync = useCallback((): void => {
    if (!authAccessTokenRef.current || syncPauseAutoPushRef.current) {
      return;
    }

    if (syncDebounceTimeoutRef.current && typeof window !== 'undefined') {
      window.clearTimeout(syncDebounceTimeoutRef.current);
    }

    if (typeof window !== 'undefined') {
      syncDebounceTimeoutRef.current = window.setTimeout(() => {
        if (authAccessTokenRef.current) {
          void runSyncWithTokenRef.current(authAccessTokenRef.current);
        }
      }, 1200);
    }
  }, []);

  const syncNow = useCallback(async (): Promise<void> => {
    if (!authSession?.accessToken) {
      setSyncStatus('signed-out');
      return;
    }

    await runSyncWithToken(authSession.accessToken);
  }, [authSession?.accessToken, runSyncWithToken]);

  const runAuthTriggeredSync = useCallback((accessToken: string): void => {
    const now = Date.now();
    const shouldSync =
      syncDirtyRef.current ||
      now - lastAuthTriggeredSyncAtRef.current >= AUTH_TRIGGERED_SYNC_MIN_INTERVAL_MS;

    if (!shouldSync) return;

    lastAuthTriggeredSyncAtRef.current = now;
    void runSyncWithTokenRef.current(accessToken);
  }, []);

  const requestOtpForSync = useCallback(async (email: string): Promise<void> => {
    try {
      await authService.requestEmailOtp(email);
      setSyncStatus('signed-out');
      setSyncError(null);
    } catch (error) {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Failed to send sign-in email');
    }
  }, []);

  const verifyOtpForSync = useCallback(
    async (email: string, token: string): Promise<void> => {
      try {
        const session = await authService.verifyEmailOtp(email, token);
        authAccessTokenRef.current = session.accessToken;
        setAuthSession(session);
        setSyncStatus('idle');
        setSyncError(null);
        await runSyncWithToken(session.accessToken);
      } catch (error) {
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'Code verification failed');
      }
    },
    [runSyncWithToken],
  );

  const signOutFromSync = useCallback(async (): Promise<void> => {
    await authService.signOut();
    authAccessTokenRef.current = null;
    setAuthSession(null);
    setSyncStatus('signed-out');
    setSyncError(null);
  }, []);

  const deleteAccountFromSync = useCallback(async (): Promise<void> => {
    if (!authSession?.accessToken) {
      setSyncStatus('signed-out');
      return;
    }

    try {
      await syncClient.deleteAccount(authSession.accessToken);
      await authService.signOut();
      authAccessTokenRef.current = null;
      setAuthSession(null);
      setSyncStatus('signed-out');
      setSyncError(null);
    } catch (error) {
      setSyncStatus('error');
      setSyncError(error instanceof Error ? error.message : 'Failed to delete account');
      throw error;
    }
  }, [authSession?.accessToken]);

  const handleConfirmDeleteAccount = useCallback(async (): Promise<void> => {
    await deleteAccountFromSync();
    setConfirmDeleteAccountOpen(false);
  }, [deleteAccountFromSync]);

  useEffect(() => {
    return authService.onAuthStateChange((session) => {
      const nextAccessToken = session?.accessToken ?? null;
      const didAccessTokenChange = authAccessTokenRef.current !== nextAccessToken;
      authAccessTokenRef.current = nextAccessToken;

      setAuthSession(session);

      if (session) {
        setSyncStatus((current) => (current === 'syncing' ? current : 'idle'));
        setSyncError(null);

        if (didAccessTokenChange) {
          runAuthTriggeredSync(session.accessToken);
        }
      } else {
        setSyncStatus('signed-out');
        setSyncError(null);
      }
    });
  }, [runAuthTriggeredSync]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        const session = await authService.getSession();
        if (cancelled) return;

        if (session) {
          const didAccessTokenChange = authAccessTokenRef.current !== session.accessToken;
          authAccessTokenRef.current = session.accessToken;
          setAuthSession(session);
          setSyncStatus('idle');
          if (didAccessTokenChange) {
            runAuthTriggeredSync(session.accessToken);
          }
        } else {
          authAccessTokenRef.current = null;
          setAuthSession(null);
          setSyncStatus('signed-out');
        }
      } catch (error) {
        if (cancelled) return;
        authAccessTokenRef.current = null;
        setAuthSession(null);
        setSyncStatus('error');
        setSyncError(error instanceof Error ? error.message : 'Failed to load session');
      } finally {
        if (!cancelled) {
          setIsAuthBootstrapping(false);
        }
      }
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [runAuthTriggeredSync]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const intervalId = window.setInterval(() => {
      const pinned = loadFilterPanelPinned();
      if (pinned !== filterPanelPinnedRef.current) {
        filterPanelPinnedRef.current = pinned;
        const now = Date.now();
        setSyncMeta((prev) => {
          const nextMeta: SyncMetaState = {
            ...prev,
            settingsUpdatedAt: now,
          };
          saveSyncMeta(nextMeta);
          return nextMeta;
        });
        scheduleAutoSync();
      }
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [scheduleAutoSync]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const retryDirtySync = () => {
      if (authAccessTokenRef.current && syncDirtyRef.current) {
        void runSyncWithTokenRef.current(authAccessTokenRef.current);
      }
    };
    const handleOnline = () => {
      setIsOnline(true);
      retryDirtySync();
    };
    const handleOffline = () => setIsOnline(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        retryDirtySync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
    const tombstones = buildTombstonesForSyncedState(pickSyncedDBState(db), now);
    const nextDB = clearDB();
    const nextTombstones = pruneSyncTombstones({
      ...syncMeta.tombstones,
      ...tombstones,
    });
    const nextMeta: SyncMetaState = {
      ...syncMeta,
      dbUpdatedAt: now,
      tombstones: nextTombstones,
    };
    syncMutationVersionRef.current += 1;
    syncDirtyRef.current = true;
    if (syncInFlightRef.current) {
      syncDirtyDuringFlightRef.current = true;
    }
    saveSyncMeta(nextMeta);
    setSyncMeta(nextMeta);
    setDB(nextDB);
    handleCancelClear();
    showToast(copy.toastDataCleared);
  }, [copy.toastDataCleared, db, handleCancelClear, setDB, showToast, syncMeta]);

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

  const markDBChanged = useCallback(() => {
    const now = Date.now();
    markSyncMutationPending();
    setSyncMeta((prev) => {
      const nextMeta: SyncMetaState = {
        ...prev,
        dbUpdatedAt: now,
      };
      saveSyncMeta(nextMeta);
      return nextMeta;
    });
    scheduleAutoSync();
  }, [markSyncMutationPending, scheduleAutoSync]);

  const markSettingsChanged = useCallback(() => {
    const now = Date.now();
    markSyncMutationPending();
    setSyncMeta((prev) => {
      const nextMeta: SyncMetaState = {
        ...prev,
        settingsUpdatedAt: now,
      };
      saveSyncMeta(nextMeta);
      return nextMeta;
    });
    scheduleAutoSync();
  }, [markSyncMutationPending, scheduleAutoSync]);

  const markHomepageChanged = useCallback(() => {
    const now = Date.now();
    markSyncMutationPending();
    setSyncMeta((prev) => {
      const nextMeta: SyncMetaState = {
        ...prev,
        homepageUpdatedAt: now,
      };
      saveSyncMeta(nextMeta);
      return nextMeta;
    });
    scheduleAutoSync();
  }, [markSyncMutationPending, scheduleAutoSync]);

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

    if (!settingsPersistedRef.current) {
      settingsPersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.settings === getCurrentSettingsSyncSnapshot()) {
      return;
    }

    markSettingsChanged();
  }, [getCurrentSettingsSyncSnapshot, hasManualTheme, markSettingsChanged, theme]);

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

    if (!localePersistedRef.current) {
      localePersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.settings === getCurrentSettingsSyncSnapshot()) {
      return;
    }

    markSettingsChanged();
  }, [getCurrentSettingsSyncSnapshot, isLocaleReady, locale, markSettingsChanged]);

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
  }, [db, getCurrentDBSyncSnapshot, isDBReady, markDBChanged]);

  useEffect(() => {
    if (!isHomePrefsReady) return;
    savePinnedBeltGrade(pinnedBeltGrade);

    if (!pinnedBeltPersistedRef.current) {
      pinnedBeltPersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.homepage === getCurrentHomepageSyncSnapshot()) {
      return;
    }

    markHomepageChanged();
  }, [getCurrentHomepageSyncSnapshot, isHomePrefsReady, markHomepageChanged, pinnedBeltGrade]);

  useEffect(() => {
    if (!isHomePrefsReady) return;
    saveBeltPromptDismissed(beltPromptDismissed);

    if (!beltPromptPersistedRef.current) {
      beltPromptPersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.homepage === getCurrentHomepageSyncSnapshot()) {
      return;
    }

    markHomepageChanged();
  }, [beltPromptDismissed, getCurrentHomepageSyncSnapshot, isHomePrefsReady, markHomepageChanged]);

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
  }, [getCurrentHomepageSyncSnapshot, markHomepageChanged, onboardingDismissed]);

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
  }, [getCurrentHomepageSyncSnapshot, markHomepageChanged, onboardingCompleted]);

  // Persist filters to local storage so they survive reloads/navigation
  useEffect(() => {
    try {
      saveFilters(filters);
    } catch {
      // noop
    }

    if (!filtersPersistedRef.current) {
      filtersPersistedRef.current = true;
      return;
    }

    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.settings === getCurrentSettingsSyncSnapshot()) {
      return;
    }

    markSettingsChanged();
  }, [filters, getCurrentSettingsSyncSnapshot, markSettingsChanged]);

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
  }, [markHomepageChanged]);

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
  }, [markHomepageChanged]);

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
  }, [isTourSegmentAligned, markHomepageChanged, syncTourSegment, tourSegmentIndex]);

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
  }, [markHomepageChanged, tourCompletionVisible, tourOpen, tourSegmentIndex, syncTourSegment]);

  useEffect(() => {
    if (!showTourCompletionConfetti) return;
    const timeoutId = window.setTimeout(() => {
      setShowTourCompletionConfetti(false);
    }, 2200);
    return () => window.clearTimeout(timeoutId);
  }, [showTourCompletionConfetti]);

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
          studyStatusMap={db.studyStatus}
          onToggleStudyStatus={(variant) =>
            cycleItemStudyStatus('technique', currentTechnique.slug, variant)
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
        studyStatus={currentGlossaryStudyStatus}
        onToggleStudyStatus={() =>
          cycleItemStudyStatus('term', currentGlossaryTerm?.slug ?? activeSlug!)
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
        studyStatus={currentExerciseStudyStatus}
        onToggleStudyStatus={() => cycleItemStudyStatus('exercise', activeSlug)}
        onToggleBookmark={toggleExerciseBookmark}
        onAssignToCollection={assignExerciseToCollection}
        onRemoveFromCollection={removeExerciseFromCollection}
        onCreateCollection={createCollection}
        backLabel={practiceBackLabel}
        onNavigateToExercisesWithFilter={(nextFilters) => {
          setPracticeFilters(nextFilters);
          navigateTo('exercises', { replace: true });
        }}
        onBack={handlePracticeBack}
      />
    );
  } else if (techniqueNotFound) {
    mainContent = (
      <div className="max-w-5xl mx-auto px-6 pt-0 pb-10 space-y-4 text-center">
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
        showOnboardingCard={showHomeOnboardingCard}
        onStartOnboardingTour={handleStartOnboardingTour}
        onSkipOnboarding={handleSkipOnboarding}
      />
    );
  } else if (route === 'about') {
    mainContent = <AboutPage copy={copy} />;
  } else if (route === 'sync') {
    mainContent = (
      <SyncPage
        copy={copy}
        isSignedIn={Boolean(authSession)}
        isAuthBootstrapping={isAuthBootstrapping}
        signedInEmail={authSession?.email ?? null}
        syncStatus={syncStatus}
        syncError={syncError}
        lastSyncedAt={syncMeta.lastSyncedAt}
        onRequestOtp={requestOtpForSync}
        onVerifyOtp={verifyOtpForSync}
        onSignOut={signOutFromSync}
        onSyncNow={syncNow}
        onRequestDeleteAccount={handleRequestDeleteAccount}
      />
    );
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
    mainContent = (
      <GuideRoutinePage
        copy={copy}
        locale={locale}
        routine={routine}
        activeRoutineSlug={activeSlug}
        onBack={() => navigateTo('guide')}
        onBackToOverview={() => closeGuideRoutinePreset(routine)}
        onOpenRoutine={(routineSlug) => openGuideRoutinePreset(routine, routineSlug)}
        onOpenExercise={openPracticeExercise}
      />
    );
  } else if (guideRouteToGrade(route)) {
    const grade = guideRouteToGrade(route) as Grade;
    mainContent = (
      <GuideGradePage
        copy={copy}
        locale={locale}
        grade={grade}
        techniques={db.techniques}
        glossaryTerms={glossaryTerms}
        backLabel={guideBackLabel}
        onBack={handleGuideBack}
        pinnedBeltGrade={pinnedBeltGrade}
        onTogglePin={togglePinnedBeltGrade}
        onOpenTechnique={(slug) => openTechnique(slug, undefined, undefined, false)}
        onOpenTerm={openGlossaryTerm}
        onStartLearn={(cards, options) =>
          startLearnSession(cards, options, route, copy.backToGuide)
        }
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
  } else if (route === 'learn') {
    mainContent = (
      <LearnSessionPage
        copy={copy}
        session={learnSession}
        onBack={() => navigateTo(learnSession?.sourceRoute ?? 'bookmarks', { replace: true })}
        onOpenBookmarks={() => navigateTo('bookmarks', { replace: true })}
        onOpenGuide={() => navigateTo('guide', { replace: true })}
      />
    );
  } else {
    mainContent = (
      <div className="container max-w-4xl mx-auto px-4 md:px-6 pt-0 pb-4 space-y-4 lg:space-y-0">
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
                forceOpen={activeTourSegment?.id === 'techniques-filters'}
              />
            </div>
            {/* Mobile CTA removed here — now rendered inside the MobileFilters panel */}
            <div className="relative">
              <ExpandableFilterBar
                label={copy.filters}
                tourTargetId="techniques-filters-trigger"
                forceOpen={activeTourSegment?.id === 'techniques-filters'}
              >
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
                  studyStatus={db.studyStatus}
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
                onContribute={() => goToFeedback()}
                onContributePrefetch={prefetchFeedbackPage}
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
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => goToFeedback()}
                    onMouseEnter={prefetchFeedbackPage}
                    onFocus={prefetchFeedbackPage}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
                  >
                    <PencilLine width={20} height={20} aria-hidden />
                    {copy.feedbackAddExerciseCta}
                  </button>
                </div>
              </ExpandableFilterBar>
              <section>
                <ExercisesPage
                  copy={copy}
                  locale={locale}
                  studyStatus={db.studyStatus}
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
            studyStatus={db.studyStatus}
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
            onReorderCollectionItem={reorderCollectionItem}
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
            onStartLearn={(cards, options) =>
              startLearnSession(cards, options, 'bookmarks', copy.backToBookmarks)
            }
            forceCollectionsSidebarOpen={activeTourSegment?.id === 'bookmarks-collections'}
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
                studyStatus={currentGlossaryStudyStatus}
                onToggleStudyStatus={() => cycleItemStudyStatus('term', activeSlug)}
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
                      studyStatus={db.studyStatus}
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
