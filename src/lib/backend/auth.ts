import { createSupabaseBrowserClient } from '../supabase/client';
import type { AuthSession } from '../supabase/types';

export interface AuthService {
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(listener: (session: AuthSession | null) => void): () => void;
  requestEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(email: string, token: string): Promise<AuthSession>;
  signOut(): Promise<void>;
}

const mapSession = (
  session: {
    access_token?: string;
    expires_at?: number;
    user?: { id?: string; email?: string | null };
  } | null,
): AuthSession | null => {
  if (!session?.access_token || !session.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email ?? undefined,
    accessToken: session.access_token,
    expiresAt: session.expires_at,
  };
};

export const authService: AuthService = {
  async getSession() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message);
    }

    return mapSession(data.session);
  },
  onAuthStateChange(listener) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      return () => {
        // No-op when Supabase is not configured.
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      listener(mapSession(session));
    });

    return () => {
      subscription.unsubscribe();
    };
  },
  async requestEmailOtp(email: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) {
      throw new Error(error.message);
    }
  },
  async verifyEmailOtp(email: string, token: string) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
      );
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) {
      throw new Error(error.message);
    }

    const session = mapSession(data.session);
    if (!session) {
      throw new Error('Verification succeeded but no session was returned.');
    }

    return session;
  },
  async signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },
};
