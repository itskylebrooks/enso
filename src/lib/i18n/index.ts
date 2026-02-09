import { de } from './ui/de';
import { en } from './ui/en';
import type { Locale } from '../../shared/types';

export const uiMessages = {
  en,
  de,
} as const;

export const supportedLocales: Locale[] = ['en', 'de'];

export const resolveLocale = (value: string | null | undefined): Locale =>
  value === 'de' ? 'de' : 'en';

export const detectBrowserLocale = (): Locale => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const languages = navigator.languages || [navigator.language];
  return languages.some((language) => language.toLowerCase().startsWith('de')) ? 'de' : 'en';
};
