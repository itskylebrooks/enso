import { ENTRY_MODE_ORDER, isEntryMode } from '@shared/constants/entryModes';
import type {
  Collection,
  EntryMode,
  ExerciseProgress,
  Filters,
  GlossaryBookmarkCollection,
  GlossaryProgress,
  Progress,
  Technique,
  Theme,
} from '@shared/types';
import { unique, upsert } from '@shared/utils/array';

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

export const appendCollectionItem = (
  collections: Collection[],
  collectionId: string,
  itemId: string,
  updatedAt: number,
): Collection[] => {
  let changed = false;
  const nextCollections = collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    if (collection.itemIds.includes(itemId)) return collection;
    changed = true;
    return {
      ...collection,
      itemIds: [...collection.itemIds, itemId],
      updatedAt,
    };
  });

  return changed ? nextCollections : collections;
};

export const removeCollectionItem = (
  collections: Collection[],
  collectionId: string,
  itemId: string,
  updatedAt: number,
): Collection[] => {
  let changed = false;
  const nextCollections = collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    if (!collection.itemIds.includes(itemId)) return collection;
    changed = true;
    return {
      ...collection,
      itemIds: collection.itemIds.filter((id) => id !== itemId),
      updatedAt,
    };
  });

  return changed ? nextCollections : collections;
};

export const removeCollectionItemFromAll = (
  collections: Collection[],
  itemId: string,
  updatedAt: number,
): Collection[] => {
  let changed = false;
  const nextCollections = collections.map((collection) => {
    if (!collection.itemIds.includes(itemId)) return collection;
    changed = true;
    return {
      ...collection,
      itemIds: collection.itemIds.filter((id) => id !== itemId),
      updatedAt,
    };
  });

  return changed ? nextCollections : collections;
};

export const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const updateProgressEntry = (
  progress: Progress[],
  id: string,
  patch: Partial<Progress>,
): Progress[] => {
  const existing = progress.find((entry) => entry.techniqueId === id);
  const timestamp = Date.now();
  const baseline: Progress = existing ?? {
    techniqueId: id,
    bookmarked: false,
    updatedAt: timestamp,
  };

  const nextEntry: Progress = {
    ...baseline,
    ...patch,
    techniqueId: id,
    updatedAt: timestamp,
  };

  return upsert(progress, (entry) => entry.techniqueId === id, nextEntry);
};

export const updateGlossaryProgressEntry = (
  glossaryProgress: GlossaryProgress[],
  termId: string,
  patch: Partial<GlossaryProgress>,
): GlossaryProgress[] => {
  const existing = glossaryProgress.find((entry) => entry.termId === termId);
  const timestamp = Date.now();
  const baseline: GlossaryProgress = existing ?? {
    termId,
    bookmarked: false,
    updatedAt: timestamp,
  };

  const nextEntry: GlossaryProgress = {
    ...baseline,
    ...patch,
    termId,
    updatedAt: timestamp,
  };

  return upsert(glossaryProgress, (entry) => entry.termId === termId, nextEntry);
};

export const updateExerciseProgressEntry = (
  exerciseProgress: ExerciseProgress[],
  exerciseId: string,
  patch: Partial<ExerciseProgress>,
): ExerciseProgress[] => {
  const existing = exerciseProgress.find((entry) => entry.exerciseId === exerciseId);
  const timestamp = Date.now();
  const baseline: ExerciseProgress = existing ?? {
    exerciseId,
    bookmarked: false,
    updatedAt: timestamp,
  };

  const nextEntry: ExerciseProgress = {
    ...baseline,
    ...patch,
    exerciseId,
    updatedAt: timestamp,
  };

  return upsert(exerciseProgress, (entry) => entry.exerciseId === exerciseId, nextEntry);
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
