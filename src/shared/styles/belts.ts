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

// Light mode palette - good contrast on light backgrounds
const lightPalette: Record<Grade, { bg: string; fg: string }> = {
  kyu5: { bg: '#f59e0b', fg: '#1A1A1A' },  // Darker yellow for better contrast
  kyu4: { bg: '#f2571a', fg: '#FFFFFF' },
  kyu3: { bg: '#0aad28', fg: '#FFFFFF' },
  kyu2: { bg: '#2563EB', fg: '#FFFFFF' },
  kyu1: { bg: '#8c4b0b', fg: '#FFFFFF' },
  dan1: { bg: '#1F2937', fg: '#FFFFFF' },  // Dark gray instead of pure black
  dan2: { bg: '#1F2937', fg: '#FFFFFF' },
  dan3: { bg: '#1F2937', fg: '#FFFFFF' },
  dan4: { bg: '#1F2937', fg: '#FFFFFF' },
  dan5: { bg: '#1F2937', fg: '#FFFFFF' },
};

// Dark mode palette - good contrast on dark backgrounds  
const darkPalette: Record<Grade, { bg: string; fg: string }> = {
  kyu5: { bg: '#fbbf24', fg: '#1A1A1A' },  // Brighter yellow for dark backgrounds
  kyu4: { bg: '#f97316', fg: '#FFFFFF' },
  kyu3: { bg: '#22c55e', fg: '#000000' },  // Brighter green with dark text
  kyu2: { bg: '#3b82f6', fg: '#FFFFFF' },
  kyu1: { bg: '#a16207', fg: '#FFFFFF' },
  dan1: { bg: '#374151', fg: '#FFFFFF' },  // Gray that's visible on dark backgrounds
  dan2: { bg: '#374151', fg: '#FFFFFF' },
  dan3: { bg: '#374151', fg: '#FFFFFF' },
  dan4: { bg: '#374151', fg: '#FFFFFF' },
  dan5: { bg: '#374151', fg: '#FFFFFF' },
};

// Legacy palette for compatibility
const palette: Record<Grade, { bg: string; fg: string }> = lightPalette;

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

export const getGradeStyle = (grade: Grade, isDark?: boolean): { backgroundColor: string; color: string } => {
  const selectedPalette = isDark ? darkPalette : lightPalette;
  const entry = selectedPalette[grade];
  return { backgroundColor: entry.bg, color: entry.fg };
};
