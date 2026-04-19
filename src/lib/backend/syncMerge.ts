import type { DB, Filters, Grade, Locale, Theme } from '@shared/types';
import type {
  SyncDomainTimestamps,
  SyncHomepageState,
  SyncPayloadData,
  SyncSettingsState,
  SyncedDBState,
} from '../supabase/types';

const CURRENT_SYNC_VERSION = 1 as const;

export const pickSyncedDBState = (db: DB): SyncedDBState => ({
  progress: db.progress,
  glossaryProgress: db.glossaryProgress,
  exerciseProgress: db.exerciseProgress,
  studyStatus: db.studyStatus,
  collections: db.collections,
  bookmarkCollections: db.bookmarkCollections,
  glossaryBookmarkCollections: db.glossaryBookmarkCollections,
  exerciseBookmarkCollections: db.exerciseBookmarkCollections,
});

export const applySyncedDBState = (db: DB, synced: SyncedDBState): DB => ({
  ...db,
  progress: synced.progress,
  glossaryProgress: synced.glossaryProgress,
  exerciseProgress: synced.exerciseProgress,
  studyStatus: synced.studyStatus,
  collections: synced.collections,
  bookmarkCollections: synced.bookmarkCollections,
  glossaryBookmarkCollections: synced.glossaryBookmarkCollections,
  exerciseBookmarkCollections: synced.exerciseBookmarkCollections,
});

const getStudyStatusUpdatedAt = (studyStatus: SyncedDBState['studyStatus']): number => {
  return Object.values(studyStatus).reduce((maxUpdatedAt, entry) => {
    return Math.max(maxUpdatedAt, entry.updatedAt ?? 0);
  }, 0);
};

export const computeDBUpdatedAt = (db: SyncedDBState): number => {
  const progressUpdated = db.progress.reduce(
    (max, entry) => Math.max(max, entry.updatedAt ?? 0),
    0,
  );
  const glossaryUpdated = db.glossaryProgress.reduce(
    (max, entry) => Math.max(max, entry.updatedAt ?? 0),
    0,
  );
  const exerciseUpdated = db.exerciseProgress.reduce(
    (max, entry) => Math.max(max, entry.updatedAt ?? 0),
    0,
  );
  const collectionsUpdated = db.collections.reduce(
    (max, entry) => Math.max(max, entry.updatedAt ?? entry.createdAt ?? 0),
    0,
  );
  const bookmarkCollectionsUpdated = db.bookmarkCollections.reduce(
    (max, entry) => Math.max(max, entry.createdAt ?? 0),
    0,
  );
  const glossaryBookmarkCollectionsUpdated = db.glossaryBookmarkCollections.reduce(
    (max, entry) => Math.max(max, entry.createdAt ?? 0),
    0,
  );
  const exerciseBookmarkCollectionsUpdated = db.exerciseBookmarkCollections.reduce(
    (max, entry) => Math.max(max, entry.createdAt ?? 0),
    0,
  );
  const studyStatusUpdated = getStudyStatusUpdatedAt(db.studyStatus);

  return Math.max(
    progressUpdated,
    glossaryUpdated,
    exerciseUpdated,
    collectionsUpdated,
    bookmarkCollectionsUpdated,
    glossaryBookmarkCollectionsUpdated,
    exerciseBookmarkCollectionsUpdated,
    studyStatusUpdated,
  );
};

export const buildSettingsState = (params: {
  themePreference: Theme | null;
  locale: Locale;
  filters: Filters;
  filterPanelPinned: boolean;
}): SyncSettingsState => ({
  themePreference: params.themePreference,
  locale: params.locale,
  filters: params.filters,
  filterPanelPinned: params.filterPanelPinned,
});

export const buildHomepageState = (params: {
  pinnedBeltGrade: Grade | null;
  beltPromptDismissed: boolean;
  onboardingDismissed: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number | null;
}): SyncHomepageState => ({
  pinnedBeltGrade: params.pinnedBeltGrade,
  beltPromptDismissed: params.beltPromptDismissed,
  onboardingDismissed: params.onboardingDismissed,
  onboardingCompleted: params.onboardingCompleted,
  onboardingStep: params.onboardingStep,
});

export const buildSyncPayloadData = (params: {
  db: SyncedDBState;
  settings: SyncSettingsState;
  homepage: SyncHomepageState;
  timestamps: SyncDomainTimestamps;
}): SyncPayloadData => ({
  version: CURRENT_SYNC_VERSION,
  db: params.db,
  settings: params.settings,
  homepage: params.homepage,
  timestamps: params.timestamps,
});

const getNormalizedTimestamp = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.trunc(value);
};

export const mergeSyncPayload = (
  local: SyncPayloadData,
  remote: SyncPayloadData,
): SyncPayloadData => {
  const localDbUpdatedAt = getNormalizedTimestamp(local.timestamps?.db);
  const remoteDbUpdatedAt = getNormalizedTimestamp(remote.timestamps?.db);
  const localSettingsUpdatedAt = getNormalizedTimestamp(local.timestamps?.settings);
  const remoteSettingsUpdatedAt = getNormalizedTimestamp(remote.timestamps?.settings);
  const localHomepageUpdatedAt = getNormalizedTimestamp(local.timestamps?.homepage);
  const remoteHomepageUpdatedAt = getNormalizedTimestamp(remote.timestamps?.homepage);

  const mergedDb = remoteDbUpdatedAt >= localDbUpdatedAt ? remote.db : local.db;
  const mergedSettings =
    remoteSettingsUpdatedAt >= localSettingsUpdatedAt ? remote.settings : local.settings;
  const mergedHomepage =
    remoteHomepageUpdatedAt >= localHomepageUpdatedAt ? remote.homepage : local.homepage;

  return {
    version: CURRENT_SYNC_VERSION,
    db: mergedDb,
    settings: mergedSettings,
    homepage: mergedHomepage,
    timestamps: {
      db: Math.max(localDbUpdatedAt, remoteDbUpdatedAt, computeDBUpdatedAt(mergedDb)),
      settings: Math.max(localSettingsUpdatedAt, remoteSettingsUpdatedAt),
      homepage: Math.max(localHomepageUpdatedAt, remoteHomepageUpdatedAt),
    },
  };
};
