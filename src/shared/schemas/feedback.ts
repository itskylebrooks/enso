import { z } from 'zod';

const LocaleSchema = z.enum(['en', 'de']);

const MediaSchema = z
  .object({
    type: z.enum(['youtube', 'image', 'link']),
    url: z.string().trim().url().max(2000),
    title: z.string().trim().max(200).optional(),
  })
  .strict();

const VariantKeySchema = z
  .object({
    hanmi: z.enum(['ai-hanmi', 'gyaku-hanmi']),
    direction: z.enum(['irimi', 'tenkan', 'omote', 'ura']),
    weapon: z.enum(['empty', 'bokken', 'jo', 'tanto']),
    versionId: z.string().trim().max(120).nullable().optional(),
  })
  .strict();

const BaseSchema = z.object({
  version: z.literal(2),
  name: z.string().trim().min(1).max(80),
  locale: LocaleSchema,
  summary: z.string().trim().min(1).max(120),
  clientVersion: z.string().trim().max(64).optional(),
  honeypot: z.string().max(200),
});

const StructuredContentSchema = z
  .object({
    contentName: z.string().trim().max(160).optional(),
    attack: z.string().trim().max(120).optional(),
    category: z.string().trim().max(120).optional(),
    level: z.string().trim().max(80).optional(),
    routineCategory: z.string().trim().max(80).optional(),
    estimatedMinutes: z.number().int().positive().max(600).optional(),
    routineExercises: z.array(z.string().trim().min(1).max(1000)).max(50).optional(),
    steps: z.array(z.string().trim().min(1).max(1000)).max(30).optional(),
    uke: z.string().trim().max(3000).optional(),
    keyPoints: z.array(z.string().trim().min(1).max(1000)).max(20).optional(),
    commonMistakes: z.array(z.string().trim().min(1).max(1000)).max(20).optional(),
    context: z.string().trim().max(5000).optional(),
    attribution: z.string().trim().max(1000).optional(),
    media: z.array(MediaSchema).max(12).optional(),
  })
  .strict();

export const ContentFeedbackSchema = BaseSchema.extend({
  kind: z.literal('content'),
  target: z
    .object({
      entityType: z.enum([
        'technique',
        'exercise',
        'routine',
        'form',
        'glossary',
        'exam',
        'other',
      ]),
      mode: z.enum(['edit', 'new']),
      entityId: z.string().trim().max(256).optional(),
      variantKey: VariantKeySchema.optional(),
    })
    .strict(),
  details: z.string().trim().min(1).max(10_000),
  structured: StructuredContentSchema.optional(),
  consent: z.literal(true),
}).strict();

export const AppIdeaFeedbackSchema = BaseSchema.extend({
  kind: z.literal('idea'),
  area: z.string().trim().max(120).optional(),
  details: z.string().trim().min(1).max(10_000),
  media: z.array(MediaSchema).max(12).optional(),
}).strict();

export const BugFeedbackSchema = BaseSchema.extend({
  kind: z.literal('bug'),
  location: z.string().trim().max(500).optional(),
  details: z.string().trim().min(1).max(10_000),
  reproduction: z.string().trim().max(5000).optional(),
  media: z.array(MediaSchema).max(12).optional(),
}).strict();

export const FeedbackSubmissionSchema = z.discriminatedUnion('kind', [
  ContentFeedbackSchema,
  AppIdeaFeedbackSchema,
  BugFeedbackSchema,
]);

export type ParsedFeedbackSubmission = z.infer<typeof FeedbackSubmissionSchema>;
