import { describe, expect, it } from 'vitest';
import {
  buildHomepageState,
  buildSettingsState,
  buildSyncPayloadData,
  getBookmarkCollectionTombstoneKey,
  getCollectionTombstoneKey,
  mergeSyncPayload,
  pruneSyncTombstones,
} from '../src/lib/backend/syncMerge';
import type { SyncPayloadData } from '../src/lib/supabase/types';

type SyncPayloadOverrides = {
  db?: Partial<SyncPayloadData['db']>;
  settings?: Partial<SyncPayloadData['settings']>;
  homepage?: Partial<SyncPayloadData['homepage']>;
  timestamps?: Partial<SyncPayloadData['timestamps']>;
  tombstones?: SyncPayloadData['tombstones'];
};

const buildPayload = (overrides?: SyncPayloadOverrides): SyncPayloadData => {
  const base = buildSyncPayloadData({
    db: {
      progress: [{ techniqueId: 't1', bookmarked: false, updatedAt: 10 }],
      glossaryProgress: [{ termId: 'g1', bookmarked: false, updatedAt: 10 }],
      exerciseProgress: [{ exerciseId: 'e1', bookmarked: false, updatedAt: 10 }],
      studyStatus: {
        'technique:t1': {
          status: 'none',
          updatedAt: 10,
        },
      },
      collections: [],
      bookmarkCollections: [],
      glossaryBookmarkCollections: [],
      exerciseBookmarkCollections: [],
    },
    settings: buildSettingsState({
      themePreference: null,
      locale: 'en',
      filters: {},
      filterPanelPinned: false,
    }),
    homepage: buildHomepageState({
      pinnedBeltGrade: null,
      beltPromptDismissed: false,
      onboardingDismissed: false,
      onboardingCompleted: false,
      onboardingStep: 0,
    }),
    timestamps: {
      db: 10,
      settings: 10,
      homepage: 10,
    },
    tombstones: {},
  });

  return {
    ...base,
    ...overrides,
    db: {
      ...base.db,
      ...(overrides?.db ?? {}),
    },
    settings: {
      ...base.settings,
      ...(overrides?.settings ?? {}),
    },
    homepage: {
      ...base.homepage,
      ...(overrides?.homepage ?? {}),
    },
    timestamps: {
      ...base.timestamps,
      ...(overrides?.timestamps ?? {}),
    },
    tombstones: overrides?.tombstones ?? base.tombstones,
  };
};

describe('mergeSyncPayload', () => {
  it('keeps independent offline DB edits from both sides', () => {
    const local = buildPayload({
      db: {
        progress: [{ techniqueId: 't1', bookmarked: true, updatedAt: 20 }],
        studyStatus: {},
      },
      timestamps: { db: 20 },
    });

    const remote = buildPayload({
      db: {
        progress: [{ techniqueId: 't1', bookmarked: false, updatedAt: 10 }],
        studyStatus: {
          'technique:t2': {
            status: 'practice',
            updatedAt: 30,
          },
        },
      },
      timestamps: { db: 30 },
    });

    const merged = mergeSyncPayload(local, remote);
    expect(merged.db.progress.find((entry) => entry.techniqueId === 't1')?.bookmarked).toBe(true);
    expect(merged.db.studyStatus['technique:t2']?.status).toBe('practice');
  });

  it('keeps concurrent bookmark and study status updates', () => {
    const local = buildPayload({
      db: {
        progress: [{ techniqueId: 't1', bookmarked: true, updatedAt: 25 }],
      },
      timestamps: { db: 25 },
    });

    const remote = buildPayload({
      db: {
        studyStatus: {
          'technique:t1': {
            status: 'stable',
            updatedAt: 26,
          },
        },
      },
      timestamps: { db: 26 },
    });

    const merged = mergeSyncPayload(local, remote);
    expect(merged.db.progress.find((entry) => entry.techniqueId === 't1')?.bookmarked).toBe(true);
    expect(merged.db.studyStatus['technique:t1']?.status).toBe('stable');
  });

  it('prevents a deleted collection from being resurrected by stale remote data', () => {
    const collection = {
      id: 'c1',
      name: 'Favorites',
      icon: null,
      itemIds: [],
      sortOrder: 0,
      createdAt: 10,
      updatedAt: 10,
    };
    const local = buildPayload({
      db: { collections: [] },
      tombstones: {
        [getCollectionTombstoneKey('c1')]: 40,
      },
      timestamps: { db: 40 },
    });
    const remote = buildPayload({
      db: { collections: [collection] },
      timestamps: { db: 10 },
    });

    const merged = mergeSyncPayload(local, remote);
    expect(merged.db.collections).toEqual([]);
    expect(merged.tombstones[getCollectionTombstoneKey('c1')]).toBe(40);
  });

  it('lets a newer membership re-add win over an older tombstone', () => {
    const membership = {
      id: 'bc2',
      techniqueId: 't1',
      collectionId: 'c1',
      createdAt: 50,
    };
    const local = buildPayload({
      db: { bookmarkCollections: [membership] },
      timestamps: { db: 50 },
    });
    const remote = buildPayload({
      db: { bookmarkCollections: [] },
      tombstones: {
        [getBookmarkCollectionTombstoneKey('c1', 't1')]: 40,
      },
      timestamps: { db: 40 },
    });

    const merged = mergeSyncPayload(local, remote);
    expect(merged.db.bookmarkCollections).toEqual([membership]);
  });

  it('uses deterministic tie-breaking for equal timestamps', () => {
    const local = buildPayload({
      settings: { locale: 'de' },
      timestamps: { settings: 100 },
    });
    const remote = buildPayload({
      settings: { locale: 'en' },
      timestamps: { settings: 100 },
    });

    const leftMerged = mergeSyncPayload(local, remote);
    const rightMerged = mergeSyncPayload(remote, local);
    expect(leftMerged.settings).toEqual(rightMerged.settings);
  });

  it('prunes expired tombstones and keeps recent tombstones', () => {
    const now = 1_000_000_000_000;
    const recent = now - 10_000;
    const expired = now - 181 * 24 * 60 * 60 * 1000;

    expect(
      pruneSyncTombstones(
        {
          recent,
          expired,
        },
        now,
      ),
    ).toEqual({ recent });
  });
});
