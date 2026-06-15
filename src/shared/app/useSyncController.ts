import { ONBOARDING_TOUR_SEGMENTS } from '@features/onboarding/constants';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { authService } from '../../lib/backend/auth';
import { syncClient } from '../../lib/backend/sync';
import { applySyncedDBState, mergeSyncPayload, pruneSyncTombstones } from '../../lib/backend/syncMerge';
import type {
  AuthSession,
  SyncMetaState,
  SyncPayloadData,
  SyncTombstones,
} from '../../lib/supabase/types';
import { loadSyncMeta, saveOnboardingStep, saveSyncMeta } from '../services/storageService';
import type { DB } from '../types';
import { stringifyForSyncCompare } from './syncSnapshot';
import {
  buildClearedSyncMeta,
  buildLocalSyncPayloadForController,
  mergeSyncTombstones,
} from './syncControllerModel';
import type { PreferencesSyncController } from './usePreferencesController';

export type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'error';

type LastAppliedSyncSnapshot = {
  db: string;
  settings: string;
  homepage: string;
};

type UseSyncControllerParams = {
  db: DB;
  setDB: Dispatch<SetStateAction<DB>>;
  preferencesSyncRef: MutableRefObject<PreferencesSyncController | null>;
  setOnboardingDismissed: Dispatch<SetStateAction<boolean>>;
  setOnboardingCompleted: Dispatch<SetStateAction<boolean>>;
  setTourSegmentIndex: Dispatch<SetStateAction<number>>;
};

const AUTH_TRIGGERED_SYNC_MIN_INTERVAL_MS = 60_000;

const normalizeTourSegmentIndex = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const maxIndex = ONBOARDING_TOUR_SEGMENTS.length - 1;
  if (value < 0) return 0;
  if (value > maxIndex) return maxIndex;
  return Math.trunc(value);
};

const getRequiredPreferencesSync = (
  preferencesSyncRef: MutableRefObject<PreferencesSyncController | null>,
): PreferencesSyncController => {
  if (!preferencesSyncRef.current) {
    throw new Error('Preferences sync controller is not initialized');
  }
  return preferencesSyncRef.current;
};

export const useSyncController = ({
  db,
  setDB,
  preferencesSyncRef,
  setOnboardingDismissed,
  setOnboardingCompleted,
  setTourSegmentIndex,
}: UseSyncControllerParams) => {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('signed-out');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncMeta, setSyncMeta] = useState<SyncMetaState>(() => loadSyncMeta());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

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

  useEffect(
    () => () => {
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
        const nextMeta: SyncMetaState = {
          ...prev,
          dbUpdatedAt: Math.max(prev.dbUpdatedAt, ...Object.values(tombstones)),
          tombstones: mergeSyncTombstones(prev.tombstones, tombstones),
        };
        saveSyncMeta(nextMeta);
        return nextMeta;
      });
    },
    [markSyncMutationPending],
  );

  const buildLocalSyncPayload = useCallback((): SyncPayloadData => {
    const preferencesSync = getRequiredPreferencesSync(preferencesSyncRef);
    return buildLocalSyncPayloadForController({
      db,
      syncMeta,
      settings: preferencesSync.buildSettingsState(),
      homepage: preferencesSync.buildHomepageState(),
    });
  }, [db, preferencesSyncRef, syncMeta]);

  const getCurrentDBSyncSnapshot = useCallback(
    (): string => stringifyForSyncCompare(buildLocalSyncPayload().db),
    [buildLocalSyncPayload],
  );

  const getCurrentHomepageSyncSnapshot = useCallback(
    (): string => getRequiredPreferencesSync(preferencesSyncRef).getCurrentHomepageSyncSnapshot(),
    [preferencesSyncRef],
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

      const syncedPreferences = getRequiredPreferencesSync(
        preferencesSyncRef,
      ).applySyncedPreferences(payload);
      setOnboardingDismissed(syncedPreferences.onboardingDismissed);
      setOnboardingCompleted(syncedPreferences.onboardingCompleted);
      saveOnboardingStep(syncedPreferences.onboardingStep);
      setTourSegmentIndex(normalizeTourSegmentIndex(syncedPreferences.onboardingStep));

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
    [
      persistSyncMeta,
      preferencesSyncRef,
      setDB,
      setOnboardingCompleted,
      setOnboardingDismissed,
      setTourSegmentIndex,
    ],
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

  const markSyncedDBCleared = useCallback(
    (deletedAt: number): void => {
      const nextMeta = buildClearedSyncMeta({ db, syncMeta, deletedAt });
      markSyncMutationPending();
      persistSyncMeta(nextMeta);
    },
    [db, markSyncMutationPending, persistSyncMeta, syncMeta],
  );

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

  return {
    state: {
      authSession,
      isAuthBootstrapping,
      syncStatus,
      syncError,
      syncMeta,
      isOnline,
    },
    refs: {
      syncPauseAutoPushRef,
      lastAppliedSyncSnapshotRef,
    },
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
  };
};
