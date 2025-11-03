import { z } from 'zod';
import type { Technique } from '@shared/types';

const gradeValues = [
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
] as const;

const mediaSchema = z.object({
  type: z.enum(['youtube', 'gumlet', 'gumlet-dab', 'link']),
  url: z.string().min(1, 'media url must not be empty'),
  title: z.string().optional(),
});

const localizedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
});

const localizedStringOptional = z.object({
  en: z.string(),
  de: z.string(),
});

const localizedStringArray = z.object({
  en: z.array(z.string().min(1)),
  de: z.array(z.string().min(1)),
});

const stepsByEntrySchema = z.object({
  irimi: localizedStringArray.optional(),
  tenkan: localizedStringArray.optional(),
  omote: localizedStringArray.optional(),
  ura: localizedStringArray.optional(),
  media: z
    .object({
      irimi: z.array(mediaSchema).optional(),
      tenkan: z.array(mediaSchema).optional(),
      omote: z.array(mediaSchema).optional(),
      ura: z.array(mediaSchema).optional(),
    })
    .optional(),
}).refine(
  (data) => Boolean(data.irimi || data.tenkan || data.omote || data.ura),
  { message: 'At least one entry type must be provided' }
);

const versionSchema = z
  .object({
    id: z.string().min(1, 'version id is required'),
    trainerId: z.string().optional(),
    dojoId: z.string().optional(),
    label: z.string().optional(), // Now optional, can be generated dynamically
    hanmi: z.enum(['ai-hanmi', 'gyaku-hanmi']), // Required field
    stepsByEntry: stepsByEntrySchema,
    uke: z.object({
      role: localizedString,
      notes: localizedStringArray,
    }),
    commonMistakes: localizedStringArray,
    context: localizedStringOptional.optional(),
    media: z.array(mediaSchema).optional(),
  })
  .superRefine((value, ctx) => {
    // Validate stepsByEntry arrays have matching lengths
    if (value.stepsByEntry.irimi) {
      if (value.stepsByEntry.irimi.en.length !== value.stepsByEntry.irimi.de.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'stepsByEntry.irimi.en and stepsByEntry.irimi.de must contain the same number of entries',
          path: ['stepsByEntry', 'irimi'],
        });
      }
    }

    const ensureMatchingLengths = (
      entryKey: 'irimi' | 'tenkan' | 'omote' | 'ura',
    ) => {
      const entry = value.stepsByEntry[entryKey];
      if (!entry) return;
      if (entry.en.length !== entry.de.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `stepsByEntry.${entryKey}.en and stepsByEntry.${entryKey}.de must contain the same number of entries`,
          path: ['stepsByEntry', entryKey],
        });
      }
    };

    ensureMatchingLengths('irimi');
    ensureMatchingLengths('tenkan');
    ensureMatchingLengths('omote');
    ensureMatchingLengths('ura');

    if (value.uke.notes.en.length !== value.uke.notes.de.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'uke.notes.en and uke.notes.de must contain the same number of entries',
        path: ['uke', 'notes'],
      });
    }

    const checkArrayLength = (
      field: keyof Pick<typeof value, 'commonMistakes'>,
      path: string[],
    ) => {
      const valueAtField = value[field];
      if (!valueAtField) return;
      if (valueAtField.en.length !== valueAtField.de.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${path.join('.')} entries must be in both locales`,
          path,
        });
      }
    };

    checkArrayLength('commonMistakes', ['commonMistakes']);
  });

export const techniqueZ = z.object({
  id: z.string().min(1, 'id is required'),
  slug: z.string().min(1, 'slug is required'),
  name: localizedString,
  jp: z.string().optional(),
  category: z.string().min(1, 'category is required'),
  attack: z.string().optional(),
  weapon: z.string().optional(),
  level: z.enum(gradeValues),
  aliases: z.array(z.string()).optional(),
  summary: localizedString,
  tags: z.array(z.string().min(1)),
  versions: z.array(versionSchema).min(1, 'at least one version is required'),
});

export type TechniqueContent = Technique;

export const parseTechnique = (json: unknown, expectedSlug: string): Technique => {
  const result = techniqueZ.safeParse(json);
  if (!result.success) {
    throw result.error;
  }

  const parsed = result.data;
  if (parsed.slug !== expectedSlug) {
    throw new Error(`slug mismatch: expected "${expectedSlug}" but found "${parsed.slug}"`);
  }

  return parsed as Technique;
};
