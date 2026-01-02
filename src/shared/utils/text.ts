export const stripDiacritics = (value: string): string =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '');

export const toSearchable = (value: string): string => stripDiacritics(value).toLowerCase();

export const compactWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();
