import type Fuse from 'fuse.js';
import type { FuseResult, IFuseOptions } from 'fuse.js';
import type { Locale, TechniqueV2 } from '../../shared/types';

export type SearchDoc = {
  id: string;
  slug: string;
  name_en: string;
  name_de: string;
  jp?: string;
  category?: string;
  attack?: string;
  weapon?: string;
  level?: string;
  tags?: string[];
  aliases?: string[];
};

export type SearchHit = FuseResult<SearchDoc>;

type SearchIndex = {
  fuse: Fuse<SearchDoc>;
  docsById: Map<string, SearchDoc>;
  locale: Locale;
};

let searchIndex: SearchIndex | null = null;
let fuseModulePromise: Promise<typeof import('fuse.js')> | null = null;

const loadFuse = async (): Promise<typeof import('fuse.js')> => {
  if (!fuseModulePromise) {
    fuseModulePromise = import('fuse.js');
  }
  return fuseModulePromise;
};

const createDocs = (techniques: TechniqueV2[]): SearchDoc[] =>
  techniques.map((technique) => ({
    id: technique.id,
    slug: technique.slug,
    name_en: technique.name.en,
    name_de: technique.name.de,
    jp: technique.jp,
    category: technique.category,
    attack: technique.attack,

    weapon: technique.weapon,
    level: technique.level,
    tags: technique.tags,
    aliases: [],
  }));

const buildOptions = (locale: Locale): IFuseOptions<SearchDoc> => {
  const localeKey = locale === 'de' ? 'name_de' : 'name_en';
  return {
    includeMatches: true,
    includeScore: true,
    minMatchCharLength: 2,
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      { name: localeKey, weight: 3 },
      { name: 'name_en', weight: localeKey === 'name_en' ? 3 : 2.5 },
      { name: 'name_de', weight: localeKey === 'name_de' ? 3 : 2.5 },
      { name: 'aliases', weight: 2.5 },
      { name: 'tags', weight: 2 },
      { name: 'jp', weight: 1.5 },
      { name: 'category', weight: 1.2 },
      { name: 'attack', weight: 1.2 },
      { name: 'weapon', weight: 1.2 },
      { name: 'level', weight: 1 },
    ],
  };
};

export const buildSearchIndex = async (
  techniques: TechniqueV2[],
  locale: Locale,
): Promise<SearchIndex> => {
  const [{ default: Fuse }] = await Promise.all([loadFuse()]);
  const docs = createDocs(techniques);
  const fuse = new Fuse(
    docs.map((doc) => ({
      ...doc,
      // ensure locale fallback is populated
      name_en: doc.name_en || doc.name_de,
      name_de: doc.name_de || doc.name_en,
    })),
    buildOptions(locale),
  );
  const docsById = new Map(docs.map((doc) => [doc.id, doc]));
  searchIndex = { fuse, docsById, locale };
  return searchIndex;
};

export const getSearchIndex = (): SearchIndex | null => searchIndex;

export const search = (query: string, limit = 30): SearchHit[] => {
  if (!searchIndex) return [];
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  const results = searchIndex.fuse.search(trimmed, { limit });
  return results;
};
