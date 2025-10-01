import { expandWithSynonyms, getTaxonomyLabel } from '../../shared/i18n/taxonomy';
import type { TaxonomyType } from '../../shared/i18n/taxonomy';
import type { Technique, GlossaryTerm } from '../../shared/types';
import { gradeLabel } from '../../shared/styles/belts';
import { stripDiacritics } from '../../shared/utils/text';

const TAXONOMY_FIELDS: TaxonomyType[] = ['category', 'attack', 'weapon'];

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
    pushToken(tokens, technique.summary.en);
    pushToken(tokens, technique.summary.de);

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

    technique.tags.forEach((tag) => {
      pushToken(tokens, tag);
      addSynonymTokens(tokens, tag);
    });

    technique.versions.forEach((version) => {
      pushToken(tokens, version.label);
      pushToken(tokens, version.trainerId);
      pushToken(tokens, version.dojoId);

      // Index steps from stepsByEntry structure
      if (version.stepsByEntry.irimi) {
        version.stepsByEntry.irimi.en.forEach((step) => pushToken(tokens, step));
        version.stepsByEntry.irimi.de.forEach((step) => pushToken(tokens, step));
      }
      if (version.stepsByEntry.tenkan) {
        version.stepsByEntry.tenkan.en.forEach((step) => pushToken(tokens, step));
        version.stepsByEntry.tenkan.de.forEach((step) => pushToken(tokens, step));
      }

      pushToken(tokens, version.uke.role.en);
      pushToken(tokens, version.uke.role.de);
      version.uke.notes.en.forEach((note) => pushToken(tokens, note));
      version.uke.notes.de.forEach((note) => pushToken(tokens, note));

      version.media.forEach((media) => {
        pushToken(tokens, media.title);
        pushToken(tokens, media.url);
      });

      version.keyPoints.en.forEach((item) => pushToken(tokens, item));
      version.keyPoints.de.forEach((item) => pushToken(tokens, item));
      version.commonMistakes.en.forEach((item) => pushToken(tokens, item));
      version.commonMistakes.de.forEach((item) => pushToken(tokens, item));
      if (version.context) {
        pushToken(tokens, version.context.en);
        pushToken(tokens, version.context.de);
      }
    });

    const haystack = Array.from(tokens).join(' ');
    return { technique, haystack };
  });

export const normalizeSearchQuery = (value: string): string[] => {
  const compact = value.trim().toLowerCase();
  if (!compact) return [];
  const normalized = stripDiacritics(compact);
  
  // Split on whitespace to get individual terms
  const terms = normalized.split(/\s+/).filter(Boolean);
  
  // Also add a combined version without spaces/hyphens for compound terms like "ma ai" -> "maai"
  if (terms.length > 1) {
    const combined = terms.join('').replace(/[-_]/g, '');
    if (combined && !terms.includes(combined)) {
      terms.push(combined);
    }
  }
  
  return terms;
};

export const matchSearch = (haystack: string, queries: string[]): boolean =>
  queries.every((query) => {
    // For very short queries (1-2 chars), be more strict to avoid too many partial matches
    if (query.length <= 2) {
      // Only match if it's at the start of a word or exact token match
      const tokens = haystack.split(/\s+/);
      return tokens.some(token => {
        return token === query || token.startsWith(query + '-') || token.startsWith(query);
      });
    }
    
    // For longer queries, split haystack into words and check for meaningful matches
    const tokens = haystack.split(/\s+/);
    
    return tokens.some(token => {
      // Exact token match (highest priority)
      if (token === query) return true;
      
      // Token starts with query (second priority)  
      if (token.startsWith(query)) return true;
      
      // Allow matches after word separators (hyphens, underscores) 
      if (token.includes('-' + query) || token.includes('_' + query)) return true;
      
      // For queries 4+ characters, allow substring matches within tokens
      // This helps with compound words but reduces noise for shorter queries
      if (query.length >= 4 && token.includes(query)) return true;
      
      return false;
    });
  });

// Glossary search functionality
type GlossarySearchEntry = {
  term: GlossaryTerm;
  haystack: string;
};

export const buildGlossarySearchIndex = (terms: GlossaryTerm[]): GlossarySearchEntry[] =>
  terms.map((term) => {
    const tokens = new Set<string>();

    // Index romaji (main term name)
    pushToken(tokens, term.romaji);
    
    // Index Japanese text if available
    if (term.jp) {
      pushToken(tokens, term.jp);
    }

    // Index category
    pushToken(tokens, term.category);
    addSynonymTokens(tokens, term.category);

    // Index definitions in both languages
    pushToken(tokens, term.def.en);
    pushToken(tokens, term.def.de);

    // Index literal translations in both languages if available
    if (term.literal?.en) {
      pushToken(tokens, term.literal.en);
    }
    if (term.literal?.de) {
      pushToken(tokens, term.literal.de);
    }

    // Index notes in both languages if available
    if (term.notes?.en) {
      pushToken(tokens, term.notes.en);
    }
    if (term.notes?.de) {
      pushToken(tokens, term.notes.de);
    }

    // Index slug for direct matching
    pushToken(tokens, term.slug);

    const haystack = Array.from(tokens).join(' ');
    return { term, haystack };
  });

export type { SearchEntry, GlossarySearchEntry };
