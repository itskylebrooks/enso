import { describe, expect, it } from 'vitest';
import { buildHomepageState, buildSettingsState, buildSyncPayloadData } from '../src/lib/backend/syncMerge';
import { SyncPayloadSchema } from '../src/lib/backend/syncSchema';

const buildPayload = () =>
  buildSyncPayloadData({
    db: {
      progress: [{ techniqueId: 't1', bookmarked: false, updatedAt: 1 }],
      glossaryProgress: [],
      exerciseProgress: [],
      studyStatus: {},
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
      onboardingStep: null,
    }),
    timestamps: { db: 1, settings: 1, homepage: 1 },
    tombstones: {},
  });

describe('SyncPayloadSchema', () => {
  it('normalizes the optional navigation preference for older version 2 payloads', () => {
    const payload = buildPayload() as unknown as {
      settings: { showTeachInPrimaryNav?: boolean };
    };
    delete payload.settings.showTeachInPrimaryNav;

    expect(SyncPayloadSchema.parse(payload).settings.showTeachInPrimaryNav).toBe(false);
  });

  it('normalizes collection timestamps from older version 2 payloads', () => {
    const payload = buildPayload();
    const legacyCollection = {
      id: 'c1',
      name: 'Legacy',
      icon: null,
      itemIds: [],
      sortOrder: 0,
      createdAt: 25,
    };
    const parsed = SyncPayloadSchema.parse({
      ...payload,
      db: { ...payload.db, collections: [legacyCollection] },
    });

    expect(parsed.db.collections[0]?.updatedAt).toBe(25);
  });

  it('rejects malformed records inside synced DB arrays', () => {
    const payload = buildPayload();
    const malformed = {
      ...payload,
      db: {
        ...payload.db,
        progress: [{ techniqueId: 't1', bookmarked: 'yes', updatedAt: 1 }],
      },
    };

    expect(SyncPayloadSchema.safeParse(malformed).success).toBe(false);
  });

  it('rejects unknown fields instead of persisting unowned sync data', () => {
    const payload = buildPayload();
    const malformed = {
      ...payload,
      db: {
        ...payload.db,
        progress: [{ ...payload.db.progress[0], injected: true }],
      },
    };

    expect(SyncPayloadSchema.safeParse(malformed).success).toBe(false);
  });
});
