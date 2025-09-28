import { expandWithSynonyms, getTaxonomyLabel } from '../i18n/taxonomy';
import type { TaxonomyType } from '../i18n/taxonomy';
import type { Technique } from '../types';
import { gradeLabel } from '../styles/belts';
import { stripDiacritics } from '../utils/text';

const TAXONOMY_FIELDS: TaxonomyType[] = ['category', 'attack', 'stance', 'weapon'];

type SearchEntry = {
  technique: Technique;
  haystack: string;
};

const pushToken = (set: Set<string>, raw: string | undefined | null): void => {
  if (!raw) return;
  const lower = raw.toLowerCase();
  if (!lower) return;

  const queue = new Set<string>();
  queue.add(lower);
  queue.add(stripDiacritics(lower));
  queue.add(lower.replace(/[-_\s]/g, ''));

  const accentless = stripDiacritics(lower).replace(/[-_\s]/g, '');
  queue.add(accentless);

  for (const segment of lower.split(/[-_\s/]+/)) {
    if (segment) {
      queue.add(segment);
      queue.add(stripDiacritics(segment));
    }
  }

  for (const token of queue) {
    if (token.trim().length > 0) {
      set.add(token);
    }
  }
};

const addSynonymTokens = (set: Set<string>, value: string): void => {
  for (const synonym of expandWithSynonyms(value)) {
    pushToken(set, synonym);
  }
};

export const buildSearchIndex = (techniques: Technique[]): SearchEntry[] =>
  techniques.map((technique) => {
    const tokens = new Set<string>();

    pushToken(tokens, technique.name.en);
    pushToken(tokens, technique.name.de);
    pushToken(tokens, technique.jp);
    pushToken(tokens, technique.slug);

    TAXONOMY_FIELDS.forEach((field) => {
      const value = technique[field];
      if (!value) return;
      pushToken(tokens, value);
      pushToken(tokens, getTaxonomyLabel('en', field, value));
      pushToken(tokens, getTaxonomyLabel('de', field, value));
      addSynonymTokens(tokens, value);
    });

    pushToken(tokens, gradeLabel(technique.level, 'en'));
    pushToken(tokens, gradeLabel(technique.level, 'de'));

    technique.tags?.forEach((tag) => {
      pushToken(tokens, tag);
      addSynonymTokens(tokens, tag);
    });

    if (technique.ukeNotes) {
      pushToken(tokens, technique.ukeNotes.en);
      pushToken(tokens, technique.ukeNotes.de);
    }

    const haystack = Array.from(tokens).join(' ');
    return { technique, haystack };
  });

export const normalizeSearchQuery = (value: string): string[] => {
  const compact = value.trim().toLowerCase();
  if (!compact) return [];
  const normalized = stripDiacritics(compact);
  return normalized.split(/\s+/).filter(Boolean);
};

export const matchSearch = (haystack: string, queries: string[]): boolean =>
  queries.every((query) => haystack.includes(query));

export type { SearchEntry };
