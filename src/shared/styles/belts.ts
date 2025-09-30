import type { Grade, Locale } from '../types';

const gradeSuffix: Record<Locale, { kyu: string; dan: string }> = {
  en: { kyu: 'Kyū', dan: 'Dan' },
  de: { kyu: 'Kyū', dan: 'Dan' },
};

const ordinal = (value: string, locale: Locale): string => {
  const number = parseInt(value, 10);
  if (Number.isNaN(number)) return value;
  if (locale === 'de') {
    return `${number}.`;
  }
  if (number === 1) return '1st';
  if (number === 2) return '2nd';
  if (number === 3) return '3rd';
  return `${number}th`;
};

const palette: Record<Grade, { bg: string; fg: string }> = {
  kyu5: { bg: '#f7d80e', fg: '#1A1A1A' },
  kyu4: { bg: '#f2571a', fg: '#FFFFFF' },
  kyu3: { bg: '#0aad28', fg: '#FFFFFF' },
  kyu2: { bg: '#2563EB', fg: '#E6F0FF' },
  kyu1: { bg: '#8c4b0b', fg: '#FFFFFF' },
  dan1: { bg: '#0B0B0B', fg: '#FFFFFF' },
  dan2: { bg: '#0B0B0B', fg: '#FFFFFF' },
  dan3: { bg: '#0B0B0B', fg: '#FFFFFF' },
  dan4: { bg: '#0B0B0B', fg: '#FFFFFF' },
  dan5: { bg: '#0B0B0B', fg: '#FFFFFF' },
};

export const gradePalette = palette;

export const gradeColor: Record<Grade, string> = Object.fromEntries(
  Object.entries(palette).map(([grade, value]) => [grade, value.bg]),
) as Record<Grade, string>;

export const gradeTextColor: Record<Grade, string> = Object.fromEntries(
  Object.entries(palette).map(([grade, value]) => [grade, value.fg]),
) as Record<Grade, string>;

export const gradeLabel = (grade: Grade, locale: Locale): string => {
  const suffix = grade.startsWith('kyu') ? gradeSuffix[locale].kyu : gradeSuffix[locale].dan;
  const numeric = grade.replace(/[^0-9]/g, '');
  if (grade.startsWith('kyu')) {
    const ord = locale === 'de' ? `${numeric}.` : ordinal(numeric, locale);
    return `${ord} ${suffix}`;
  }
  const ord = locale === 'de' ? `${numeric}.` : ordinal(numeric, locale);
  return `${ord} ${suffix}`;
};

export const getGradeStyle = (grade: Grade): { backgroundColor: string; color: string } => {
  const entry = palette[grade];
  return { backgroundColor: entry.bg, color: entry.fg };
};
