import type { Technique, GlossaryTerm, Locale } from '../../shared/types';
import { stripDiacritics } from '../../shared/utils/text';
import { ENTRY_MODE_ORDER } from '../../shared/constants/entryModes';

export type ScoredSearchResult = 
  | { type: 'technique'; item: Technique; score: number }
  | { type: 'glossary'; item: GlossaryTerm; score: number };

// Field weights for different entity types
const FIELD_WEIGHTS = {
  technique: {
    nameEN: 7,
    nameDE: 7,
    romaji: 7,
    tags: 5,
    attack: 3,
    weapon: 3,
    level: 3,
    summary: 2,
    steps: 1,
    keyPoints: 1
  },
  glossary: {
    romaji: 8,
    jp: 6,
    slug: 5,
    def: 2,
    literal: 1,
    notes: 1
  }
} as const;

// Boost multipliers for different match types
const MATCH_BOOSTS = {
  exactMatch: 100,      // Exact title/term match
  prefixMatch: 50,      // Prefix match on primary fields
  tagExact: 25,         // Tag/alias exact match
  contains: 10,         // Contains in primary fields
  fuzzy: 5,            // Fuzzy match (1 edit distance)
  secondary: 2         // Secondary fields
} as const;

// Normalize text for comparison (diacritics-insensitive, case-insensitive)
const normalizeText = (text: string): string => {
  return stripDiacritics(text.toLowerCase())
    .replace(/[ōû]/g, 'o')
    .replace(/[ūù]/g, 'u')
    .replace(/[-_\s]+/g, '')
    .replace(/[^\w]/g, '');
};

// Calculate edit distance for fuzzy matching
const editDistance = (a: string, b: string): number => {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

// Check if query matches field with different match types
const getFieldMatchScore = (fieldValue: string, query: string, weight: number): number => {
  if (!fieldValue || !query) return 0;
  
  const normalizedField = normalizeText(fieldValue);
  const normalizedQuery = normalizeText(query);
  
  // Exact match (highest score)
  if (normalizedField === normalizedQuery) {
    return weight * MATCH_BOOSTS.exactMatch;
  }
  
  // Prefix match - strongly favor these for all query lengths
  if (normalizedField.startsWith(normalizedQuery)) {
    // Extra boost for prefix matches, especially for short queries
    const prefixBoost = query.length <= 3 ? 3 : 2;
    return weight * MATCH_BOOSTS.prefixMatch * prefixBoost;
  }
  
  // Word boundary prefix match (e.g., "ai" matches "ai-hanmi", "irim" matches "irimi-nage")
  const fieldWords = fieldValue.toLowerCase().split(/[-\s]+/);
  for (const word of fieldWords) {
    const normalizedWord = normalizeText(word);
    if (normalizedWord.startsWith(normalizedQuery)) {
      // Strong boost for word-start prefix matches
      const wordPrefixBoost = query.length <= 3 ? 2.5 : 1.8;
      return weight * MATCH_BOOSTS.prefixMatch * wordPrefixBoost;
    }
  }
  
  // Hyphenated/compound word prefix (e.g., "ai" in "ai-hanmi")
  if (normalizedField.includes('-' + normalizedQuery) || 
      normalizedField.includes(' ' + normalizedQuery)) {
    return weight * MATCH_BOOSTS.prefixMatch * 0.8;
  }
  
  // Contains match
  if (normalizedField.includes(normalizedQuery)) {
    return weight * MATCH_BOOSTS.contains;
  }
  
  // Fuzzy match (1 edit distance) for typos
  if (query.length >= 3 && editDistance(normalizedField, normalizedQuery) === 1) {
    return weight * MATCH_BOOSTS.fuzzy;
  }
  
  // Fuzzy match on words within field
  const words = fieldValue.toLowerCase().split(/[-\s]+/);
  for (const word of words) {
    const normalizedWord = normalizeText(word);
    if (normalizedWord.length >= 3 && editDistance(normalizedWord, normalizedQuery) === 1) {
      return weight * MATCH_BOOSTS.fuzzy * 0.5;
    }
  }
  
  return 0;
};

// Score a technique against a query
export const scoreTechnique = (technique: Technique, query: string, locale: Locale): number => {
  let score = 0;
  const weights = FIELD_WEIGHTS.technique;
  
  // Primary fields (name, romaji)
  score += getFieldMatchScore(technique.name.en, query, weights.nameEN);
  score += getFieldMatchScore(technique.name.de, query, weights.nameDE);
  
  if (technique.jp) {
    score += getFieldMatchScore(technique.jp, query, weights.romaji);
  }
  
  // Tags - exact matches get special boost
  for (const tag of technique.tags) {
    if (normalizeText(tag) === normalizeText(query)) {
      score += weights.tags * MATCH_BOOSTS.tagExact;
    } else {
      score += getFieldMatchScore(tag, query, weights.tags);
    }
  }
  
  // Taxonomy fields
  if (technique.attack) {
    score += getFieldMatchScore(technique.attack, query, weights.attack);
  }
  if (technique.weapon) {
    score += getFieldMatchScore(technique.weapon, query, weights.weapon);
  }
  
  // Summary (secondary field)
  const summary = technique.summary[locale] || technique.summary.en;
  score += getFieldMatchScore(summary, query, weights.summary) * MATCH_BOOSTS.secondary / MATCH_BOOSTS.contains;
  
  // Steps and key points (lowest priority)
  technique.versions.forEach(version => {
    // Steps across entry modes
    ENTRY_MODE_ORDER.forEach((mode) => {
      const entry = version.stepsByEntry?.[mode];
      if (!entry) return;
      const steps = entry[locale] || entry.en;
      steps.forEach(step => {
        score += getFieldMatchScore(step, query, weights.steps) * MATCH_BOOSTS.secondary / MATCH_BOOSTS.contains;
      });
    });
    
    // Key points
    const keyPoints = version.keyPoints[locale] || version.keyPoints.en;
    keyPoints.forEach(point => {
      score += getFieldMatchScore(point, query, weights.keyPoints) * MATCH_BOOSTS.secondary / MATCH_BOOSTS.contains;
    });
  });
  
  return score;
};

// Score a glossary term against a query
export const scoreGlossaryTerm = (term: GlossaryTerm, query: string, locale: Locale): number => {
  let score = 0;
  const weights = FIELD_WEIGHTS.glossary;
  
  // Primary fields (romaji is most important for glossary terms)
  const romajiScore = getFieldMatchScore(term.romaji, query, weights.romaji);
  const slugScore = getFieldMatchScore(term.slug, query, weights.slug);
  
  // Apply additional boost for glossary terms when they match primary fields
  if (romajiScore > 0 || slugScore > 0) {
    const glossaryBoost = 1.5; // 50% boost for glossary term primary matches
    score += (romajiScore + slugScore) * glossaryBoost;
  } else {
    score += romajiScore + slugScore;
  }
  
  if (term.jp) {
    score += getFieldMatchScore(term.jp, query, weights.jp);
  }
  
  // Definition (secondary field)
  const definition = term.def[locale] || term.def.en;
  score += getFieldMatchScore(definition, query, weights.def) * MATCH_BOOSTS.secondary / MATCH_BOOSTS.contains;
  
  // Literal translation and notes (lowest priority)
  if (term.literal) {
    const literal = term.literal[locale] || term.literal.en;
    if (literal) {
      score += getFieldMatchScore(literal, query, weights.literal) * MATCH_BOOSTS.secondary / MATCH_BOOSTS.contains;
    }
  }
  
  if (term.notes) {
    const notes = term.notes[locale] || term.notes.en;
    if (notes) {
      score += getFieldMatchScore(notes, query, weights.notes) * MATCH_BOOSTS.secondary / MATCH_BOOSTS.contains;
    }
  }
  
  return score;
};

// Apply tie-breaking rules when scores are equal
export const applyTieBreakers = (a: ScoredSearchResult, b: ScoredSearchResult): number => {
  // If scores are different, sort by score (descending)
  if (a.score !== b.score) {
    return b.score - a.score;
  }
  
  // Entity type priority: Glossary term > Technique > Collection
  const typeOrder = { glossary: 1, technique: 2 };
  const aTypeOrder = typeOrder[a.type] || 99;
  const bTypeOrder = typeOrder[b.type] || 99;
  
  if (aTypeOrder !== bTypeOrder) {
    return aTypeOrder - bTypeOrder;
  }
  
  // Shorter title wins (canonical term preference)
  const aTitle = a.type === 'technique' ? a.item.name.en : a.item.romaji;
  const bTitle = b.type === 'technique' ? b.item.name.en : b.item.romaji;
  
  if (aTitle.length !== bTitle.length) {
    return aTitle.length - bTitle.length;
  }
  
  // Alphabetical as final tie-breaker
  return aTitle.localeCompare(bTitle);
};

// Main scoring function that handles synonym expansion and multi-term queries
export const scoreSearchResult = (
  result: { type: 'technique'; item: Technique } | { type: 'glossary'; item: GlossaryTerm },
  queryTerms: string[],
  locale: Locale
): number => {
  let maxScore = 0;
  
  // Handle synonyms and aliases
  const expandedQueries = new Set(queryTerms);
  
  // Add common Aikidō synonyms
  const synonymMap = {
    'ikkyo': ['ude-osae', 'udiosae'],
    'ude-osae': ['ikkyo'],
    'nikyo': ['kote-mawashi', 'kotemawashi'],
    'kote-mawashi': ['nikyo'],
    'irimi': ['entering', 'enter'],
    'tenkan': ['turning', 'turn'],
    'ai-hanmi': ['same-stance', 'samestance'],
    'gyaku-hanmi': ['opposite-stance', 'oppositestance'],
    'omote': ['front', 'forward'],
    'ura': ['back', 'behind', 'rear'],
    'tachi': ['sword', 'katana'],
    'jo': ['staff', 'stick']
  };
  
  queryTerms.forEach(term => {
    const normalized = normalizeText(term);
    if (synonymMap[normalized as keyof typeof synonymMap]) {
      synonymMap[normalized as keyof typeof synonymMap].forEach(synonym => {
        expandedQueries.add(synonym);
      });
    }
  });
  
  // Score against each query term (including synonyms)
  for (const query of expandedQueries) {
    let termScore = 0;
    
    if (result.type === 'technique') {
      termScore = scoreTechnique(result.item, query, locale);
    } else {
      termScore = scoreGlossaryTerm(result.item, query, locale);
    }
    
    maxScore = Math.max(maxScore, termScore);
  }
  
  // Multi-term boost: if multiple terms match, give a small bonus
  if (queryTerms.length > 1) {
    let matchingTerms = 0;
    for (const query of queryTerms) {
      const termScore = result.type === 'technique' 
        ? scoreTechnique(result.item, query, locale)
        : scoreGlossaryTerm(result.item, query, locale);
      
      if (termScore > 0) matchingTerms++;
    }
    
    if (matchingTerms > 1) {
      maxScore *= (1 + (matchingTerms - 1) * 0.1); // 10% bonus per additional matching term
    }
  }
  
  return maxScore;
};