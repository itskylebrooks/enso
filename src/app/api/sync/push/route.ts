import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { mergeSyncPayload } from '../../../../lib/backend/syncMerge';
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from '../../../../lib/supabase/server';
import type { SyncPayloadData } from '../../../../lib/supabase/types';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 1_000_000;

const SyncPayloadSchema = z
  .object({
    version: z.literal(1),
    db: z.object({
      progress: z.array(z.unknown()),
      glossaryProgress: z.array(z.unknown()),
      exerciseProgress: z.array(z.unknown()),
      studyStatus: z.record(z.unknown()),
      collections: z.array(z.unknown()),
      bookmarkCollections: z.array(z.unknown()),
      glossaryBookmarkCollections: z.array(z.unknown()),
      exerciseBookmarkCollections: z.array(z.unknown()),
    }),
    settings: z.object({
      themePreference: z.union([z.literal('light'), z.literal('dark'), z.null()]),
      locale: z.union([z.literal('en'), z.literal('de')]),
      filters: z.record(z.unknown()),
      filterPanelPinned: z.boolean(),
    }),
    homepage: z.object({
      pinnedBeltGrade: z
        .union([
          z.literal('kyu5'),
          z.literal('kyu4'),
          z.literal('kyu3'),
          z.literal('kyu2'),
          z.literal('kyu1'),
          z.literal('dan1'),
          z.literal('dan2'),
          z.literal('dan3'),
          z.literal('dan4'),
          z.literal('dan5'),
          z.null(),
        ])
        .nullable(),
      beltPromptDismissed: z.boolean(),
      onboardingDismissed: z.boolean(),
      onboardingCompleted: z.boolean(),
      onboardingStep: z.number().int().nonnegative().nullable(),
    }),
    timestamps: z.object({
      db: z.number().nonnegative(),
      settings: z.number().nonnegative(),
      homepage: z.number().nonnegative(),
    }),
  })
  .strict();

const PushRequestSchema = z
  .object({
    payload: SyncPayloadSchema,
  })
  .strict();

type SyncStateRow = {
  user_id: string;
  payload: SyncPayloadData;
  updated_at: string;
};

const getBearerToken = (request: Request): string | null => {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
};

const getAuthedUserId = async (accessToken: string): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.id) {
    return null;
  }

  return data.user.id;
};

export async function POST(request: Request) {
  const requestId = crypto.randomUUID?.() ?? `req-${Date.now()}`;
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return NextResponse.json({ message: 'Missing bearer token', requestId }, { status: 401 });
  }

  const userId = await getAuthedUserId(accessToken);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized', requestId }, { status: 401 });
  }

  let parsedBody: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ message: 'Payload too large', requestId }, { status: 413 });
    }
    parsedBody = JSON.parse(raw);
  } catch {
    return NextResponse.json({ message: 'Invalid JSON payload', requestId }, { status: 400 });
  }

  const validation = PushRequestSchema.safeParse(parsedBody);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: 'Invalid sync payload',
        requestId,
        issues: validation.error.issues,
      },
      { status: 400 },
    );
  }

  const serviceClient = await createSupabaseServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json(
      {
        message: 'Supabase server configuration is incomplete',
        requestId,
      },
      { status: 500 },
    );
  }

  const incomingPayload = validation.data.payload as SyncPayloadData;

  const { data: existing, error: readError } = await serviceClient
    .from('user_sync_state')
    .select('user_id,payload,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (readError) {
    return NextResponse.json(
      {
        message: readError.message || 'Failed to load current sync state',
        requestId,
      },
      { status: 502 },
    );
  }

  const existingRow = (existing as SyncStateRow | null) ?? null;

  const mergedPayload = existingRow?.payload
    ? mergeSyncPayload(incomingPayload, existingRow.payload)
    : incomingPayload;

  const { data: upserted, error: writeError } = await serviceClient
    .from('user_sync_state')
    .upsert(
      {
        user_id: userId,
        payload: mergedPayload,
      },
      { onConflict: 'user_id' },
    )
    .select('user_id,payload,updated_at')
    .single();

  if (writeError) {
    return NextResponse.json(
      {
        message: writeError.message || 'Failed to save sync state',
        requestId,
      },
      { status: 502 },
    );
  }

  const upsertedRow = upserted as SyncStateRow;

  return NextResponse.json({
    payload: upsertedRow.payload,
    updatedAt: upsertedRow.updated_at,
  });
}
