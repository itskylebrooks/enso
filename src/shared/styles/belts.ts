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

// Base colors - consistent across light and dark modes
const baseColors: Record<Grade, string> = {
  kyu5: '#f7d80e', // Yellow
  kyu4: '#f2571a', // Orange
  kyu3: '#0aad28', // Green
  kyu2: '#2563EB', // Blue
  kyu1: '#8c4b0b', // Brown
  dan1: '#0B0B0B', // Black
  dan2: '#0B0B0B', // Black
  dan3: '#0B0B0B', // Black
  dan4: '#0B0B0B', // Black
  dan5: '#0B0B0B', // Black
};

// Belt-label text colors:
// - Dark mode: Kyū labels use pure black text for readability.
// - Light mode: 5th Kyū uses #909090 on yellow; other Kyū grades use white.
// - Dan labels remain white for contrast on black belts.
const getAdaptiveTextColor = (grade: Grade, isDark: boolean): string => {
  if (grade.startsWith('dan')) return '#FFFFFF';
  if (isDark) return '#000000';
  if (grade === 'kyu5') return '#909090';
  return '#FFFFFF';
};

const getCssVariableTextColor = (grade: Grade): string => {
  if (grade.startsWith('dan')) return 'var(--belt-label-text-dan, #FFFFFF)';
  if (grade === 'kyu5') return 'var(--belt-label-text-kyu5, #909090)';
  return 'var(--belt-label-text-kyu, #FFFFFF)';
};

// Legacy palette for compatibility (defaults to light mode)
const palette: Record<Grade, { bg: string; fg: string }> = Object.fromEntries(
  Object.entries(baseColors).map(([grade, bg]) => [
    grade,
    { bg, fg: getAdaptiveTextColor(grade as Grade, false) },
  ]),
) as Record<Grade, { bg: string; fg: string }>;

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

export const getGradeStyle = (
  grade: Grade,
  isDark?: boolean,
): { backgroundColor: string; color: string; borderColor?: string } => {
  const backgroundColor = baseColors[grade];
  // If isDark is provided, use direct theme-aware colors.
  // Otherwise use CSS variables so labels adapt to runtime theme changes.
  const color =
    typeof isDark === 'boolean' ? getAdaptiveTextColor(grade, isDark) : getCssVariableTextColor(grade);
  const borderColor = grade.startsWith('dan') ? 'var(--belt-dan-border)' : undefined;
  return { backgroundColor, color, borderColor };
};
