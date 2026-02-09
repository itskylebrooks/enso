import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { GlossaryTerm } from '../../../shared/types';
import { parseGlossaryTerm } from '../schemas/glossary';

const glossaryDir = path.join(process.cwd(), 'content', 'glossary');

const slugRedirects: Record<string, string> = {
  'irimi-omote': 'irimi',
  'tenkan-ura': 'tenkan',
};

const readGlossaryFiles = async (): Promise<string[]> => {
  const entries = await readdir(glossaryDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => path.join(glossaryDir, entry.name))
    .sort();
};

export const loadAllGlossaryTerms = async (): Promise<GlossaryTerm[]> => {
  const files = await readGlossaryFiles();
  const terms: GlossaryTerm[] = [];
  const seenSlugs = new Set<string>();

  for (const filePath of files) {
    const raw = await readFile(filePath, 'utf8');
    const json = JSON.parse(raw) as unknown;
    const expectedSlug = path.basename(filePath, '.json');
    const term = parseGlossaryTerm(json, expectedSlug);

    if (seenSlugs.has(term.slug)) {
      throw new Error(`Duplicate glossary slug detected: ${term.slug}`);
    }

    seenSlugs.add(term.slug);
    terms.push(term);
  }

  terms.sort((a, b) => a.romaji.localeCompare(b.romaji, 'en', { sensitivity: 'accent' }));
  return terms;
};

export const loadGlossaryTermBySlug = async (slug: string): Promise<GlossaryTerm | undefined> => {
  const terms = await loadAllGlossaryTerms();
  const finalSlug = slugRedirects[slug] || slug;
  return terms.find((term) => term.slug === finalSlug);
};
