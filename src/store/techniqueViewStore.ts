import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

export type TechniqueViewState = {
  lastViewedVersion: Record<string, string>;
  setLastViewedVersion: (techniqueId: string, versionId: string) => void;
  clearLastViewedVersion: (techniqueId: string) => void;
};

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useTechniqueViewStore = create<TechniqueViewState>()(
  persist(
    (set) => ({
      lastViewedVersion: {},
      setLastViewedVersion: (techniqueId, versionId) =>
        set((state) => ({
          lastViewedVersion: {
            ...state.lastViewedVersion,
            [techniqueId]: versionId,
          },
        })),
      clearLastViewedVersion: (techniqueId) =>
        set((state) => {
          if (!state.lastViewedVersion[techniqueId]) {
            return state;
          }
          const next = { ...state.lastViewedVersion };
          delete next[techniqueId];
          return { lastViewedVersion: next };
        }),
    }),
    {
      name: 'enso-technique-view',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : window.localStorage)),
      partialize: (state) => ({ lastViewedVersion: state.lastViewedVersion }),
    },
  ),
);
