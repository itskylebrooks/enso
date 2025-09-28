import type { Grade, Locale } from '../types';

export const gradeOrder: Grade[] = ['kyu5', 'kyu4', 'kyu3', 'kyu2', 'kyu1', 'dan1', 'dan2', 'dan3', 'dan4', 'dan5'];

const gradeSuffix: Record<Locale, { kyu: string; dan: string }> = {
  en: { kyu: 'Kyū', dan: 'Dan' },
  de: { kyu: 'Kyū', dan: 'Dan' },
};

export const gradeLabel = (grade: Grade, locale: Locale): string => {
  const suffix = grade.startsWith('kyu') ? gradeSuffix[locale].kyu : gradeSuffix[locale].dan;
  const numeric = grade.replace(/[^0-9]/g, '');
  return grade.startsWith('kyu') ? `${numeric} ${suffix}` : `${numeric}. ${suffix}`;
};

export const gradeColor: Record<Grade, string> = {
  kyu5: 'bg-yellow-200 text-yellow-900 dark:bg-yellow-300 dark:text-yellow-900',
  kyu4: 'bg-orange-200 text-orange-900 dark:bg-orange-300 dark:text-orange-900',
  kyu3: 'bg-green-200 text-green-900 dark:bg-green-300 dark:text-green-900',
  kyu2: 'bg-blue-200 text-blue-900 dark:bg-blue-300 dark:text-blue-900',
  kyu1: 'bg-amber-800 text-white dark:bg-amber-900 dark:text-white',
  dan1: 'bg-gray-900 text-white dark:bg-black dark:text-white',
  dan2: 'bg-gray-900 text-white dark:bg-black dark:text-white',
  dan3: 'bg-gray-900 text-white dark:bg-black dark:text-white',
  dan4: 'bg-gray-900 text-white dark:bg-black dark:text-white',
  dan5: 'bg-gray-900 text-white dark:bg-black dark:text-white',
};
