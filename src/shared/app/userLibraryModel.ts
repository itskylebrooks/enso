import { ENTRY_MODE_ORDER } from '@shared/constants/entryModes';
import { contentRegistry, type ContentKind } from '@shared/content/registry';
import type {
  Collection,
  DB,
  Direction,
  ExerciseProgress,
  GlossaryProgress,
  Locale,
  Progress,
  Technique,
  TechniqueVariantKey,
  WeaponKind,
} from '@shared/types';
import { createCollectionItemId, swapCollectionItemIds } from '@shared/utils/collectionItems';
import {
  buildStudyItemKey,
  buildTechniqueVariantStudyKey,
  cycleStudyStatus,
  getStudyStatusForItem,
  getStudyStatusForTechniqueVariant,
} from '@shared/utils/studyStatus';
import {
  fromVariantStorageKey,
  getBookmarkedVariantKeys,
  toVariantStorageKey,
} from '@shared/utils/variantKeys';

type CollectionItemPrefix = 'technique' | 'glossary' | 'exercise';
type IdFactory = () => string;
type ReorderDirection = 'backward' | 'forward';

const upsertBy = <T>(entries: T[], predicate: (entry: T) => boolean, nextEntry: T): T[] => {
  const index = entries.findIndex(predicate);
  if (index === -1) return [...entries, nextEntry];

  const next = [...entries];
  next[index] = nextEntry;
  return next;
};

export const sanitizeCollectionName = (name: string): string => name.trim().slice(0, 40);

export const sortCollectionsByName = (collections: Collection[], locale: Locale): Collection[] =>
  [...collections]
    .sort((a, b) =>
      a.name.localeCompare(b.name, locale, {
        sensitivity: 'accent',
        caseFirst: 'upper',
      }),
    )
    .map((collection, index) => ({
      ...collection,
      sortOrder: index,
    }));

export const getCollectionItemId = (kind: ContentKind, id: string): string => {
  const prefix = contentRegistry[kind].itemIdPrefix as CollectionItemPrefix;
  return createCollectionItemId(prefix, id);
};

const appendCollectionItem = (
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

const removeCollectionItem = (
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

const removeCollectionItemFromAll = (
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

export const getFallbackVariantForTechnique = (technique: Technique): TechniqueVariantKey => {
  const firstVersion = technique.versions[0];
  const availableDirections = ENTRY_MODE_ORDER.filter(
    (mode) =>
      firstVersion?.entries?.includes(mode) ||
      Boolean(firstVersion?.stepsByEntry?.[mode]) ||
      Boolean(firstVersion?.mediaByEntry?.[mode]),
  );

  return {
    hanmi: firstVersion?.hanmi ?? 'ai-hanmi',
    direction: (availableDirections[0] ?? 'irimi') as Direction,
    weapon:
      technique.weapon && technique.weapon !== 'empty-hand'
        ? (technique.weapon as WeaponKind)
        : 'empty',
    versionId: firstVersion?.id ?? null,
  };
};

export const buildTechniqueBookmarkPatch = (
  entry: Progress | null,
  bookmarkedVariant: TechniqueVariantKey,
): Partial<Progress> => {
  const currentKeys = getBookmarkedVariantKeys(entry);
  const activeKey = toVariantStorageKey(bookmarkedVariant);
  const hasLegacyGlobalBookmark = currentKeys.length === 0 && Boolean(entry?.bookmarked);
  const hasCurrent = hasLegacyGlobalBookmark || currentKeys.includes(activeKey);
  const nextKeys = hasCurrent
    ? currentKeys.filter((key) => key !== activeKey)
    : [...currentKeys, activeKey];
  const nextBookmarked = nextKeys.length > 0;
  const latestKey = nextKeys[nextKeys.length - 1];
  const latestVariant = latestKey ? fromVariantStorageKey(latestKey) : null;

  return {
    bookmarked: nextBookmarked,
    bookmarkedVariant: nextBookmarked ? (latestVariant ?? bookmarkedVariant) : undefined,
    bookmarkedVariantKeys: nextKeys,
  };
};

export const applyProgressUpdate = (
  db: DB,
  id: string,
  patch: Partial<Progress>,
  now: number,
): DB => {
  const normalizedPatch: Partial<Progress> =
    patch.bookmarked === false
      ? { ...patch, bookmarkedVariant: undefined, bookmarkedVariantKeys: [] }
      : patch;
  const existing = db.progress.find((entry) => entry.techniqueId === id);
  const baseline: Progress = existing ?? {
    techniqueId: id,
    bookmarked: false,
    updatedAt: now,
  };
  const nextEntry: Progress = {
    ...baseline,
    ...normalizedPatch,
    techniqueId: id,
    updatedAt: now,
  };
  const shouldRemoveAssignments = normalizedPatch.bookmarked === false;
  const itemId = getCollectionItemId('technique', id);

  return {
    ...db,
    progress: upsertBy(db.progress, (entry) => entry.techniqueId === id, nextEntry),
    collections: shouldRemoveAssignments
      ? removeCollectionItemFromAll(db.collections, itemId, now)
      : db.collections,
    bookmarkCollections: shouldRemoveAssignments
      ? db.bookmarkCollections.filter((entry) => entry.techniqueId !== id)
      : db.bookmarkCollections,
  };
};

export const applyGlossaryProgressUpdate = (
  db: DB,
  termId: string,
  patch: Partial<GlossaryProgress>,
  now: number,
): DB => {
  const existing = db.glossaryProgress.find((entry) => entry.termId === termId);
  const baseline: GlossaryProgress = existing ?? {
    termId,
    bookmarked: false,
    updatedAt: now,
  };
  const nextEntry: GlossaryProgress = {
    ...baseline,
    ...patch,
    termId,
    updatedAt: now,
  };
  const shouldRemoveAssignments = patch.bookmarked === false;
  const itemId = getCollectionItemId('term', termId);

  return {
    ...db,
    glossaryProgress: upsertBy(db.glossaryProgress, (entry) => entry.termId === termId, nextEntry),
    collections: shouldRemoveAssignments
      ? removeCollectionItemFromAll(db.collections, itemId, now)
      : db.collections,
    glossaryBookmarkCollections: shouldRemoveAssignments
      ? db.glossaryBookmarkCollections.filter((entry) => entry.termId !== termId)
      : db.glossaryBookmarkCollections,
  };
};

export const applyExerciseProgressUpdate = (
  db: DB,
  exerciseId: string,
  patch: Partial<ExerciseProgress>,
  now: number,
): DB => {
  const existing = db.exerciseProgress.find((entry) => entry.exerciseId === exerciseId);
  const baseline: ExerciseProgress = existing ?? {
    exerciseId,
    bookmarked: false,
    updatedAt: now,
  };
  const nextEntry: ExerciseProgress = {
    ...baseline,
    ...patch,
    exerciseId,
    updatedAt: now,
  };
  const shouldRemoveAssignments = patch.bookmarked === false;
  const itemId = getCollectionItemId('exercise', exerciseId);

  return {
    ...db,
    exerciseProgress: upsertBy(
      db.exerciseProgress,
      (entry) => entry.exerciseId === exerciseId,
      nextEntry,
    ),
    collections: shouldRemoveAssignments
      ? removeCollectionItemFromAll(db.collections, itemId, now)
      : db.collections,
    exerciseBookmarkCollections: shouldRemoveAssignments
      ? db.exerciseBookmarkCollections.filter((entry) => entry.exerciseId !== exerciseId)
      : db.exerciseBookmarkCollections,
  };
};

export const cycleStudyStatusForItem = (
  db: DB,
  itemType: 'technique' | 'term' | 'exercise',
  slug: string,
  now: number,
  variant?: TechniqueVariantKey,
): DB => {
  const current =
    itemType === 'technique' && variant
      ? getStudyStatusForTechniqueVariant(db.studyStatus, slug, variant)
      : getStudyStatusForItem(db.studyStatus, itemType, slug);
  const nextStatus = cycleStudyStatus(current);
  const key =
    itemType === 'technique' && variant
      ? buildTechniqueVariantStudyKey(slug, variant)
      : buildStudyItemKey(itemType, slug);

  return {
    ...db,
    studyStatus: {
      ...db.studyStatus,
      [key]: {
        status: nextStatus,
        updatedAt: now,
      },
    },
  };
};

export const addCollection = (
  db: DB,
  name: string,
  locale: Locale,
  now: number,
  id: string,
): DB => ({
  ...db,
  collections: sortCollectionsByName(
    [
      ...db.collections,
      {
        id,
        name: sanitizeCollectionName(name),
        icon: null,
        itemIds: [],
        sortOrder: db.collections.length,
        createdAt: now,
        updatedAt: now,
      },
    ],
    locale,
  ),
});

export const renameCollectionById = (
  db: DB,
  id: string,
  name: string,
  locale: Locale,
  now: number,
): DB => ({
  ...db,
  collections: sortCollectionsByName(
    db.collections.map((collection) =>
      collection.id === id
        ? {
            ...collection,
            name: sanitizeCollectionName(name),
            updatedAt: now,
          }
        : collection,
    ),
    locale,
  ),
});

export const deleteCollectionById = (db: DB, id: string, locale: Locale): DB => ({
  ...db,
  collections: sortCollectionsByName(
    db.collections.filter((collection) => collection.id !== id),
    locale,
  ),
  bookmarkCollections: db.bookmarkCollections.filter((entry) => entry.collectionId !== id),
  glossaryBookmarkCollections: db.glossaryBookmarkCollections.filter(
    (entry) => entry.collectionId !== id,
  ),
  exerciseBookmarkCollections: db.exerciseBookmarkCollections.filter(
    (entry) => entry.collectionId !== id,
  ),
});

export const assignTechniqueToCollection = (
  db: DB,
  techniqueId: string,
  collectionId: string,
  now: number,
  createId: IdFactory,
): DB => {
  const itemId = getCollectionItemId('technique', techniqueId);
  const progressEntry = db.progress.find((entry) => entry.techniqueId === techniqueId);
  const isBookmarked = progressEntry?.bookmarked;
  const technique = db.techniques.find((entry) => entry.id === techniqueId);
  const fallbackVariant =
    progressEntry?.bookmarkedVariant ??
    (technique ? getFallbackVariantForTechnique(technique) : null);
  const fallbackKey = fallbackVariant ? toVariantStorageKey(fallbackVariant) : null;

  let nextProgress = db.progress;
  if (!isBookmarked) {
    if (progressEntry) {
      nextProgress = db.progress.map((p) =>
        p.techniqueId === techniqueId
          ? {
              ...p,
              bookmarked: true,
              bookmarkedVariant: fallbackVariant ?? p.bookmarkedVariant,
              bookmarkedVariantKeys:
                fallbackKey && getBookmarkedVariantKeys(progressEntry).length === 0
                  ? [fallbackKey]
                  : p.bookmarkedVariantKeys,
              updatedAt: now,
            }
          : p,
      );
    } else {
      nextProgress = [
        ...db.progress,
        {
          techniqueId,
          bookmarked: true,
          bookmarkedVariant: fallbackVariant ?? undefined,
          bookmarkedVariantKeys: fallbackKey ? [fallbackKey] : [],
          updatedAt: now,
        },
      ];
    }
  }

  if (
    db.bookmarkCollections.some(
      (entry) => entry.techniqueId === techniqueId && entry.collectionId === collectionId,
    )
  ) {
    return {
      ...db,
      progress: nextProgress,
      collections: appendCollectionItem(db.collections, collectionId, itemId, now),
    };
  }

  return {
    ...db,
    progress: nextProgress,
    collections: appendCollectionItem(db.collections, collectionId, itemId, now),
    bookmarkCollections: [
      ...db.bookmarkCollections,
      {
        id: createId(),
        techniqueId,
        collectionId,
        createdAt: now,
      },
    ],
  };
};

export const removeTechniqueFromCollection = (
  db: DB,
  techniqueId: string,
  collectionId: string,
  now: number,
): DB => ({
  ...db,
  collections: removeCollectionItem(
    db.collections,
    collectionId,
    getCollectionItemId('technique', techniqueId),
    now,
  ),
  bookmarkCollections: db.bookmarkCollections.filter(
    (entry) => !(entry.techniqueId === techniqueId && entry.collectionId === collectionId),
  ),
});

export const assignTermToCollection = (
  db: DB,
  termId: string,
  collectionId: string,
  now: number,
  createId: IdFactory,
): DB => {
  const itemId = getCollectionItemId('term', termId);
  const progressEntry = db.glossaryProgress.find((entry) => entry.termId === termId);
  const isBookmarked = progressEntry?.bookmarked;

  let nextGlossaryProgress = db.glossaryProgress;
  if (!isBookmarked) {
    if (progressEntry) {
      nextGlossaryProgress = db.glossaryProgress.map((p) =>
        p.termId === termId ? { ...p, bookmarked: true, updatedAt: now } : p,
      );
    } else {
      nextGlossaryProgress = [...db.glossaryProgress, { termId, bookmarked: true, updatedAt: now }];
    }
  }

  if (
    db.glossaryBookmarkCollections.some(
      (entry) => entry.termId === termId && entry.collectionId === collectionId,
    )
  ) {
    return {
      ...db,
      glossaryProgress: nextGlossaryProgress,
      collections: appendCollectionItem(db.collections, collectionId, itemId, now),
    };
  }

  return {
    ...db,
    glossaryProgress: nextGlossaryProgress,
    collections: appendCollectionItem(db.collections, collectionId, itemId, now),
    glossaryBookmarkCollections: [
      ...db.glossaryBookmarkCollections,
      {
        id: createId(),
        termId,
        collectionId,
        createdAt: now,
      },
    ],
  };
};

export const removeTermFromCollection = (
  db: DB,
  termId: string,
  collectionId: string,
  now: number,
): DB => ({
  ...db,
  collections: removeCollectionItem(
    db.collections,
    collectionId,
    getCollectionItemId('term', termId),
    now,
  ),
  glossaryBookmarkCollections: db.glossaryBookmarkCollections.filter(
    (entry) => !(entry.termId === termId && entry.collectionId === collectionId),
  ),
});

export const assignExerciseToCollection = (
  db: DB,
  exerciseId: string,
  collectionId: string,
  now: number,
  createId: IdFactory,
): DB => {
  const itemId = getCollectionItemId('exercise', exerciseId);
  const progressEntry = db.exerciseProgress.find((entry) => entry.exerciseId === exerciseId);
  const isBookmarked = progressEntry?.bookmarked;

  let nextExerciseProgress = db.exerciseProgress;
  if (!isBookmarked) {
    if (progressEntry) {
      nextExerciseProgress = db.exerciseProgress.map((p) =>
        p.exerciseId === exerciseId ? { ...p, bookmarked: true, updatedAt: now } : p,
      );
    } else {
      nextExerciseProgress = [
        ...db.exerciseProgress,
        { exerciseId, bookmarked: true, updatedAt: now },
      ];
    }
  }

  if (
    db.exerciseBookmarkCollections.some(
      (entry) => entry.exerciseId === exerciseId && entry.collectionId === collectionId,
    )
  ) {
    return {
      ...db,
      exerciseProgress: nextExerciseProgress,
      collections: appendCollectionItem(db.collections, collectionId, itemId, now),
    };
  }

  return {
    ...db,
    exerciseProgress: nextExerciseProgress,
    collections: appendCollectionItem(db.collections, collectionId, itemId, now),
    exerciseBookmarkCollections: [
      ...db.exerciseBookmarkCollections,
      {
        id: createId(),
        exerciseId,
        collectionId,
        createdAt: now,
      },
    ],
  };
};

export const removeExerciseFromCollection = (
  db: DB,
  exerciseId: string,
  collectionId: string,
  now: number,
): DB => ({
  ...db,
  collections: removeCollectionItem(
    db.collections,
    collectionId,
    getCollectionItemId('exercise', exerciseId),
    now,
  ),
  exerciseBookmarkCollections: db.exerciseBookmarkCollections.filter(
    (entry) => !(entry.exerciseId === exerciseId && entry.collectionId === collectionId),
  ),
});

export const reorderCollectionItemById = (
  db: DB,
  collectionId: string,
  itemId: string,
  direction: ReorderDirection,
  now: number,
): DB => {
  const collection = db.collections.find((entry) => entry.id === collectionId);
  if (!collection) return db;

  const baseItemIds = collection.itemIds.includes(itemId)
    ? collection.itemIds
    : [...collection.itemIds, itemId];
  const index = baseItemIds.indexOf(itemId);
  const nextItemIds = swapCollectionItemIds(baseItemIds, index, direction);
  if (nextItemIds === collection.itemIds) return db;

  return {
    ...db,
    collections: db.collections.map((entry) =>
      entry.id === collectionId ? { ...entry, itemIds: nextItemIds, updatedAt: now } : entry,
    ),
  };
};
