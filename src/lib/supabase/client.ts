import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseEnv } from './types';

export const getSupabaseClientEnv = (): SupabaseEnv => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  };
};

let browserClient: SupabaseClient | null = null;

export const createSupabaseBrowserClient = (): SupabaseClient | null => {
  const env = getSupabaseClientEnv();
  if (!env.url || !env.publishableKey) {
    return null;
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createClient(env.url, env.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
};
