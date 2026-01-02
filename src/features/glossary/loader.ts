import type { GlossaryTerm } from '../../shared/types';

// Use Vite's import.meta.glob to load all glossary JSON files at build time
const modules = import.meta.glob('/content/glossary/*.json', { eager: true });

// Cache for loaded terms
let termsCache: GlossaryTerm[] | null = null;
let termsBySlugCache: Map<string, GlossaryTerm> | null = null;

// Backwards compatibility redirects for renamed slugs
const slugRedirects: Record<string, string> = {
  'irimi-omote': 'irimi',
  'tenkan-ura': 'tenkan',
};

/**
 * Load all glossary terms from JSON files and cache them
 */
export async function loadAllTerms(): Promise<GlossaryTerm[]> {
  if (termsCache) {
    return termsCache;
  }

  const terms: GlossaryTerm[] = [];

  for (const [filePath, module] of Object.entries(modules)) {
    try {
      const termData = (module as Record<string, unknown>).default || module;

      // Validate that we have required fields
      if (!termData.id || !termData.slug || !termData.romaji || !termData.def) {
        console.warn(`Invalid glossary term in ${filePath}:`, termData);
        continue;
      }

      terms.push(termData as GlossaryTerm);
    } catch (error) {
      console.error(`Error loading glossary term from ${filePath}:`, error);
    }
  }

  // Dedupe by slug (keep first occurrence) to avoid duplicate entries when
  // multiple files define the same slug (e.g., legacy/redirected files).
  const bySlug = new Map<string, GlossaryTerm>();
  for (const term of terms) {
    if (bySlug.has(term.slug)) {
      console.warn(`Duplicate glossary slug encountered for '${term.slug}', skipping duplicate.`);
      continue;
    }
    bySlug.set(term.slug, term);
  }

  const uniqueTerms = Array.from(bySlug.values());

  // Sort by romaji using locale-aware comparison
  uniqueTerms.sort((a, b) =>
    a.romaji.localeCompare(b.romaji, 'en', {
      sensitivity: 'accent',
      caseFirst: 'lower',
    }),
  );

  termsCache = uniqueTerms;

  // Build slug-to-term map for quick lookups
  termsBySlugCache = new Map();
  uniqueTerms.forEach((term) => {
    termsBySlugCache!.set(term.slug, term);
  });

  return uniqueTerms;
}

/**
 * Load a specific glossary term by its slug, with backwards compatibility redirects
 */
export async function loadTermBySlug(slug: string): Promise<GlossaryTerm | undefined> {
  // Ensure terms are loaded and cached
  await loadAllTerms();

  // Check for redirects first
  const redirectedSlug = slugRedirects[slug] || slug;

  return termsBySlugCache?.get(redirectedSlug);
}

/**
 * Clear the cache (useful for testing or hot reloading)
 */
export function clearCache(): void {
  termsCache = null;
  termsBySlugCache = null;
}
