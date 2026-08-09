import { z } from 'zod';
import type { ChildrenGame } from '../../../shared/types';

const localizedString = z.object({
  en: z.string().min(1),
  de: z.string().min(1),
});

const localizedStringArray = z.object({
  en: z.array(z.string().min(1)).min(1),
  de: z.array(z.string().min(1)).min(1),
});

export const childrenGameZ = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: localizedString,
    participants: z.object({
      min: z.number().int().positive(),
      max: z.number().int().positive(),
    }),
    materials: z
      .array(
        z.enum([
          'none',
          'soft-balls',
          'mat-floor',
          'werewolves-game',
          'indiaca',
          'blindfolds',
          'coasters',
        ]),
      )
      .min(1),
    goal: localizedString,
    rules: localizedStringArray,
    sequence: localizedStringArray,
    settings: z.object({
      outdoor: z.boolean(),
      indoor: z.boolean(),
      evening: z.boolean(),
    }),
    source: z.object({
      name: z.string().min(1),
      url: z.string().url(),
      accessedAt: z.string().date(),
    }),
  })
  .superRefine((game, context) => {
    if (game.participants.max < game.participants.min) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participants', 'max'],
        message: 'Maximum participants must be greater than or equal to the minimum',
      });
    }

    if (game.materials.includes('none') && game.materials.length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['materials'],
        message: 'The "none" material cannot be combined with other materials',
      });
    }
  });

export const parseChildrenGame = (json: unknown): ChildrenGame => {
  const result = childrenGameZ.safeParse(json);
  if (!result.success) {
    throw result.error;
  }
  return result.data as ChildrenGame;
};
