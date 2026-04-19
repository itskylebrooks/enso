import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from '../../../../lib/supabase/server';
import type { SyncPayloadData } from '../../../../lib/supabase/types';

export const runtime = 'nodejs';

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

  const { data, error } = await serviceClient
    .from('user_sync_state')
    .select('user_id,payload,updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        message: error.message || 'Failed to load sync state',
        requestId,
      },
      { status: 502 },
    );
  }

  const row = (data as SyncStateRow | null) ?? null;

  return NextResponse.json({
    payload: row?.payload ?? null,
    updatedAt: row?.updated_at ?? null,
  });
}
