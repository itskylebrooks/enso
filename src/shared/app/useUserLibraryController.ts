import {
  getBookmarkCollectionTombstoneKey,
  getCollectionTombstoneKey,
  getExerciseBookmarkCollectionTombstoneKey,
  getGlossaryBookmarkCollectionTombstoneKey,
} from '../../lib/backend/syncMerge';
import type { SyncTombstones } from '../../lib/supabase/types';
import type {
  DB,
  ExerciseProgress,
  GlossaryProgress,
  Locale,
  Progress,
  Technique,
  TechniqueVariantKey,
} from '@shared/types';
import { getBookmarkedVariantKeys, toVariantStorageKey } from '@shared/utils/variantKeys';
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { generateId } from './appModel';
import {
  addCollection,
  applyExerciseProgressUpdate,
  applyGlossaryProgressUpdate,
  applyProgressUpdate,
  assignExerciseToCollection as assignExerciseToCollectionInDB,
  assignTechniqueToCollection,
  assignTermToCollection,
  buildTechniqueBookmarkPatch,
  cycleStudyStatusForItem,
  deleteCollectionById,
  getFallbackVariantForTechnique,
  removeExerciseFromCollection as removeExerciseFromCollectionInDB,
  removeTechniqueFromCollection,
  removeTermFromCollection,
  renameCollectionById,
  reorderCollectionItemById,
} from './userLibraryModel';

type UserLibraryControllerParams = {
  db: DB;
  setDB: Dispatch<SetStateAction<DB>>;
  locale: Locale;
  markSyncMutationPending: () => void;
  addSyncTombstones: (tombstones: SyncTombstones) => void;
};

type StudyItemType = 'technique' | 'term' | 'exercise';

const getTechniqueAssignmentTombstones = (
  db: DB,
  techniqueId: string,
  deletedAt: number,
): SyncTombstones =>
  Object.fromEntries(
    db.bookmarkCollections
      .filter((entry) => entry.techniqueId === techniqueId)
      .map((entry) => [
        getBookmarkCollectionTombstoneKey(entry.collectionId, entry.techniqueId),
        deletedAt,
      ]),
  );

const getGlossaryAssignmentTombstones = (
  db: DB,
  termId: string,
  deletedAt: number,
): SyncTombstones =>
  Object.fromEntries(
    db.glossaryBookmarkCollections
      .filter((entry) => entry.termId === termId)
      .map((entry) => [
        getGlossaryBookmarkCollectionTombstoneKey(entry.collectionId, entry.termId),
        deletedAt,
      ]),
  );

const getExerciseAssignmentTombstones = (
  db: DB,
  exerciseId: string,
  deletedAt: number,
): SyncTombstones =>
  Object.fromEntries(
    db.exerciseBookmarkCollections
      .filter((entry) => entry.exerciseId === exerciseId)
      .map((entry) => [
        getExerciseBookmarkCollectionTombstoneKey(entry.collectionId, entry.exerciseId),
        deletedAt,
      ]),
  );

const getCollectionDeleteTombstones = (
  db: DB,
  collectionId: string,
  deletedAt: number,
): SyncTombstones => ({
  [getCollectionTombstoneKey(collectionId)]: deletedAt,
  ...Object.fromEntries(
    db.bookmarkCollections
      .filter((entry) => entry.collectionId === collectionId)
      .map((entry) => [
        getBookmarkCollectionTombstoneKey(entry.collectionId, entry.techniqueId),
        deletedAt,
      ]),
  ),
  ...Object.fromEntries(
    db.glossaryBookmarkCollections
      .filter((entry) => entry.collectionId === collectionId)
      .map((entry) => [
        getGlossaryBookmarkCollectionTombstoneKey(entry.collectionId, entry.termId),
        deletedAt,
      ]),
  ),
  ...Object.fromEntries(
    db.exerciseBookmarkCollections
      .filter((entry) => entry.collectionId === collectionId)
      .map((entry) => [
        getExerciseBookmarkCollectionTombstoneKey(entry.collectionId, entry.exerciseId),
        deletedAt,
      ]),
  ),
});

export const useUserLibraryController = ({
  db,
  setDB,
  locale,
  markSyncMutationPending,
  addSyncTombstones,
}: UserLibraryControllerParams) => {
  const updateProgress = useCallback(
    (id: string, patch: Partial<Progress>): void => {
      markSyncMutationPending();
      const deletedAt = Date.now();
      if (patch.bookmarked === false) {
        addSyncTombstones(getTechniqueAssignmentTombstones(db, id, deletedAt));
      }

      setDB((prev) => applyProgressUpdate(prev, id, patch, Date.now()));
    },
    [addSyncTombstones, db, markSyncMutationPending, setDB],
  );

  const updateGlossaryProgress = useCallback(
    (termId: string, patch: Partial<GlossaryProgress>): void => {
      markSyncMutationPending();
      const deletedAt = Date.now();
      if (patch.bookmarked === false) {
        addSyncTombstones(getGlossaryAssignmentTombstones(db, termId, deletedAt));
      }

      setDB((prev) => applyGlossaryProgressUpdate(prev, termId, patch, Date.now()));
    },
    [addSyncTombstones, db, markSyncMutationPending, setDB],
  );

  const updateExerciseProgress = useCallback(
    (exerciseId: string, patch: Partial<ExerciseProgress>): void => {
      markSyncMutationPending();
      const deletedAt = Date.now();
      if (patch.bookmarked === false) {
        addSyncTombstones(getExerciseAssignmentTombstones(db, exerciseId, deletedAt));
      }

      setDB((prev) => applyExerciseProgressUpdate(prev, exerciseId, patch, Date.now()));
    },
    [addSyncTombstones, db, markSyncMutationPending, setDB],
  );

  const cycleItemStudyStatus = useCallback(
    (itemType: StudyItemType, slug: string, variant?: TechniqueVariantKey): void => {
      markSyncMutationPending();
      setDB((prev) => cycleStudyStatusForItem(prev, itemType, slug, Date.now(), variant));
    },
    [markSyncMutationPending, setDB],
  );

  const createCollection = useCallback(
    (name: string): string | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      markSyncMutationPending();
      const now = Date.now();
      const id = generateId();

      setDB((prev) => addCollection(prev, trimmed, locale, now, id));

      return id;
    },
    [locale, markSyncMutationPending, setDB],
  );

  const renameCollection = useCallback(
    (id: string, name: string): void => {
      const trimmed = name.trim();
      if (!trimmed) return;
      markSyncMutationPending();

      setDB((prev) => renameCollectionById(prev, id, trimmed, locale, Date.now()));
    },
    [locale, markSyncMutationPending, setDB],
  );

  const deleteCollection = useCallback(
    (id: string): void => {
      markSyncMutationPending();
      const deletedAt = Date.now();
      addSyncTombstones(getCollectionDeleteTombstones(db, id, deletedAt));

      setDB((prev) => deleteCollectionById(prev, id, locale));
    },
    [addSyncTombstones, db, locale, markSyncMutationPending, setDB],
  );

  const assignToCollection = useCallback(
    (techniqueId: string, collectionId: string): void => {
      markSyncMutationPending();
      setDB((prev) =>
        assignTechniqueToCollection(prev, techniqueId, collectionId, Date.now(), generateId),
      );
    },
    [markSyncMutationPending, setDB],
  );

  const removeFromCollection = useCallback(
    (techniqueId: string, collectionId: string): void => {
      markSyncMutationPending();
      addSyncTombstones({
        [getBookmarkCollectionTombstoneKey(collectionId, techniqueId)]: Date.now(),
      });

      setDB((prev) => removeTechniqueFromCollection(prev, techniqueId, collectionId, Date.now()));
    },
    [addSyncTombstones, markSyncMutationPending, setDB],
  );

  const assignGlossaryToCollection = useCallback(
    (termId: string, collectionId: string): void => {
      markSyncMutationPending();
      setDB((prev) => assignTermToCollection(prev, termId, collectionId, Date.now(), generateId));
    },
    [markSyncMutationPending, setDB],
  );

  const removeGlossaryFromCollection = useCallback(
    (termId: string, collectionId: string): void => {
      markSyncMutationPending();
      addSyncTombstones({
        [getGlossaryBookmarkCollectionTombstoneKey(collectionId, termId)]: Date.now(),
      });

      setDB((prev) => removeTermFromCollection(prev, termId, collectionId, Date.now()));
    },
    [addSyncTombstones, markSyncMutationPending, setDB],
  );

  const assignExerciseToCollection = useCallback(
    (exerciseId: string, collectionId: string): void => {
      markSyncMutationPending();
      setDB((prev) =>
        assignExerciseToCollectionInDB(prev, exerciseId, collectionId, Date.now(), generateId),
      );
    },
    [markSyncMutationPending, setDB],
  );

  const removeExerciseFromCollection = useCallback(
    (exerciseId: string, collectionId: string): void => {
      markSyncMutationPending();
      addSyncTombstones({
        [getExerciseBookmarkCollectionTombstoneKey(collectionId, exerciseId)]: Date.now(),
      });

      setDB((prev) => removeExerciseFromCollectionInDB(prev, exerciseId, collectionId, Date.now()));
    },
    [addSyncTombstones, markSyncMutationPending, setDB],
  );

  const reorderCollectionItem = useCallback(
    (collectionId: string, itemId: string, direction: 'backward' | 'forward'): void => {
      markSyncMutationPending();
      setDB((prev) => reorderCollectionItemById(prev, collectionId, itemId, direction, Date.now()));
    },
    [markSyncMutationPending, setDB],
  );

  const toggleBookmark = useCallback(
    (
      technique: Technique,
      entry: Progress | null,
      bookmarkedVariant: TechniqueVariantKey,
    ): void => {
      updateProgress(technique.id, buildTechniqueBookmarkPatch(entry, bookmarkedVariant));
    },
    [updateProgress],
  );

  const toggleExerciseBookmark = useCallback(
    (exerciseId: string, nextBookmarked: boolean): void => {
      updateExerciseProgress(exerciseId, {
        bookmarked: nextBookmarked,
      });
    },
    [updateExerciseProgress],
  );

  const handleDBChange = useCallback(
    (next: DB): void => {
      markSyncMutationPending();
      setDB(next);
    },
    [markSyncMutationPending, setDB],
  );

  const toggleSearchTechniqueBookmark = useCallback(
    (techniqueId: string): void => {
      const progressEntry = db.progress.find((p) => p.techniqueId === techniqueId) ?? null;
      const techniqueEntry = db.techniques.find((t) => t.id === techniqueId);
      if (!techniqueEntry) return;

      const currentKeys = getBookmarkedVariantKeys(progressEntry);
      if (currentKeys.length > 0) {
        updateProgress(techniqueId, { bookmarked: false });
        return;
      }

      const fallbackVariant =
        progressEntry?.bookmarkedVariant ?? getFallbackVariantForTechnique(techniqueEntry);
      updateProgress(techniqueId, {
        bookmarked: true,
        bookmarkedVariant: fallbackVariant,
        bookmarkedVariantKeys: [toVariantStorageKey(fallbackVariant)],
      });
    },
    [db.progress, db.techniques, updateProgress],
  );

  return {
    updateProgress,
    updateGlossaryProgress,
    updateExerciseProgress,
    cycleItemStudyStatus,
    createCollection,
    renameCollection,
    deleteCollection,
    assignToCollection,
    removeFromCollection,
    assignGlossaryToCollection,
    removeGlossaryFromCollection,
    assignExerciseToCollection,
    removeExerciseFromCollection,
    reorderCollectionItem,
    toggleBookmark,
    toggleExerciseBookmark,
    handleDBChange,
    getFallbackVariantForTechnique,
    toggleSearchTechniqueBookmark,
  };
};
