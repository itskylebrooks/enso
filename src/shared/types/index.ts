export type Locale = 'en' | 'de';

export type MediaType = 'youtube' | 'vimeo' | 'link';

export type Grade =
  | 'kyu5' | 'kyu4' | 'kyu3' | 'kyu2' | 'kyu1'
  | 'dan1' | 'dan2' | 'dan3' | 'dan4' | 'dan5';

export type EntryMode = 'irimi' | 'tenkan' | 'omote' | 'ura';

// New types for toolbar redesign
export type Hanmi = 'ai-hanmi' | 'gyaku-hanmi';
export type Direction = 'irimi' | 'tenkan' | 'omote' | 'ura';
export type WeaponKind = 'empty' | 'bokken' | 'jo' | 'tanto';

export type StepsByEntry = Partial<Record<EntryMode, LocalizedSteps>>;

export type LocalizedSteps = { en: string[]; de: string[] };

export type TechniqueVersion = {
  id: string;
  trainerId?: string;
  dojoId?: string;
  label?: string; // Optional, can be generated dynamically
  hanmi: Hanmi; // Required: ai-hanmi or gyaku-hanmi
  stepsByEntry: StepsByEntry;
  steps?: LocalizedSteps; // Legacy support for migration
  uke: {
    role: { en: string; de: string };
    notes: { en: string[]; de: string[] };
  };
  keyPoints: { en: string[]; de: string[] };
  commonMistakes: { en: string[]; de: string[] };
  context?: { en: string; de: string };
  media: Array<{ type: MediaType; url: string; title?: string }>;
};

// Alias for consistency with requirements
export type Version = TechniqueVersion;

// New types for toolbar-based variant system
export type TechniqueVersionMeta = {
  id: string;           // stable slug: e.g., "haase-bsv"
  label: string;        // "Alfred Haase (BSV)"
  dojo?: string;        // "BSV"
  trainerId?: string;   // "alfred-haase"
};

export type TechniqueVariantKey = {
  hanmi: Hanmi;              // Required hanmi
  direction: Direction;
  weapon: WeaponKind;
  versionId?: string | null; // undefined or null => standard
};

export type Localized<T> = {
  en: T;
  de: T;
};

export type MediaItem = {
  type: MediaType;
  url: string;
  title?: string;
};

export type TechniqueVariant = {
  key: TechniqueVariantKey;
  steps: Localized<string[]>;
  uke?: {
    role: Localized<string>;
    notes: Localized<string[]>;
  };
  keyPoints?: Localized<string[]>;
  commonMistakes?: Localized<string[]>;
  context?: Localized<string>;
  media?: MediaItem[];
};

export type TechniqueV2 = {
  id: string;
  slug: string;
  name: { en: string; de: string };
  jp?: string;
  category: string;
  attack?: string;
  weapon?: string;
  level: Grade;
  aliases?: string[];
  summary: { en: string; de: string };
  tags: string[];
  versions: TechniqueVersion[];
  // New fields for toolbar-based variant system (optional for migration)
  versionsMeta?: TechniqueVersionMeta[];  // catalog of available version authors
  variants?: TechniqueVariant[];          // content per (direction, weapon, version)
};

export type Technique = TechniqueV2;

export type Progress = {
  techniqueId: string;
  bookmarked: boolean;
  updatedAt: number;
};

export type GlossaryProgress = {
  termId: string;
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

export type GlossaryBookmarkCollection = {
  id: string;
  termId: string;
  collectionId: string;
  createdAt: number;
};

export type Theme = 'light' | 'dark';

export type DB = {
  version: number;
  techniques: Technique[];
  progress: Progress[];
  glossaryProgress: GlossaryProgress[];
  collections: Collection[];
  bookmarkCollections: BookmarkCollection[];
  glossaryBookmarkCollections: GlossaryBookmarkCollection[];
};

export type AppRoute = 'home' | 'library' | 'bookmarks' | 'about' | 'guide' | 'glossary' | 'feedback';

export type Filters = {
  category?: string;
  attack?: string;
  stance?: string;
  weapon?: string;
  level?: Grade;
  trainer?: string;
};

export type GlossaryTerm = {
  id: string;        // stable id, same as file name without .json
  slug: string;      // url-safe slug (unique)
  romaji: string;    // e.g., "tenkan"
  jp?: string;       // kanji, e.g., "転換"
  category: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other';
  def: { en: string; de: string };       // short definition (1–2 lines)
  literal?: { en: string; de: string };  // word-by-word translation (optional)
  notes?: { en: string; de: string };    // longer text (optional)
};

export type Trainer = {
  id: string;
  name: string;
  dojoId: string;
};

export type Dojo = {
  id: string;
  name: string;
  city: string;
  country: string;
};
