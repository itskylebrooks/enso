import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseEnv } from './types';

export const getSupabaseServerEnv = (): SupabaseEnv => {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    secretKey: process.env.SUPABASE_SECRET_KEY ?? '',
  };
};

export const createSupabaseServerClient = async (): Promise<SupabaseClient | null> => {
  const env = getSupabaseServerEnv();
  if (!env.url || !env.publishableKey) {
    return null;
  }

  return createClient(env.url, env.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const createSupabaseServiceRoleClient = async (): Promise<SupabaseClient | null> => {
  const env = getSupabaseServerEnv();
  if (!env.url || !env.secretKey) {
    return null;
  }

  return createClient(env.url, env.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
