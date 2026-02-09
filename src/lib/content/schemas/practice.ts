import { z } from 'zod';
import type { Exercise } from '../../../shared/types';

const localizedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
});

const localizedStringArray = z.object({
  en: z.array(z.string().min(1)),
  de: z.array(z.string().min(1)),
});

export const practiceExerciseZ = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: localizedString,
  category: z.enum([
    'mobility',
    'strength',
    'core',
    'balance',
    'coordination',
    'power',
    'recovery',
  ]),
  summary: localizedString,
  description: localizedString.optional(),
  howTo: localizedStringArray.optional(),
  equipment: z.array(z.enum(['none', 'mat', 'resistance-band'])).optional(),
  safetyNotes: localizedStringArray.optional(),
  aikidoContext: localizedString.optional(),
  media: z
    .array(
      z.object({
        type: z.enum(['youtube', 'gumlet', 'gumlet-dab', 'link', 'image']),
        url: z.string().min(1),
      }),
    )
    .optional(),
  updatedAt: z.string().optional(),
});

export const parsePracticeExercise = (json: unknown, expectedSlug: string): Exercise => {
  const result = practiceExerciseZ.safeParse(json);
  if (!result.success) {
    throw result.error;
  }

  const parsed = result.data;
  if (parsed.slug !== expectedSlug) {
    throw new Error(`slug mismatch: expected "${expectedSlug}" but found "${parsed.slug}"`);
  }

  return parsed as Exercise;
};
