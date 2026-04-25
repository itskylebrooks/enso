import type {
  BookmarkCollection,
  Collection,
  DB,
  ExerciseBookmarkCollection,
  ExerciseProgress,
  Filters,
  GlossaryBookmarkCollection,
  GlossaryProgress,
  Grade,
  Locale,
  Progress,
  StudyStatusEntry,
  Theme,
} from '@shared/types';
import type {
  SyncDomainTimestamps,
  SyncHomepageState,
  SyncPayloadData,
  SyncSettingsState,
  SyncTombstones,
  SyncedDBState,
} from '../supabase/types';

const CURRENT_SYNC_VERSION = 2 as const;
const TOMBSTONE_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

export const getProgressTombstoneKey = (techniqueId: string): string => `progress:${techniqueId}`;
export const getGlossaryProgressTombstoneKey = (termId: string): string =>
  `glossaryProgress:${termId}`;
export const getExerciseProgressTombstoneKey = (exerciseId: string): string =>
  `exerciseProgress:${exerciseId}`;
export const getStudyStatusTombstoneKey = (key: string): string => `studyStatus:${key}`;
export const getCollectionTombstoneKey = (collectionId: string): string =>
  `collection:${collectionId}`;
export const getBookmarkCollectionTombstoneKey = (
  collectionId: string,
  techniqueId: string,
): string => `bookmarkCollection:${collectionId}:${techniqueId}`;
export const getGlossaryBookmarkCollectionTombstoneKey = (
  collectionId: string,
  termId: string,
): string => `glossaryBookmarkCollection:${collectionId}:${termId}`;
export const getExerciseBookmarkCollectionTombstoneKey = (
  collectionId: string,
  exerciseId: string,
): string => `exerciseBookmarkCollection:${collectionId}:${exerciseId}`;

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

export const getTombstonesUpdatedAt = (tombstones: SyncTombstones): number => {
  return Object.values(tombstones).reduce((maxUpdatedAt, deletedAt) => {
    return Math.max(maxUpdatedAt, getNormalizedTimestamp(deletedAt));
  }, 0);
};

export const computeDBUpdatedAt = (
  db: SyncedDBState,
  tombstones: SyncTombstones = {},
): number => {
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
  const tombstonesUpdated = getTombstonesUpdatedAt(tombstones);

  return Math.max(
    progressUpdated,
    glossaryUpdated,
    exerciseUpdated,
    collectionsUpdated,
    bookmarkCollectionsUpdated,
    glossaryBookmarkCollectionsUpdated,
    exerciseBookmarkCollectionsUpdated,
    studyStatusUpdated,
    tombstonesUpdated,
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
  tombstones?: SyncTombstones;
}): SyncPayloadData => ({
  version: CURRENT_SYNC_VERSION,
  db: params.db,
  settings: params.settings,
  homepage: params.homepage,
  timestamps: params.timestamps,
  tombstones: sanitizeSyncTombstones(params.tombstones ?? {}),
});

const getNormalizedTimestamp = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.trunc(value);
};

export const pruneSyncTombstones = (
  tombstones: SyncTombstones,
  now: number = Date.now(),
): SyncTombstones => {
  const cutoff = now - TOMBSTONE_RETENTION_MS;
  return Object.fromEntries(
    Object.entries(sanitizeSyncTombstones(tombstones)).filter(([, deletedAt]) => {
      return deletedAt >= cutoff;
    }),
  );
};

export const sanitizeSyncTombstones = (tombstones: unknown): SyncTombstones => {
  if (!tombstones || typeof tombstones !== 'object' || Array.isArray(tombstones)) {
    return {};
  }

  const sanitized: SyncTombstones = {};
  Object.entries(tombstones as Record<string, unknown>).forEach(([key, value]) => {
    const timestamp = typeof value === 'number' ? getNormalizedTimestamp(value) : 0;
    if (key.trim().length > 0 && timestamp > 0) {
      sanitized[key] = timestamp;
    }
  });
  return sanitized;
};

export const buildTombstonesForSyncedState = (
  synced: SyncedDBState,
  deletedAt: number,
): SyncTombstones => {
  const timestamp = getNormalizedTimestamp(deletedAt) || Date.now();
  const tombstones: SyncTombstones = {};

  synced.glossaryProgress.forEach((entry) => {
    tombstones[getGlossaryProgressTombstoneKey(entry.termId)] = timestamp;
  });
  synced.exerciseProgress.forEach((entry) => {
    tombstones[getExerciseProgressTombstoneKey(entry.exerciseId)] = timestamp;
  });
  Object.keys(synced.studyStatus).forEach((key) => {
    tombstones[getStudyStatusTombstoneKey(key)] = timestamp;
  });
  synced.collections.forEach((entry) => {
    tombstones[getCollectionTombstoneKey(entry.id)] = timestamp;
  });
  synced.bookmarkCollections.forEach((entry) => {
    tombstones[getBookmarkCollectionTombstoneKey(entry.collectionId, entry.techniqueId)] =
      timestamp;
  });
  synced.glossaryBookmarkCollections.forEach((entry) => {
    tombstones[getGlossaryBookmarkCollectionTombstoneKey(entry.collectionId, entry.termId)] =
      timestamp;
  });
  synced.exerciseBookmarkCollections.forEach((entry) => {
    tombstones[getExerciseBookmarkCollectionTombstoneKey(entry.collectionId, entry.exerciseId)] =
      timestamp;
  });

  return tombstones;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(',')}}`;
};

const pickRecord = <T>(
  left: T,
  right: T,
  getUpdatedAt: (entry: T) => number,
): T => {
  const leftUpdatedAt = getNormalizedTimestamp(getUpdatedAt(left));
  const rightUpdatedAt = getNormalizedTimestamp(getUpdatedAt(right));

  if (leftUpdatedAt !== rightUpdatedAt) {
    return leftUpdatedAt > rightUpdatedAt ? left : right;
  }

  return stableStringify(left) >= stableStringify(right) ? left : right;
};

const mergeRecordArray = <T>(
  local: T[],
  remote: T[],
  getKey: (entry: T) => string,
  getUpdatedAt: (entry: T) => number,
  tombstones: SyncTombstones,
  getTombstoneKey: (entryKey: string) => string,
  sortRecords: (left: T, right: T) => number,
): T[] => {
  const records = new Map<string, T>();

  [...local, ...remote].forEach((entry) => {
    const key = getKey(entry);
    const existing = records.get(key);
    records.set(key, existing ? pickRecord(existing, entry, getUpdatedAt) : entry);
  });

  return [...records.entries()]
    .filter(([key, entry]) => {
      const deletedAt = getNormalizedTimestamp(tombstones[getTombstoneKey(key)]);
      return deletedAt <= 0 || getNormalizedTimestamp(getUpdatedAt(entry)) > deletedAt;
    })
    .map(([, entry]) => entry)
    .sort(sortRecords);
};

const mergeStudyStatus = (
  local: SyncedDBState['studyStatus'],
  remote: SyncedDBState['studyStatus'],
  tombstones: SyncTombstones,
): SyncedDBState['studyStatus'] => {
  const merged: Array<[string, StudyStatusEntry]> = [];
  const keys = new Set([...Object.keys(local), ...Object.keys(remote)]);

  keys.forEach((key) => {
    const localEntry = local[key];
    const remoteEntry = remote[key];
    const entry =
      localEntry && remoteEntry
        ? pickRecord(localEntry, remoteEntry, (value) => value.updatedAt)
        : (localEntry ?? remoteEntry);
    if (!entry) return;

    const deletedAt = getNormalizedTimestamp(tombstones[getStudyStatusTombstoneKey(key)]);
    if (deletedAt > 0 && getNormalizedTimestamp(entry.updatedAt) <= deletedAt) {
      return;
    }

    merged.push([key, entry]);
  });

  return Object.fromEntries(merged.sort(([left], [right]) => left.localeCompare(right)));
};

const mergeTombstones = (
  local: SyncTombstones,
  remote: SyncTombstones,
): SyncTombstones => {
  const merged: SyncTombstones = {};
  [...Object.entries(sanitizeSyncTombstones(local)), ...Object.entries(sanitizeSyncTombstones(remote))]
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, deletedAt]) => {
      merged[key] = Math.max(merged[key] ?? 0, deletedAt);
    });
  return merged;
};

const getCollectionUpdatedAt = (entry: Collection): number => entry.updatedAt ?? entry.createdAt;
const getMembershipUpdatedAt = (
  entry: BookmarkCollection | GlossaryBookmarkCollection | ExerciseBookmarkCollection,
): number => entry.createdAt;

const compareByString = (left: string, right: string): number => left.localeCompare(right);

const mergeDB = (
  local: SyncedDBState,
  remote: SyncedDBState,
  tombstones: SyncTombstones,
): SyncedDBState => ({
  progress: mergeRecordArray<Progress>(
    local.progress,
    remote.progress,
    (entry) => entry.techniqueId,
    (entry) => entry.updatedAt,
    tombstones,
    getProgressTombstoneKey,
    (left, right) => compareByString(left.techniqueId, right.techniqueId),
  ),
  glossaryProgress: mergeRecordArray<GlossaryProgress>(
    local.glossaryProgress,
    remote.glossaryProgress,
    (entry) => entry.termId,
    (entry) => entry.updatedAt,
    tombstones,
    getGlossaryProgressTombstoneKey,
    (left, right) => compareByString(left.termId, right.termId),
  ),
  exerciseProgress: mergeRecordArray<ExerciseProgress>(
    local.exerciseProgress,
    remote.exerciseProgress,
    (entry) => entry.exerciseId,
    (entry) => entry.updatedAt,
    tombstones,
    getExerciseProgressTombstoneKey,
    (left, right) => compareByString(left.exerciseId, right.exerciseId),
  ),
  studyStatus: mergeStudyStatus(local.studyStatus, remote.studyStatus, tombstones),
  collections: mergeRecordArray<Collection>(
    local.collections,
    remote.collections,
    (entry) => entry.id,
    getCollectionUpdatedAt,
    tombstones,
    getCollectionTombstoneKey,
    (left, right) => left.sortOrder - right.sortOrder || compareByString(left.id, right.id),
  ),
  bookmarkCollections: mergeRecordArray<BookmarkCollection>(
    local.bookmarkCollections,
    remote.bookmarkCollections,
    (entry) => `${entry.collectionId}:${entry.techniqueId}`,
    getMembershipUpdatedAt,
    tombstones,
    (key) => {
      const [collectionId, techniqueId] = key.split(':');
      return getBookmarkCollectionTombstoneKey(collectionId, techniqueId);
    },
    (left, right) => left.createdAt - right.createdAt || compareByString(left.id, right.id),
  ),
  glossaryBookmarkCollections: mergeRecordArray<GlossaryBookmarkCollection>(
    local.glossaryBookmarkCollections,
    remote.glossaryBookmarkCollections,
    (entry) => `${entry.collectionId}:${entry.termId}`,
    getMembershipUpdatedAt,
    tombstones,
    (key) => {
      const [collectionId, termId] = key.split(':');
      return getGlossaryBookmarkCollectionTombstoneKey(collectionId, termId);
    },
    (left, right) => left.createdAt - right.createdAt || compareByString(left.id, right.id),
  ),
  exerciseBookmarkCollections: mergeRecordArray<ExerciseBookmarkCollection>(
    local.exerciseBookmarkCollections,
    remote.exerciseBookmarkCollections,
    (entry) => `${entry.collectionId}:${entry.exerciseId}`,
    getMembershipUpdatedAt,
    tombstones,
    (key) => {
      const [collectionId, exerciseId] = key.split(':');
      return getExerciseBookmarkCollectionTombstoneKey(collectionId, exerciseId);
    },
    (left, right) => left.createdAt - right.createdAt || compareByString(left.id, right.id),
  ),
});

const pickDomain = <T>(local: T, remote: T, localUpdatedAt: number, remoteUpdatedAt: number): T => {
  if (localUpdatedAt !== remoteUpdatedAt) {
    return localUpdatedAt > remoteUpdatedAt ? local : remote;
  }

  return stableStringify(local) >= stableStringify(remote) ? local : remote;
};

export const mergeSyncPayload = (
  local: SyncPayloadData,
  remote: SyncPayloadData,
): SyncPayloadData => {
  const mergedTombstones = mergeTombstones(local.tombstones, remote.tombstones);
  const localDbUpdatedAt = getNormalizedTimestamp(local.timestamps?.db);
  const remoteDbUpdatedAt = getNormalizedTimestamp(remote.timestamps?.db);
  const localSettingsUpdatedAt = getNormalizedTimestamp(local.timestamps?.settings);
  const remoteSettingsUpdatedAt = getNormalizedTimestamp(remote.timestamps?.settings);
  const localHomepageUpdatedAt = getNormalizedTimestamp(local.timestamps?.homepage);
  const remoteHomepageUpdatedAt = getNormalizedTimestamp(remote.timestamps?.homepage);
  const mergedDb = mergeDB(local.db, remote.db, mergedTombstones);
  const mergedSettings = pickDomain(
    local.settings,
    remote.settings,
    localSettingsUpdatedAt,
    remoteSettingsUpdatedAt,
  );
  const mergedHomepage = pickDomain(
    local.homepage,
    remote.homepage,
    localHomepageUpdatedAt,
    remoteHomepageUpdatedAt,
  );

  return {
    version: CURRENT_SYNC_VERSION,
    db: mergedDb,
    settings: mergedSettings,
    homepage: mergedHomepage,
    timestamps: {
      db: Math.max(localDbUpdatedAt, remoteDbUpdatedAt, computeDBUpdatedAt(mergedDb, mergedTombstones)),
      settings: Math.max(localSettingsUpdatedAt, remoteSettingsUpdatedAt),
      homepage: Math.max(localHomepageUpdatedAt, remoteHomepageUpdatedAt),
    },
    tombstones: mergedTombstones,
  };
};
