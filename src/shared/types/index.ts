export type Locale = 'en' | 'de';

export type MediaType = 'youtube' | 'vimeo' | 'link';

export type Grade =
  | 'kyu5' | 'kyu4' | 'kyu3' | 'kyu2' | 'kyu1'
  | 'dan1' | 'dan2' | 'dan3' | 'dan4' | 'dan5';

export type TechniqueVersion = {
  id: string;
  label: string;
  sensei?: string;
  dojo?: string;
  lineage?: string;
  sourceUrl?: string;
  lastUpdated?: string;
  steps: { en: string[]; de: string[] };
  uke: {
    role: { en: string; de: string };
    notes: { en: string[]; de: string[] };
  };
  media: Array<{ type: MediaType; url: string; title?: string }>;
  keyPoints?: { en: string[]; de: string[] };
  commonMistakes?: { en: string[]; de: string[] };
  context?: { en: string; de: string };
};

export type TechniqueV2 = {
  id: string;
  slug: string;
  name: { en: string; de: string };
  jp?: string;
  category: string;
  attack?: string;
  stance?: string;
  weapon?: string;
  level: Grade;
  summary: { en: string; de: string };
  versions: TechniqueVersion[];
  tags: string[];
};

export type Technique = TechniqueV2;

export type Progress = {
  techniqueId: string;
  bookmarked: boolean;
  updatedAt: number;
};

export type Collection = {
  id: string;
  name: string;
  icon?: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

export type BookmarkCollection = {
  id: string;
  techniqueId: string;
  collectionId: string;
  createdAt: number;
};

export type Theme = 'light' | 'dark';

export type DB = {
  version: number;
  techniques: Technique[];
  progress: Progress[];
  collections: Collection[];
  bookmarkCollections: BookmarkCollection[];
};

export type AppRoute = 'home' | 'library' | 'bookmarks' | 'about' | 'basics' | 'glossary';

export type Filters = {
  category?: string;
  attack?: string;
  stance?: string;
  weapon?: string;
  level?: Grade;
};

export type GlossaryTerm = {
  id: string;        // stable id, same as file name without .json
  slug: string;      // url-safe slug (unique)
  romaji: string;    // e.g., "tenkan"
  jp?: string;       // kanji, e.g., "転換"
  kana?: string;     // kana reading (optional)
  category: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other';
  def: { en: string; de: string };       // short definition (1–2 lines)
  notes?: { en: string; de: string };    // longer text (optional)
};
