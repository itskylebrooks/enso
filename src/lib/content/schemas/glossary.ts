import { z } from 'zod';
import type { GlossaryTerm } from '../../../shared/types';

const localizedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
});

export const glossaryTermZ = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  romaji: z.string().min(1),
  jp: z.string().min(1).optional(),
  category: z.enum(['movement', 'stance', 'attack', 'etiquette', 'philosophy', 'other']),
  def: localizedString,
  literal: localizedString.optional(),
  notes: localizedString.optional(),
});

export const parseGlossaryTerm = (json: unknown, expectedSlug: string): GlossaryTerm => {
  const result = glossaryTermZ.safeParse(json);
  if (!result.success) {
    throw result.error;
  }

  const parsed = result.data;
  if (parsed.slug !== expectedSlug) {
    throw new Error(`slug mismatch: expected "${expectedSlug}" but found "${parsed.slug}"`);
  }

  return parsed as GlossaryTerm;
};
