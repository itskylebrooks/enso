import type { SupabaseEnv } from './types';

export const getSupabaseServerEnv = (): SupabaseEnv => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  };
};

export const createSupabaseServerClient = async () => {
  // TODO: wire server-side Supabase client when Route Handlers for auth/sync are implemented.
  return null;
};
