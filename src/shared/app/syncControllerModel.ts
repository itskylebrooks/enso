import {
  buildSyncPayloadData,
  buildTombstonesForSyncedState,
  computeDBUpdatedAt,
  pickSyncedDBState,
  pruneSyncTombstones,
} from '../../lib/backend/syncMerge';
import type { SyncMetaState, SyncPayloadData, SyncTombstones } from '../../lib/supabase/types';
import type { DB } from '../types';

type BuildLocalSyncPayloadParams = {
  db: DB;
  syncMeta: SyncMetaState;
  settings: SyncPayloadData['settings'];
  homepage: SyncPayloadData['homepage'];
};

export const buildLocalSyncPayloadForController = ({
  db,
  syncMeta,
  settings,
  homepage,
}: BuildLocalSyncPayloadParams): SyncPayloadData => {
  const syncedDB = pickSyncedDBState(db);
  const tombstones = pruneSyncTombstones(syncMeta.tombstones);
  const computedDbUpdatedAt = computeDBUpdatedAt(syncedDB, tombstones);
  const dbTimestamp = Math.max(syncMeta.dbUpdatedAt, computedDbUpdatedAt);

  return buildSyncPayloadData({
    db: syncedDB,
    settings,
    homepage,
    timestamps: {
      db: dbTimestamp,
      settings: syncMeta.settingsUpdatedAt,
      homepage: syncMeta.homepageUpdatedAt,
    },
    tombstones,
  });
};

export const mergeSyncTombstones = (
  current: SyncTombstones,
  incoming: SyncTombstones,
): SyncTombstones => {
  const nextTombstones: SyncTombstones = { ...current };
  Object.entries(incoming).forEach(([key, deletedAt]) => {
    nextTombstones[key] = Math.max(nextTombstones[key] ?? 0, deletedAt);
  });
  return pruneSyncTombstones(nextTombstones);
};

export const buildClearedSyncMeta = ({
  db,
  syncMeta,
  deletedAt,
}: {
  db: DB;
  syncMeta: SyncMetaState;
  deletedAt: number;
}): SyncMetaState => {
  const tombstones = buildTombstonesForSyncedState(pickSyncedDBState(db), deletedAt);
  return {
    ...syncMeta,
    dbUpdatedAt: deletedAt,
    tombstones: mergeSyncTombstones(syncMeta.tombstones, tombstones),
  };
};
