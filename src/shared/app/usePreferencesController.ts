import type { ExerciseFilters } from '@features/exercises';
import type { GlossaryFilters } from '@shared/app/useContentController';
import {
  clearThemePreference,
  hasStoredTheme,
  loadBeltPromptDismissed,
  loadFilterPanelPinned,
  loadFilters,
  loadOnboardingStep,
  loadPinnedBeltGrade,
  loadStoredLocale,
  loadTheme,
  saveBeltPromptDismissed,
  saveFilterPanelPinned,
  saveFilters,
  saveLocale,
  savePinnedBeltGrade,
  saveSyncMeta,
  saveTheme,
} from '@shared/services/storageService';
import type { Filters, Grade, Locale, Theme } from '@shared/types';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SyncMetaState, SyncPayloadData } from '../../lib/supabase/types';
import { getSystemTheme } from './appModel';
import {
  buildPreferenceHomepageState,
  buildPreferenceSettingsState,
  defaultFilters,
  type HomepageSnapshotInput,
} from './preferencesModel';
import { stringifyForSyncCompare } from './syncSnapshot';

type LastAppliedPreferenceSnapshot = {
  settings?: string;
  homepage?: string;
};

type UsePreferencesControllerParams = {
  initialLocale: Locale;
  onboardingDismissed: boolean;
  onboardingCompleted: boolean;
  markSettingsChanged: () => void;
  markHomepageChanged: () => void;
  scheduleAutoSync: () => void;
  setSyncMeta: Dispatch<SetStateAction<SyncMetaState>>;
  syncPauseAutoPushRef: MutableRefObject<boolean>;
  lastAppliedSyncSnapshotRef: MutableRefObject<LastAppliedPreferenceSnapshot>;
};

export const usePreferencesController = ({
  initialLocale,
  onboardingDismissed,
  onboardingCompleted,
  markSettingsChanged,
  markHomepageChanged,
  scheduleAutoSync,
  setSyncMeta,
  syncPauseAutoPushRef,
  lastAppliedSyncSnapshotRef,
}: UsePreferencesControllerParams) => {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [isLocaleReady, setIsLocaleReady] = useState(false);
  const [isHomePrefsReady, setIsHomePrefsReady] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [hasManualTheme, setHasManualTheme] = useState<boolean>(() => hasStoredTheme());
  const [filters, setFilters] = useState<Filters>(() => {
    try {
      const persisted = loadFilters<Filters>();
      return persisted ?? defaultFilters;
    } catch {
      return defaultFilters;
    }
  });
  const [glossaryFilters, setGlossaryFilters] = useState<GlossaryFilters>({});
  const [practiceFilters, setPracticeFilters] = useState<ExerciseFilters>({
    categories: [],
    equipment: [],
  });
  const [pinnedBeltGrade, setPinnedBeltGrade] = useState<Grade | null>(null);
  const [beltPromptDismissed, setBeltPromptDismissed] = useState<boolean>(false);

  const settingsPersistedRef = useRef(false);
  const localePersistedRef = useRef(false);
  const filtersPersistedRef = useRef(false);
  const pinnedBeltPersistedRef = useRef(false);
  const beltPromptPersistedRef = useRef(false);
  const filterPanelPinnedRef = useRef<boolean>(loadFilterPanelPinned());

  const buildSettingsStateForSync = useCallback(
    () =>
      buildPreferenceSettingsState({
        theme,
        hasManualTheme,
        locale,
        filters,
        filterPanelPinned: loadFilterPanelPinned(),
      }),
    [filters, hasManualTheme, locale, theme],
  );

  const buildHomepageStateForSync = useCallback(
    (
      overrides?: Partial<
        Pick<
          HomepageSnapshotInput,
          'onboardingDismissed' | 'onboardingCompleted' | 'onboardingStep'
        >
      >,
    ) =>
      buildPreferenceHomepageState({
        pinnedBeltGrade,
        beltPromptDismissed,
        onboardingDismissed: overrides?.onboardingDismissed ?? onboardingDismissed,
        onboardingCompleted: overrides?.onboardingCompleted ?? onboardingCompleted,
        onboardingStep: overrides?.onboardingStep ?? loadOnboardingStep(),
      }),
    [beltPromptDismissed, onboardingCompleted, onboardingDismissed, pinnedBeltGrade],
  );

  const getCurrentSettingsSyncSnapshot = useCallback(
    (): string => stringifyForSyncCompare(buildSettingsStateForSync()),
    [buildSettingsStateForSync],
  );

  const getCurrentHomepageSyncSnapshot = useCallback(
    (): string => stringifyForSyncCompare(buildHomepageStateForSync()),
    [buildHomepageStateForSync],
  );

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
  }, [
    getCurrentSettingsSyncSnapshot,
    hasManualTheme,
    lastAppliedSyncSnapshotRef,
    markSettingsChanged,
    syncPauseAutoPushRef,
    theme,
  ]);

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
  }, [
    getCurrentSettingsSyncSnapshot,
    isLocaleReady,
    lastAppliedSyncSnapshotRef,
    locale,
    markSettingsChanged,
    syncPauseAutoPushRef,
  ]);

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
  }, [
    getCurrentHomepageSyncSnapshot,
    isHomePrefsReady,
    lastAppliedSyncSnapshotRef,
    markHomepageChanged,
    pinnedBeltGrade,
    syncPauseAutoPushRef,
  ]);

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
  }, [
    beltPromptDismissed,
    getCurrentHomepageSyncSnapshot,
    isHomePrefsReady,
    lastAppliedSyncSnapshotRef,
    markHomepageChanged,
    syncPauseAutoPushRef,
  ]);

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
  }, [
    filters,
    getCurrentSettingsSyncSnapshot,
    lastAppliedSyncSnapshotRef,
    markSettingsChanged,
    syncPauseAutoPushRef,
  ]);

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
  }, [scheduleAutoSync, setSyncMeta]);

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

  const handleLocaleChange = useCallback((next: Locale): void => {
    setLocale(next);
  }, []);

  const handleThemeChange = useCallback((next: Theme | 'system'): void => {
    if (next === 'system') {
      setHasManualTheme(false);
      setTheme(getSystemTheme());
      return;
    }

    setHasManualTheme(true);
    setTheme(next);
  }, []);

  const togglePinnedBeltGrade = useCallback((grade: Grade) => {
    setPinnedBeltGrade((current) => (current === grade ? null : grade));
  }, []);

  const applySyncedPreferences = useCallback((payload: SyncPayloadData) => {
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

    return {
      onboardingDismissed: payload.homepage.onboardingDismissed,
      onboardingCompleted: payload.homepage.onboardingCompleted,
      onboardingStep: payload.homepage.onboardingStep,
    };
  }, []);

  return {
    settings: {
      locale,
      theme,
      hasManualTheme,
      filters,
      glossaryFilters,
      practiceFilters,
    },
    homepage: {
      pinnedBeltGrade,
      beltPromptDismissed,
    },
    actions: {
      setFilters,
      setGlossaryFilters,
      setPracticeFilters,
      setBeltPromptDismissed,
      handleLocaleChange,
      handleThemeChange,
      togglePinnedBeltGrade,
    },
    sync: {
      buildSettingsState: buildSettingsStateForSync,
      buildHomepageState: buildHomepageStateForSync,
      getCurrentSettingsSyncSnapshot,
      getCurrentHomepageSyncSnapshot,
      applySyncedPreferences,
    },
  };
};
