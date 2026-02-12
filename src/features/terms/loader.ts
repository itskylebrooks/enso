import termsData from '@generated/content/terms.json';
import type { GlossaryTerm } from '../../shared/types';

let termsCache: GlossaryTerm[] | null = null;
let termsBySlugCache: Map<string, GlossaryTerm> | null = null;

const slugRedirects: Record<string, string> = {
  'irimi-omote': 'irimi',
  'tenkan-ura': 'tenkan',
};

export async function loadAllTerms(): Promise<GlossaryTerm[]> {
  if (termsCache) {
    return termsCache;
  }

  const terms = [...(termsData as GlossaryTerm[])].sort((a, b) =>
    a.romaji.localeCompare(b.romaji, 'en', {
      sensitivity: 'accent',
      caseFirst: 'lower',
    }),
  );

  termsCache = terms;
  termsBySlugCache = new Map(terms.map((term) => [term.slug, term]));
  return terms;
}

export async function loadTermBySlug(slug: string): Promise<GlossaryTerm | undefined> {
  await loadAllTerms();
  const redirectedSlug = slugRedirects[slug] || slug;
  return termsBySlugCache?.get(redirectedSlug);
}

export function clearCache(): void {
  termsCache = null;
  termsBySlugCache = null;
}
