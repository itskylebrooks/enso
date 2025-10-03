import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Direction, WeaponKind, Technique, TechniqueVariant } from '../../shared/types';

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

// Helper to get active variant from technique data
export const getActiveVariant = (
  technique: Technique,
  direction: Direction,
  weapon: WeaponKind,
  versionId?: string | null,
): TechniqueVariant | null => {
  if (!technique.variants || technique.variants.length === 0) {
    return null;
  }

  // Try exact match
  const exactMatch = technique.variants.find(
    (variant) =>
      variant.key.direction === direction &&
      variant.key.weapon === weapon &&
      variant.key.versionId === versionId,
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Try fallback to standard (null/undefined versionId) for this direction/weapon
  const standardMatch = technique.variants.find(
    (variant) =>
      variant.key.direction === direction &&
      variant.key.weapon === weapon &&
      (variant.key.versionId === null || variant.key.versionId === undefined),
  );

  return standardMatch || null;
};
