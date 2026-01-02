import { create } from 'zustand';
import type { GlossaryTerm } from '../../shared/types';

type GlossaryState = {
  terms: GlossaryTerm[];
  loading: boolean;
  error: string | null;
  setTerms: (terms: GlossaryTerm[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initialState = {
  terms: [],
  loading: false,
  error: null,
};

export const useGlossaryStore = create<GlossaryState>((set) => ({
  ...initialState,
  setTerms: (terms) => set({ terms, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set(initialState),
}));
