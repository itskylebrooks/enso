import { describe, expect, it } from 'vitest';
import {
  buildHomepageState,
  buildSettingsState,
  buildSyncPayloadData,
  mergeSyncPayload,
} from '../src/lib/backend/syncMerge';
import type { SyncPayloadData } from '../src/lib/supabase/types';

type SyncPayloadOverrides = {
  db?: Partial<SyncPayloadData['db']>;
  settings?: Partial<SyncPayloadData['settings']>;
  homepage?: Partial<SyncPayloadData['homepage']>;
  timestamps?: Partial<SyncPayloadData['timestamps']>;
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
  };
};

describe('mergeSyncPayload', () => {
  it('prefers the newer remote DB snapshot', () => {
    const local = buildPayload({
      db: {
        progress: [{ techniqueId: 't1', bookmarked: false, updatedAt: 10 }],
      },
      timestamps: { db: 10 },
    });

    const remote = buildPayload({
      db: {
        progress: [{ techniqueId: 't1', bookmarked: true, updatedAt: 20 }],
      },
      timestamps: { db: 20 },
    });

    const merged = mergeSyncPayload(local, remote);
    expect(merged.db.progress[0]?.bookmarked).toBe(true);
    expect(merged.timestamps.db).toBe(20);
  });

  it('keeps newer local settings over stale remote settings', () => {
    const local = buildPayload({
      settings: {
        locale: 'de',
      },
      timestamps: { settings: 30 },
    });

    const remote = buildPayload({
      settings: {
        locale: 'en',
      },
      timestamps: { settings: 12 },
    });

    const merged = mergeSyncPayload(local, remote);
    expect(merged.settings.locale).toBe('de');
    expect(merged.timestamps.settings).toBe(30);
  });

  it('uses remote homepage when timestamps tie', () => {
    const local = buildPayload({
      homepage: {
        beltPromptDismissed: false,
      },
      timestamps: { homepage: 50 },
    });

    const remote = buildPayload({
      homepage: {
        beltPromptDismissed: true,
      },
      timestamps: { homepage: 50 },
    });

    const merged = mergeSyncPayload(local, remote);
    expect(merged.homepage.beltPromptDismissed).toBe(true);
    expect(merged.timestamps.homepage).toBe(50);
  });
});
