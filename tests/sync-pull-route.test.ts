import { describe, expect, it, vi } from 'vitest';
import { buildHomepageState, buildSettingsState, buildSyncPayloadData } from '../src/lib/backend/syncMerge';

const mocks = vi.hoisted(() => ({
  storedPayload: null as unknown,
}));

vi.mock('../src/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
  })),
  createSupabaseServiceRoleClient: vi.fn(async () => ({
    from: vi.fn(() => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => ({
          data: {
            user_id: 'user-1',
            payload: mocks.storedPayload,
            revision: 1,
            updated_at: '2026-01-01T00:00:00.000Z',
          },
          error: null,
        })),
      };
      return builder;
    }),
  })),
}));

const buildPayload = () =>
  buildSyncPayloadData({
    db: {
      progress: [],
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

const callPullRoute = async () => {
  const { POST } = await import('../src/app/api/sync/pull/route');
  return POST(
    new Request('https://enso.test/api/sync/pull', {
      method: 'POST',
      headers: { Authorization: 'Bearer token' },
    }),
  );
};

describe('/api/sync/pull', () => {
  it('rejects malformed stored payloads', async () => {
    mocks.storedPayload = { version: 2, db: {} };

    const response = await callPullRoute();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      message: 'Stored sync state is invalid',
    });
  });

  it('returns validated stored payloads', async () => {
    mocks.storedPayload = buildPayload();

    const response = await callPullRoute();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      payload: { version: 2 },
      revision: 1,
    });
  });
});
