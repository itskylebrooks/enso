import { z } from 'zod';
import type { Technique } from '../types';

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
  type: z.enum(['youtube', 'image', 'file']),
  url: z.string().min(1, 'media url must not be empty'),
  title: z.string().optional(),
});

const ukeSchema = z.object({
  role: z.object({
    en: z.string().min(1, 'uke.role.en must not be empty'),
    de: z.string().min(1, 'uke.role.de must not be empty'),
  }).optional(),
  notes: z.object({
    en: z.array(z.string().min(1, 'uke.notes.en items must not be empty')),
    de: z.array(z.string().min(1, 'uke.notes.de items must not be empty')),
  }).optional(),
});

export const techniqueZ = z
  .object({
    id: z.string().min(1, 'id is required'),
    slug: z.string().min(1, 'slug is required'),
    name: z.object({
      en: z.string().min(1, 'name.en is required'),
      de: z.string().min(1, 'name.de is required'),
    }),
    jp: z.string().optional(),
    category: z.string().min(1, 'category is required'),
    attack: z.string().optional(),
    stance: z.string().optional(),
    weapon: z.string().optional(),
    level: z.enum(gradeValues),
    description: z.object({
      en: z.string().min(1, 'description.en is required'),
      de: z.string().min(1, 'description.de is required'),
    }),
    steps: z.object({
      en: z.array(z.string().min(1)),
      de: z.array(z.string().min(1)),
    }),
    uke: ukeSchema.nullable().optional().default(null),
    media: z.array(mediaSchema),
    tags: z.array(z.string().min(1)).optional(),
    variations: z.array(z.string().min(1)).optional().default([]),
  })
  .superRefine((value, ctx) => {
    if (value.steps.en.length !== value.steps.de.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'steps.en and steps.de must contain the same number of entries',
        path: ['steps'],
      });
    }
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
