import { describe, expect, it } from 'vitest';
import type { SyncMetaState, SyncPayloadData } from '../src/lib/supabase/types';
import {
  buildClearedSyncMeta,
  buildLocalSyncPayloadForController,
} from '../src/shared/app/syncControllerModel';
import type { DB } from '../src/shared/types';

const baseDB = (): DB => ({
  version: 7,
  techniques: [],
  progress: [],
  glossaryProgress: [],
  exerciseProgress: [],
  studyStatus: {},
  collections: [],
  bookmarkCollections: [],
  glossaryBookmarkCollections: [],
  exerciseBookmarkCollections: [],
});

const baseSyncMeta = (): SyncMetaState => ({
  dbUpdatedAt: 0,
  settingsUpdatedAt: 0,
  homepageUpdatedAt: 0,
  lastSyncedAt: null,
  tombstones: {},
});

const settings: SyncPayloadData['settings'] = {
  themePreference: null,
  locale: 'en',
  filters: {},
  filterPanelPinned: false,
};

const homepage: SyncPayloadData['homepage'] = {
  pinnedBeltGrade: null,
  beltPromptDismissed: false,
  onboardingDismissed: false,
  onboardingCompleted: false,
  onboardingStep: null,
};

describe('sync controller model', () => {
  it('builds local payloads from synced DB fields, preference state, and computed timestamps', () => {
    const recentTimestamp = 2_000_000_000_000;
    const db: DB = {
      ...baseDB(),
      progress: [{ techniqueId: 't1', bookmarked: true, updatedAt: 20 }],
      collections: [
        {
          id: 'c1',
          name: 'A',
          itemIds: ['technique:t1'],
          sortOrder: 0,
          createdAt: 10,
          updatedAt: 30,
        },
      ],
    };

    const payload = buildLocalSyncPayloadForController({
      db,
      syncMeta: {
        ...baseSyncMeta(),
        dbUpdatedAt: 15,
        settingsUpdatedAt: 40,
        homepageUpdatedAt: 50,
        tombstones: { 'progress:t2': recentTimestamp },
      },
      settings,
      homepage,
    });

    expect(payload.db.progress).toEqual(db.progress);
    expect(payload.db.collections).toEqual(db.collections);
    expect(payload.settings).toEqual(settings);
    expect(payload.homepage).toEqual(homepage);
    expect(payload.timestamps).toEqual({ db: recentTimestamp, settings: 40, homepage: 50 });
    expect(payload.tombstones).toEqual({ 'progress:t2': recentTimestamp });
  });

  it('creates clear-data tombstones for synced domains and preserves newer existing tombstones', () => {
    const deletedAt = 2_000_000_000_000;
    const newerDeletedAt = deletedAt + 400;
    const olderDeletedAt = deletedAt - 200;
    const db: DB = {
      ...baseDB(),
      glossaryProgress: [{ termId: 'ma-ai', bookmarked: true, updatedAt: 10 }],
      exerciseProgress: [{ exerciseId: 'rolls', bookmarked: true, updatedAt: 11 }],
      studyStatus: { 'technique:t1': { status: 'practice', updatedAt: 12 } },
      collections: [
        {
          id: 'c1',
          name: 'A',
          itemIds: ['technique:t1'],
          sortOrder: 0,
          createdAt: 13,
          updatedAt: 14,
        },
      ],
      bookmarkCollections: [
        { id: 'bc1', collectionId: 'c1', techniqueId: 't1', createdAt: 15 },
      ],
      glossaryBookmarkCollections: [
        { id: 'gbc1', collectionId: 'c1', termId: 'ma-ai', createdAt: 16 },
      ],
      exerciseBookmarkCollections: [
        { id: 'ebc1', collectionId: 'c1', exerciseId: 'rolls', createdAt: 17 },
      ],
    };

    const nextMeta = buildClearedSyncMeta({
      db,
      syncMeta: {
        ...baseSyncMeta(),
        tombstones: {
          'collection:c1': newerDeletedAt,
          'progress:old': olderDeletedAt,
        },
      },
      deletedAt,
    });

    expect(nextMeta.dbUpdatedAt).toBe(deletedAt);
    expect(nextMeta.tombstones['glossaryProgress:ma-ai']).toBe(deletedAt);
    expect(nextMeta.tombstones['exerciseProgress:rolls']).toBe(deletedAt);
    expect(nextMeta.tombstones['studyStatus:technique:t1']).toBe(deletedAt);
    expect(nextMeta.tombstones['collection:c1']).toBe(newerDeletedAt);
    expect(nextMeta.tombstones['bookmarkCollection:c1:t1']).toBe(deletedAt);
    expect(nextMeta.tombstones['glossaryBookmarkCollection:c1:ma-ai']).toBe(deletedAt);
    expect(nextMeta.tombstones['exerciseBookmarkCollection:c1:rolls']).toBe(deletedAt);
    expect(nextMeta.tombstones['progress:old']).toBe(olderDeletedAt);
  });
});
