import type {
  AppRoute,
  DB,
  Exercise,
  ExerciseProgress,
  GlossaryProgress,
  GlossaryTerm,
  Locale,
  Progress,
  StudyStatus,
  Technique,
} from '@shared/types';
import { createCollectionItemId } from '@shared/utils/collectionItems';
import { getAggregateTechniqueStudyStatus, getStudyStatusForItem } from '@shared/utils/studyStatus';
import { buildTechniqueUrl } from '@shared/constants/urls';

export type ContentKind = 'technique' | 'term' | 'exercise';

type ContentItemByKind = {
  technique: Technique;
  term: GlossaryTerm;
  exercise: Exercise;
};

type ContentProgressByKind = {
  technique: Progress;
  term: GlossaryProgress;
  exercise: ExerciseProgress;
};

export type ContentDescriptor<
  TKind extends ContentKind,
  TItem = ContentItemByKind[TKind],
  TProgress = ContentProgressByKind[TKind],
> = {
  kind: TKind;
  route: AppRoute;
  routeBase: string;
  itemIdPrefix: TKind extends 'term' ? 'glossary' : TKind;
  getId: (item: TItem) => string;
  getSlug: (item: TItem) => string;
  getTitle: (item: TItem, locale: Locale) => string;
  getItems: (db: DB, loaded: { terms: GlossaryTerm[]; exercises: Exercise[] }) => TItem[];
  findBySlug: (
    slug: string,
    db: DB,
    loaded: { terms: GlossaryTerm[]; exercises: Exercise[] },
  ) => TItem | undefined;
  findProgress: (db: DB, item: TItem) => TProgress | undefined;
  isBookmarked: (progress: TProgress | undefined) => boolean;
  buildCollectionItemId: (item: TItem) => string;
  getStudyStatus: (db: DB, item: TItem) => StudyStatus;
  buildDetailPath: (item: TItem) => string;
  buildListPath: () => string;
};

const titleForLocale = (localized: { en: string; de: string }, locale: Locale): string =>
  localized[locale] || localized.en || localized.de;

export const techniqueContent: ContentDescriptor<'technique'> = {
  kind: 'technique',
  route: 'libraryTechniques',
  routeBase: '/library/techniques',
  itemIdPrefix: 'technique',
  getId: (item) => item.id,
  getSlug: (item) => item.slug,
  getTitle: (item, locale) => titleForLocale(item.name, locale),
  getItems: (db) => db.techniques,
  findBySlug: (slug, db) => db.techniques.find((item) => item.slug === slug),
  findProgress: (db, item) => db.progress.find((entry) => entry.techniqueId === item.id),
  isBookmarked: (progress) => Boolean(progress?.bookmarked),
  buildCollectionItemId: (item) => createCollectionItemId('technique', item.id),
  getStudyStatus: (db, item) => getAggregateTechniqueStudyStatus(db.studyStatus, item.slug),
  buildDetailPath: (item) => buildTechniqueUrl(item.slug),
  buildListPath: () => '/library/techniques',
};

export const termContent: ContentDescriptor<'term'> = {
  kind: 'term',
  route: 'libraryTerms',
  routeBase: '/library/terms',
  itemIdPrefix: 'glossary',
  getId: (item) => item.slug,
  getSlug: (item) => item.slug,
  getTitle: (item) => item.romaji,
  getItems: (_db, loaded) => loaded.terms,
  findBySlug: (slug, _db, loaded) => loaded.terms.find((item) => item.slug === slug),
  findProgress: (db, item) => db.glossaryProgress.find((entry) => entry.termId === item.slug),
  isBookmarked: (progress) => Boolean(progress?.bookmarked),
  buildCollectionItemId: (item) => createCollectionItemId('glossary', item.slug),
  getStudyStatus: (db, item) => getStudyStatusForItem(db.studyStatus, 'term', item.slug),
  buildDetailPath: (item) => `/library/terms/${encodeURIComponent(item.slug)}`,
  buildListPath: () => '/library/terms',
};

export const exerciseContent: ContentDescriptor<'exercise'> = {
  kind: 'exercise',
  route: 'libraryExercises',
  routeBase: '/library/exercises',
  itemIdPrefix: 'exercise',
  getId: (item) => item.slug,
  getSlug: (item) => item.slug,
  getTitle: (item, locale) => titleForLocale(item.name, locale),
  getItems: (_db, loaded) => loaded.exercises,
  findBySlug: (slug, _db, loaded) => loaded.exercises.find((item) => item.slug === slug),
  findProgress: (db, item) => db.exerciseProgress.find((entry) => entry.exerciseId === item.slug),
  isBookmarked: (progress) => Boolean(progress?.bookmarked),
  buildCollectionItemId: (item) => createCollectionItemId('exercise', item.slug),
  getStudyStatus: (db, item) => getStudyStatusForItem(db.studyStatus, 'exercise', item.slug),
  buildDetailPath: (item) => `/library/exercises/${encodeURIComponent(item.slug)}`,
  buildListPath: () => '/library/exercises',
};

export const contentRegistry = {
  technique: techniqueContent,
  term: termContent,
  exercise: exerciseContent,
} satisfies {
  [K in ContentKind]: ContentDescriptor<K>;
};

export const contentDescriptors = [techniqueContent, termContent, exerciseContent] as const;
