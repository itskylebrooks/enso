import type { AuthSession } from '../supabase/types';

export interface AuthService {
  getSession(): Promise<AuthSession | null>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export const authService: AuthService = {
  async getSession() {
    // TODO: implement Supabase-backed session retrieval.
    return null;
  },
  async signInWithPassword(_email: string, _password: string) {
    void _email;
    void _password;
    // TODO: implement login flow.
  },
  async signOut() {
    // TODO: implement logout flow.
  },
};
