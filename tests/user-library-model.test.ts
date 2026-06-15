import { describe, expect, it } from 'vitest';
import {
  addCollection,
  applyExerciseProgressUpdate,
  applyGlossaryProgressUpdate,
  assignExerciseToCollection,
  assignTechniqueToCollection,
  assignTermToCollection,
  buildTechniqueBookmarkPatch,
  deleteCollectionById,
  getFallbackVariantForTechnique,
  renameCollectionById,
  reorderCollectionItemById,
} from '../src/shared/app/userLibraryModel';
import type { DB, Technique, TechniqueVariantKey } from '../src/shared/types';
import { toVariantStorageKey } from '../src/shared/utils/variantKeys';

const variantA: TechniqueVariantKey = {
  hanmi: 'gyaku-hanmi',
  direction: 'tenkan',
  weapon: 'bokken',
  versionId: 'base',
};

const variantB: TechniqueVariantKey = {
  hanmi: 'gyaku-hanmi',
  direction: 'irimi',
  weapon: 'bokken',
  versionId: 'base',
};

const technique: Technique = {
  id: 'technique-1',
  slug: 'katate-tori-irimi-nage',
  name: { en: 'Katate-tori Irimi-nage', de: 'Katate-tori Irimi-nage' },
  category: 'throws',
  attack: 'katate-tori',
  weapon: 'bokken',
  level: 'kyu4',
  summary: { en: 'Entering throw.', de: 'Eingangswurf.' },
  tags: [],
  versions: [
    {
      id: 'base',
      hanmi: 'gyaku-hanmi',
      entries: ['tenkan', 'irimi'],
      uke: {
        role: { en: 'Uke', de: 'Uke' },
        notes: { en: [], de: [] },
      },
    },
  ],
};

const baseDB = (): DB => ({
  version: 7,
  techniques: [technique],
  progress: [],
  glossaryProgress: [],
  exerciseProgress: [],
  studyStatus: {},
  collections: [
    {
      id: 'collection-1',
      name: 'Zeta',
      icon: null,
      itemIds: [],
      sortOrder: 0,
      createdAt: 1,
      updatedAt: 1,
    },
  ],
  bookmarkCollections: [],
  glossaryBookmarkCollections: [],
  exerciseBookmarkCollections: [],
});

describe('user library model', () => {
  it('builds technique bookmark patches for variant-specific bookmarks', () => {
    const firstPatch = buildTechniqueBookmarkPatch(null, variantA);

    expect(firstPatch).toMatchObject({
      bookmarked: true,
      bookmarkedVariant: variantA,
      bookmarkedVariantKeys: [toVariantStorageKey(variantA)],
    });

    const secondPatch = buildTechniqueBookmarkPatch(
      {
        techniqueId: technique.id,
        bookmarked: true,
        bookmarkedVariant: variantA,
        bookmarkedVariantKeys: [toVariantStorageKey(variantA)],
        updatedAt: 1,
      },
      variantB,
    );

    expect(secondPatch.bookmarked).toBe(true);
    expect(secondPatch.bookmarkedVariantKeys).toEqual([
      toVariantStorageKey(variantA),
      toVariantStorageKey(variantB),
    ]);

    const fallback = getFallbackVariantForTechnique(technique);
    expect(fallback).toEqual({
      hanmi: 'gyaku-hanmi',
      direction: 'irimi',
      weapon: 'bokken',
      versionId: 'base',
    });
  });

  it('removes term and exercise collection assignments when unbookmarked', () => {
    const db: DB = {
      ...baseDB(),
      collections: [
        {
          ...baseDB().collections[0],
          itemIds: ['glossary:ma-ai', 'exercise:dead-bug'],
        },
      ],
      glossaryProgress: [{ termId: 'ma-ai', bookmarked: true, updatedAt: 1 }],
      exerciseProgress: [{ exerciseId: 'dead-bug', bookmarked: true, updatedAt: 1 }],
      glossaryBookmarkCollections: [
        { id: 'gbc-1', termId: 'ma-ai', collectionId: 'collection-1', createdAt: 1 },
      ],
      exerciseBookmarkCollections: [
        { id: 'ebc-1', exerciseId: 'dead-bug', collectionId: 'collection-1', createdAt: 1 },
      ],
    };

    const withoutTerm = applyGlossaryProgressUpdate(db, 'ma-ai', { bookmarked: false }, 10);
    expect(withoutTerm.glossaryBookmarkCollections).toEqual([]);
    expect(withoutTerm.collections[0]?.itemIds).toEqual(['exercise:dead-bug']);

    const withoutExercise = applyExerciseProgressUpdate(
      withoutTerm,
      'dead-bug',
      { bookmarked: false },
      11,
    );
    expect(withoutExercise.exerciseBookmarkCollections).toEqual([]);
    expect(withoutExercise.collections[0]?.itemIds).toEqual([]);
  });

  it('creates, renames, and deletes collections with sorted order', () => {
    const created = addCollection(baseDB(), 'Alpha', 'en', 10, 'collection-2');
    expect(created.collections.map((collection) => collection.name)).toEqual(['Alpha', 'Zeta']);
    expect(created.collections.map((collection) => collection.sortOrder)).toEqual([0, 1]);

    const renamed = renameCollectionById(created, 'collection-2', 'Omega', 'en', 11);
    expect(renamed.collections.map((collection) => collection.name)).toEqual(['Omega', 'Zeta']);

    const deleted = deleteCollectionById(
      {
        ...renamed,
        bookmarkCollections: [
          {
            id: 'bc-1',
            techniqueId: technique.id,
            collectionId: 'collection-2',
            createdAt: 12,
          },
        ],
      },
      'collection-2',
      'en',
    );

    expect(deleted.collections.map((collection) => collection.id)).toEqual(['collection-1']);
    expect(deleted.bookmarkCollections).toEqual([]);
  });

  it('auto-bookmarks items when assigning them to a collection', () => {
    const withTechnique = assignTechniqueToCollection(
      baseDB(),
      technique.id,
      'collection-1',
      10,
      () => 'bc-1',
    );
    expect(withTechnique.progress[0]).toMatchObject({
      techniqueId: technique.id,
      bookmarked: true,
      bookmarkedVariantKeys: [toVariantStorageKey(getFallbackVariantForTechnique(technique))],
    });
    expect(withTechnique.bookmarkCollections).toHaveLength(1);
    expect(withTechnique.collections[0]?.itemIds).toEqual(['technique:technique-1']);

    const withTerm = assignTermToCollection(baseDB(), 'ma-ai', 'collection-1', 10, () => 'gbc-1');
    expect(withTerm.glossaryProgress[0]).toMatchObject({ termId: 'ma-ai', bookmarked: true });
    expect(withTerm.glossaryBookmarkCollections).toHaveLength(1);
    expect(withTerm.collections[0]?.itemIds).toEqual(['glossary:ma-ai']);

    const withExercise = assignExerciseToCollection(
      baseDB(),
      'dead-bug',
      'collection-1',
      10,
      () => 'ebc-1',
    );
    expect(withExercise.exerciseProgress[0]).toMatchObject({
      exerciseId: 'dead-bug',
      bookmarked: true,
    });
    expect(withExercise.exerciseBookmarkCollections).toHaveLength(1);
    expect(withExercise.collections[0]?.itemIds).toEqual(['exercise:dead-bug']);
  });

  it('reorders mixed collection item ids without dropping unknown entries', () => {
    const db: DB = {
      ...baseDB(),
      collections: [
        {
          ...baseDB().collections[0],
          itemIds: ['technique:technique-1', 'unknown:item', 'exercise:dead-bug'],
        },
      ],
    };

    const moved = reorderCollectionItemById(db, 'collection-1', 'unknown:item', 'forward', 10);
    expect(moved.collections[0]?.itemIds).toEqual([
      'technique:technique-1',
      'exercise:dead-bug',
      'unknown:item',
    ]);

    const appended = reorderCollectionItemById(
      moved,
      'collection-1',
      'glossary:ma-ai',
      'backward',
      11,
    );
    expect(appended.collections[0]?.itemIds).toEqual([
      'technique:technique-1',
      'exercise:dead-bug',
      'glossary:ma-ai',
      'unknown:item',
    ]);
  });
});
