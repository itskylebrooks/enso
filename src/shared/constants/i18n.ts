import { de } from '../../lib/i18n/ui/de';
import { en } from '../../lib/i18n/ui/en';
import type { Locale } from '../types';

export const messages = {
  en,
  de,
} as const satisfies Record<Locale, Record<string, unknown>>;

type Messages = typeof messages;

export type Copy = Messages[Locale];
export type FeedbackPageCopy = Copy['feedbackPage'];

export const getCopy = (locale: Locale): Copy => messages[locale];
