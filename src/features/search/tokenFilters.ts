import type { Grade, Locale } from '../../shared/types';
import { stripDiacritics } from '../../shared/utils/text';

export type SearchResultType = 'technique' | 'glossary' | 'exercise';
type KyuGrade = Extract<Grade, 'kyu1' | 'kyu2' | 'kyu3' | 'kyu4' | 'kyu5'>;

export type SearchTokenFilter =
  | { kind: 'type'; value: SearchResultType }
  | { kind: 'belt'; grade: KyuGrade };

const TYPE_TOKENS: Record<Locale, Record<string, SearchResultType>> = {
  en: {
    t: 'technique',
    e: 'exercise',
    g: 'glossary',
  },
  de: {
    t: 'technique',
    u: 'exercise',
    b: 'glossary',
  },
};

const BELT_TOKEN_PATTERN = /^([1-5])k$/;

const normalizeToken = (value: string): string => stripDiacritics(value.trim().toLowerCase());

export const parseSearchFilterToken = (
  rawInput: string,
  locale: Locale,
): SearchTokenFilter | null => {
  const token = normalizeToken(rawInput);
  if (!token || /\s/.test(token)) {
    return null;
  }

  const beltMatch = BELT_TOKEN_PATTERN.exec(token);
  if (beltMatch) {
    const [, gradeNumber] = beltMatch;
    return { kind: 'belt', grade: `kyu${gradeNumber}` as KyuGrade };
  }

  const typeValue = TYPE_TOKENS[locale][token];
  if (typeValue) {
    return { kind: 'type', value: typeValue };
  }

  return null;
};

export const matchesSearchTokenFilter = (
  filter: SearchTokenFilter | null,
  resultType: SearchResultType,
  techniqueGrade?: Grade,
): boolean => {
  if (!filter) {
    return true;
  }

  if (filter.kind === 'type') {
    return filter.value === resultType;
  }

  return resultType === 'technique' && techniqueGrade === filter.grade;
};
