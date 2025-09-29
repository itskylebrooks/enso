import { z } from 'zod';
import type { Technique, TechniqueVersion } from '../types';

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
  type: z.enum(['youtube', 'vimeo', 'link']),
  url: z.string().min(1, 'media url must not be empty'),
  title: z.string().optional(),
});

const localizedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
});

const localizedStringArray = z.object({
  en: z.array(z.string().min(1)),
  de: z.array(z.string().min(1)),
});

const versionSchema = z
  .object({
    id: z.string().min(1, 'version id is required'),
    label: z.string().min(1, 'version label is required'),
    sensei: z.string().optional(),
    dojo: z.string().optional(),
    lineage: z.string().optional(),
    sourceUrl: z.string().url('sourceUrl must be a valid url').optional(),
    lastUpdated: z.string().datetime().optional(),
    steps: localizedStringArray,
    uke: z.object({
      role: localizedString,
      notes: localizedStringArray,
    }),
    media: z.array(mediaSchema),
    keyPoints: localizedStringArray.optional(),
    commonMistakes: localizedStringArray.optional(),
    context: localizedString.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.steps.en.length !== value.steps.de.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'steps.en and steps.de must contain the same number of entries',
        path: ['steps'],
      });
    }

    if (value.uke.notes.en.length !== value.uke.notes.de.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'uke.notes.en and uke.notes.de must contain the same number of entries',
        path: ['uke', 'notes'],
      });
    }

    const checkArrayLength = (
      field: keyof Pick<TechniqueVersion, 'keyPoints' | 'commonMistakes'>,
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

    checkArrayLength('keyPoints', ['keyPoints']);
    checkArrayLength('commonMistakes', ['commonMistakes']);
  });

export const techniqueZ = z.object({
  id: z.string().min(1, 'id is required'),
  slug: z.string().min(1, 'slug is required'),
  name: localizedString,
  jp: z.string().optional(),
  category: z.string().min(1, 'category is required'),
  attack: z.string().optional(),
  stance: z.string().optional(),
  weapon: z.string().optional(),
  level: z.enum(gradeValues),
  summary: localizedString,
  versions: z.array(versionSchema).min(1, 'at least one version is required'),
  tags: z.array(z.string().min(1)),
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
