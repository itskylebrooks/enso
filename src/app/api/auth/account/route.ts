import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from '../../../../lib/supabase/server';

export const runtime = 'nodejs';

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

export async function DELETE(request: Request) {
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

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json(
      {
        message: error.message || 'Failed to delete account',
        requestId,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
