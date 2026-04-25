import { describe, expect, it, vi } from 'vitest';
import { buildHomepageState, buildSettingsState, buildSyncPayloadData } from '../src/lib/backend/syncMerge';
import type { SyncPayloadData } from '../src/lib/supabase/types';

const mocks = vi.hoisted(() => ({
  serviceClient: null as unknown,
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
  createSupabaseServiceRoleClient: vi.fn(async () => mocks.serviceClient),
}));

type QueryStep = {
  op: 'read' | 'insert' | 'update';
  data?: unknown;
  error?: { message?: string; code?: string } | null;
  assertPayload?: (payload: unknown) => void;
  assertFilters?: (filters: Record<string, unknown>) => void;
};

const buildPayload = (overrides?: {
  progress?: SyncPayloadData['db']['progress'];
  studyStatus?: SyncPayloadData['db']['studyStatus'];
  timestamp?: number;
}): SyncPayloadData =>
  buildSyncPayloadData({
    db: {
      progress: overrides?.progress ?? [{ techniqueId: 't1', bookmarked: false, updatedAt: 1 }],
      glossaryProgress: [],
      exerciseProgress: [],
      studyStatus: overrides?.studyStatus ?? {},
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
    timestamps: {
      db: overrides?.timestamp ?? 1,
      settings: 1,
      homepage: 1,
    },
    tombstones: {},
  });

const createServiceClient = (steps: QueryStep[]) => {
  const next = (op: QueryStep['op'], payload: unknown, filters: Record<string, unknown>) => {
    const step = steps.shift();
    if (!step) {
      throw new Error(`Unexpected ${op} query`);
    }
    expect(step.op).toBe(op);
    step.assertPayload?.(payload);
    step.assertFilters?.(filters);
    return Promise.resolve({
      data: step.data,
      error: step.error ?? null,
    });
  };

  return {
    from: vi.fn(() => {
      let op: QueryStep['op'] = 'read';
      let payload: unknown = null;
      const filters: Record<string, unknown> = {};
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn((key: string, value: unknown) => {
          filters[key] = value;
          return builder;
        }),
        insert: vi.fn((nextPayload: unknown) => {
          op = 'insert';
          payload = nextPayload;
          return builder;
        }),
        update: vi.fn((nextPayload: unknown) => {
          op = 'update';
          payload = nextPayload;
          return builder;
        }),
        maybeSingle: vi.fn(() => next(op, payload, filters)),
        single: vi.fn(() => next(op, payload, filters)),
      };
      return builder;
    }),
  };
};

const callPushRoute = async (payload: SyncPayloadData) => {
  const { POST } = await import('../src/app/api/sync/push/route');
  return POST(
    new Request('https://enso.test/api/sync/push', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload }),
    }),
  );
};

describe('/api/sync/push', () => {
  it('retries a stale revision and merges against the newer row', async () => {
    const incomingPayload = buildPayload({
      progress: [{ techniqueId: 't1', bookmarked: true, updatedAt: 20 }],
      timestamp: 20,
    });
    const firstExisting = buildPayload({ timestamp: 1 });
    const secondExisting = buildPayload({
      studyStatus: { 'technique:t2': { status: 'practice', updatedAt: 25 } },
      timestamp: 25,
    });

    mocks.serviceClient = createServiceClient([
      { op: 'read', data: { user_id: 'user-1', payload: firstExisting, revision: 1 } },
      {
        op: 'update',
        data: null,
        assertFilters: (filters) => {
          expect(filters.revision).toBe(1);
        },
      },
      { op: 'read', data: { user_id: 'user-1', payload: secondExisting, revision: 2 } },
      {
        op: 'update',
        data: {
          user_id: 'user-1',
          payload: buildPayload({
            progress: [{ techniqueId: 't1', bookmarked: true, updatedAt: 20 }],
            studyStatus: { 'technique:t2': { status: 'practice', updatedAt: 25 } },
            timestamp: 25,
          }),
          revision: 3,
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        assertFilters: (filters) => {
          expect(filters.revision).toBe(2);
        },
      },
    ]);

    const response = await callPushRoute(incomingPayload);
    const json = (await response.json()) as { payload: SyncPayloadData; revision: number };

    expect(response.status).toBe(200);
    expect(json.revision).toBe(3);
    expect(json.payload.db.progress.find((entry) => entry.techniqueId === 't1')?.bookmarked).toBe(
      true,
    );
    expect(json.payload.db.studyStatus['technique:t2']?.status).toBe('practice');
  });

  it('retries when another request inserts the first row', async () => {
    const incomingPayload = buildPayload({ timestamp: 10 });
    const existingPayload = buildPayload({
      studyStatus: { 'technique:t2': { status: 'stable', updatedAt: 11 } },
      timestamp: 11,
    });

    mocks.serviceClient = createServiceClient([
      { op: 'read', data: null },
      { op: 'insert', error: { code: '23505', message: 'duplicate key value' } },
      { op: 'read', data: { user_id: 'user-1', payload: existingPayload, revision: 1 } },
      {
        op: 'update',
        data: {
          user_id: 'user-1',
          payload: buildPayload({
            progress: incomingPayload.db.progress,
            studyStatus: existingPayload.db.studyStatus,
            timestamp: 11,
          }),
          revision: 2,
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      },
    ]);

    const response = await callPushRoute(incomingPayload);
    const json = (await response.json()) as { revision: number };

    expect(response.status).toBe(200);
    expect(json.revision).toBe(2);
  });

  it('advances revision and updatedAt on successful write', async () => {
    const incomingPayload = buildPayload({ timestamp: 10 });
    const existingPayload = buildPayload({ timestamp: 1 });

    mocks.serviceClient = createServiceClient([
      { op: 'read', data: { user_id: 'user-1', payload: existingPayload, revision: 4 } },
      {
        op: 'update',
        data: {
          user_id: 'user-1',
          payload: incomingPayload,
          revision: 5,
          updated_at: '2026-01-01T00:00:00.000Z',
        },
        assertPayload: (payload) => {
          expect(payload).toMatchObject({
            revision: 5,
          });
          expect(typeof (payload as { updated_at?: unknown }).updated_at).toBe('string');
        },
      },
    ]);

    const response = await callPushRoute(incomingPayload);
    const json = (await response.json()) as { revision: number; updatedAt: string };

    expect(response.status).toBe(200);
    expect(json.revision).toBe(5);
    expect(json.updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
