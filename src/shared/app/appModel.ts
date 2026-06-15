import { ENTRY_MODE_ORDER, isEntryMode } from '@shared/constants/entryModes';
import type {
  Collection,
  EntryMode,
  Filters,
  GlossaryBookmarkCollection,
  Technique,
  Theme,
} from '@shared/types';
import { unique } from '@shared/utils/array';

type CollectionOption = {
  id: string;
  name: string;
  icon: string | null;
  checked: boolean;
};

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

export const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getGlossaryCollectionOptions = (
  collections: Collection[],
  glossaryBookmarkCollections: GlossaryBookmarkCollection[],
  termId: string,
): CollectionOption[] => {
  const termCollectionIds = new Set(
    glossaryBookmarkCollections
      .filter((entry) => entry.termId === termId)
      .map((entry) => entry.collectionId),
  );

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    icon: collection.icon ?? null,
    checked: termCollectionIds.has(collection.id),
  }));
};

export const getSelectableValues = (
  techniques: Technique[],
  selector: (technique: Technique) => string | undefined,
): string[] =>
  unique(
    techniques
      .map(selector)
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .sort(),
  );

export const getTrainerValues = (techniques: Technique[]): string[] => {
  const trainerIds = techniques
    .flatMap((technique) => technique.versions.map((version) => version.trainerId))
    .filter((value): value is string => Boolean(value && value.trim().length > 0));

  const hasBaseVersions = techniques.some((technique) =>
    technique.versions.some((version) => !version.trainerId),
  );

  const values = unique(trainerIds).sort();
  return hasBaseVersions ? ['base-forms', ...values] : values;
};

export const applyFilters = (techniques: Technique[], filters: Filters): Technique[] =>
  techniques
    .filter((technique) => {
      if (filters.category && technique.category !== filters.category) return false;
      if (filters.attack && technique.attack !== filters.attack) return false;
      if (filters.weapon && technique.weapon !== filters.weapon) return false;
      if (filters.level && technique.level !== filters.level) return false;
      if (filters.stance) {
        if (!isEntryMode(filters.stance)) {
          return false;
        }

        const requiredEntry: EntryMode = filters.stance;
        const hasEntryMode = technique.versions.some(
          (version) =>
            version.entries?.includes(requiredEntry) ||
            Boolean(version.stepsByEntry?.[requiredEntry]) ||
            Boolean(version.mediaByEntry?.[requiredEntry]),
        );
        if (!hasEntryMode) return false;
      }
      if (filters.trainer) {
        if (filters.trainer === 'base-forms') {
          if (!technique.versions.some((version) => !version.trainerId)) return false;
        } else if (!technique.versions.some((version) => version.trainerId === filters.trainer)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const aName = a.name.en || a.name.de || '';
      const bName = b.name.en || b.name.de || '';
      return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
    });

export const stances = ENTRY_MODE_ORDER;
