import { z } from 'zod';
import type { SyncPayloadData } from '../supabase/types';

const id = z.string().trim().min(1).max(512);
const timestamp = z.number().finite().nonnegative();
const positiveTimestamp = z.number().finite().positive();

const TechniqueVariantKeySchema = z
  .object({
    hanmi: z.enum(['ai-hanmi', 'gyaku-hanmi']),
    direction: z.enum(['irimi', 'tenkan', 'omote', 'ura']),
    weapon: z.enum(['empty', 'bokken', 'jo', 'tanto']),
    versionId: z.string().trim().max(512).nullable().optional(),
  })
  .strict();

const ProgressSchema = z
  .object({
    techniqueId: id,
    bookmarked: z.boolean(),
    bookmarkedVariant: TechniqueVariantKeySchema.optional(),
    bookmarkedVariantKeys: z.array(z.string().max(1024)).max(1000).optional(),
    updatedAt: timestamp,
  })
  .strict();

const GlossaryProgressSchema = z
  .object({
    termId: id,
    bookmarked: z.boolean(),
    updatedAt: timestamp,
  })
  .strict();

const ExerciseProgressSchema = z
  .object({
    exerciseId: id,
    bookmarked: z.boolean(),
    updatedAt: timestamp,
  })
  .strict();

const StudyStatusEntrySchema = z
  .object({
    status: z.enum(['none', 'practice', 'stable']),
    updatedAt: timestamp,
  })
  .strict();

const StudyStatusSchema = z.record(StudyStatusEntrySchema).superRefine((entries, context) => {
  Object.keys(entries).forEach((key) => {
    if (!/^(technique|term|exercise):/.test(key) || key.length > 2048) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: 'Invalid study status key',
      });
    }
  });
});

const CollectionSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(200),
    icon: z.string().trim().max(200).nullable().optional(),
    itemIds: z.array(z.string().max(2048)).max(10_000),
    sortOrder: z.number().finite(),
    createdAt: timestamp,
    updatedAt: timestamp.optional(),
  })
  .strict()
  .transform((collection) => ({
    ...collection,
    updatedAt: collection.updatedAt ?? collection.createdAt,
  }));

const BookmarkCollectionSchema = z
  .object({
    id,
    techniqueId: id,
    collectionId: id,
    createdAt: timestamp,
  })
  .strict();

const GlossaryBookmarkCollectionSchema = z
  .object({
    id,
    termId: id,
    collectionId: id,
    createdAt: timestamp,
  })
  .strict();

const ExerciseBookmarkCollectionSchema = z
  .object({
    id,
    exerciseId: id,
    collectionId: id,
    createdAt: timestamp,
  })
  .strict();

const GradeSchema = z.enum([
  'kyu5',
  'kyu4',
  'kyu3',
  'kyu2',
  'kyu1',
  'dan1',
  'dan2',
  'dan3',
  'dan4',
  'dan5',
]);

const FiltersSchema = z
  .object({
    category: z.string().max(512).optional(),
    attack: z.string().max(512).optional(),
    stance: z.string().max(512).optional(),
    weapon: z.string().max(512).optional(),
    level: GradeSchema.optional(),
    trainer: z.string().max(512).optional(),
  })
  .strict();

export const SyncPayloadSchema = z
  .object({
    version: z.literal(2),
    db: z
      .object({
        progress: z.array(ProgressSchema).max(10_000),
        glossaryProgress: z.array(GlossaryProgressSchema).max(10_000),
        exerciseProgress: z.array(ExerciseProgressSchema).max(10_000),
        studyStatus: StudyStatusSchema,
        collections: z.array(CollectionSchema).max(10_000),
        bookmarkCollections: z.array(BookmarkCollectionSchema).max(10_000),
        glossaryBookmarkCollections: z.array(GlossaryBookmarkCollectionSchema).max(10_000),
        exerciseBookmarkCollections: z.array(ExerciseBookmarkCollectionSchema).max(10_000),
      })
      .strict(),
    settings: z
      .object({
        themePreference: z.enum(['light', 'dark']).nullable(),
        locale: z.enum(['en', 'de']),
        filters: FiltersSchema,
        filterPanelPinned: z.boolean(),
        showTeachInPrimaryNav: z.boolean().default(false),
      })
      .strict(),
    homepage: z
      .object({
        pinnedBeltGrade: GradeSchema.nullable(),
        beltPromptDismissed: z.boolean(),
        onboardingDismissed: z.boolean(),
        onboardingCompleted: z.boolean(),
        onboardingStep: z.number().int().nonnegative().nullable(),
      })
      .strict(),
    timestamps: z
      .object({
        db: timestamp,
        settings: timestamp,
        homepage: timestamp,
      })
      .strict(),
    tombstones: z.record(positiveTimestamp),
  })
  .strict();

export const PushRequestSchema = z
  .object({
    payload: SyncPayloadSchema,
  })
  .strict();

export const parseSyncPayload = (value: unknown): SyncPayloadData =>
  SyncPayloadSchema.parse(value) as SyncPayloadData;
