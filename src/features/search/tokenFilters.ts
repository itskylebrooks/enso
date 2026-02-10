import type { Grade, Locale } from '../../shared/types';
import { stripDiacritics } from '../../shared/utils/text';

export type SearchResultType = 'technique' | 'glossary' | 'exercise';
type BeltGrade = Extract<
  Grade,
  'kyu1' | 'kyu2' | 'kyu3' | 'kyu4' | 'kyu5' | 'dan1' | 'dan2' | 'dan3' | 'dan4' | 'dan5'
>;

export type SearchTokenFilter =
  | { kind: 'type'; value: SearchResultType }
  | { kind: 'belt'; grade: BeltGrade };

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

const BELT_TOKEN_PATTERN = /^([1-5])([kd])$/;

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
    const [, gradeNumber, gradeSuffix] = beltMatch;
    const prefix = gradeSuffix === 'k' ? 'kyu' : 'dan';
    return { kind: 'belt', grade: `${prefix}${gradeNumber}` as BeltGrade };
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
