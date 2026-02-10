import { describe, expect, it } from 'vitest';
import { matchesSearchTokenFilter, parseSearchFilterToken } from '../src/features/search/tokenFilters';

describe('search token filters', () => {
  it('parses English content-type tokens case-insensitively', () => {
    expect(parseSearchFilterToken('t', 'en')).toEqual({ kind: 'type', value: 'technique' });
    expect(parseSearchFilterToken('E', 'en')).toEqual({ kind: 'type', value: 'exercise' });
    expect(parseSearchFilterToken('g', 'en')).toEqual({ kind: 'type', value: 'glossary' });
  });

  it('parses German content-type tokens including U/Ü for exercises', () => {
    expect(parseSearchFilterToken('t', 'de')).toEqual({ kind: 'type', value: 'technique' });
    expect(parseSearchFilterToken('u', 'de')).toEqual({ kind: 'type', value: 'exercise' });
    expect(parseSearchFilterToken('Ü', 'de')).toEqual({ kind: 'type', value: 'exercise' });
    expect(parseSearchFilterToken('b', 'de')).toEqual({ kind: 'type', value: 'glossary' });
  });

  it('parses belt tokens in both locales', () => {
    expect(parseSearchFilterToken('1k', 'en')).toEqual({ kind: 'belt', grade: 'kyu1' });
    expect(parseSearchFilterToken('5K', 'en')).toEqual({ kind: 'belt', grade: 'kyu5' });
    expect(parseSearchFilterToken('3k', 'de')).toEqual({ kind: 'belt', grade: 'kyu3' });
  });

  it('only matches when the whole input is exactly one token', () => {
    expect(parseSearchFilterToken(' t ', 'en')).toEqual({ kind: 'type', value: 'technique' });
    expect(parseSearchFilterToken('t irimi', 'en')).toBeNull();
    expect(parseSearchFilterToken('irimi t', 'en')).toBeNull();
    expect(parseSearchFilterToken('zz', 'en')).toBeNull();
  });

  it('matches result rows against active filter constraints', () => {
    expect(matchesSearchTokenFilter({ kind: 'type', value: 'exercise' }, 'exercise')).toBe(true);
    expect(matchesSearchTokenFilter({ kind: 'type', value: 'exercise' }, 'technique')).toBe(false);

    expect(matchesSearchTokenFilter({ kind: 'belt', grade: 'kyu4' }, 'technique', 'kyu4')).toBe(
      true,
    );
    expect(matchesSearchTokenFilter({ kind: 'belt', grade: 'kyu4' }, 'technique', 'kyu5')).toBe(
      false,
    );
    expect(matchesSearchTokenFilter({ kind: 'belt', grade: 'kyu4' }, 'glossary')).toBe(false);
  });
});
