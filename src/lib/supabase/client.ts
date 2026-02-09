import type { SupabaseEnv } from './types';

export const getSupabaseClientEnv = (): SupabaseEnv => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  };
};

export const createSupabaseBrowserClient = () => {
  // TODO: wire @supabase/supabase-js browser client once auth/sync is implemented.
  return null;
};
