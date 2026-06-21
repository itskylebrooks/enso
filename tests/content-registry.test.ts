import { describe, expect, it } from 'vitest';
import { contentRegistry } from '../src/shared/content/registry';
import type { DB, Exercise, GlossaryTerm, Technique } from '../src/shared/types';

const technique: Technique = {
  id: 'technique-1',
  slug: 'katate-tori-irimi-nage',
  name: { en: 'Katate-tori Irimi-nage', de: 'Katate-tori Irimi-nage' },
  category: 'throws',
  level: 'kyu4',
  summary: { en: 'Entering throw.', de: 'Eingangswurf.' },
  tags: [],
  versions: [],
};

const term: GlossaryTerm = {
  id: 'term-1',
  slug: 'ma-ai',
  romaji: 'Ma-ai',
  category: 'philosophy',
  def: { en: 'Distance.', de: 'Distanz.' },
};

const exercise: Exercise = {
  id: 'exercise-1',
  slug: 'dead-bug',
  name: { en: 'Dead bug', de: 'Dead Bug' },
  category: 'core',
  summary: { en: 'Core control.', de: 'Rumpfkontrolle.' },
};

const db: DB = {
  version: 7,
  techniques: [technique],
  progress: [{ techniqueId: technique.id, bookmarked: true, updatedAt: 1 }],
  glossaryProgress: [{ termId: term.slug, bookmarked: true, updatedAt: 1 }],
  exerciseProgress: [{ exerciseId: exercise.slug, bookmarked: false, updatedAt: 1 }],
  studyStatus: {
    [`technique:${technique.slug}`]: { status: 'practice', updatedAt: 1 },
    [`term:${term.slug}`]: { status: 'stable', updatedAt: 1 },
  },
  collections: [],
  bookmarkCollections: [],
  glossaryBookmarkCollections: [],
  exerciseBookmarkCollections: [],
};

describe('content registry', () => {
  it('describes detail paths and collection ids for current content kinds', () => {
    expect(contentRegistry.technique.buildDetailPath(technique)).toBe(
      '/library/techniques/katate-tori-irimi-nage',
    );
    expect(contentRegistry.term.buildDetailPath(term)).toBe('/library/terms/ma-ai');
    expect(contentRegistry.exercise.buildDetailPath(exercise)).toBe('/library/exercises/dead-bug');

    expect(contentRegistry.technique.buildCollectionItemId(technique)).toBe(
      'technique:technique-1',
    );
    expect(contentRegistry.term.buildCollectionItemId(term)).toBe('glossary:ma-ai');
    expect(contentRegistry.exercise.buildCollectionItemId(exercise)).toBe('exercise:dead-bug');
  });

  it('finds items, progress, bookmarks, and study status through descriptors', () => {
    const loaded = { terms: [term], exercises: [exercise] };

    const foundTechnique = contentRegistry.technique.findBySlug(technique.slug, db, loaded);
    const foundTerm = contentRegistry.term.findBySlug(term.slug, db, loaded);
    const foundExercise = contentRegistry.exercise.findBySlug(exercise.slug, db, loaded);

    expect(foundTechnique).toBe(technique);
    expect(foundTerm).toBe(term);
    expect(foundExercise).toBe(exercise);

    expect(
      contentRegistry.technique.isBookmarked(contentRegistry.technique.findProgress(db, technique)),
    ).toBe(true);
    expect(contentRegistry.term.isBookmarked(contentRegistry.term.findProgress(db, term))).toBe(
      true,
    );
    expect(
      contentRegistry.exercise.isBookmarked(contentRegistry.exercise.findProgress(db, exercise)),
    ).toBe(false);

    expect(contentRegistry.technique.getStudyStatus(db, technique)).toBe('practice');
    expect(contentRegistry.term.getStudyStatus(db, term)).toBe('stable');
    expect(contentRegistry.exercise.getStudyStatus(db, exercise)).toBe('none');
  });
});
