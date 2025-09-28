export type Locale = 'en' | 'de';

export type MediaType = 'youtube' | 'image' | 'file';

export type Grade =
  | 'kyu5' | 'kyu4' | 'kyu3' | 'kyu2' | 'kyu1'
  | 'dan1' | 'dan2' | 'dan3' | 'dan4' | 'dan5';

export type Technique = {
  id: string;
  slug: string;
  name: { en: string; de: string };
  jp?: string;
  category: string;
  attack?: string;
  stance?: string;
  weapon?: string;
  level: Grade;
  description: { en: string; de: string };
  steps: { en: string[]; de: string[] };
  ukeNotes: { en: string; de: string } | null;
  media: { type: MediaType; url: string; title?: string }[];
  tags?: string[];
  variations: string[];
};

export type Progress = {
  techniqueId: string;
  focus?: boolean;
  notNow?: boolean;
  confident?: boolean;
  bookmarked?: boolean;
  personalNote?: string;
  updatedAt: number;
};

export type Theme = 'light' | 'dark';

export type DB = {
  version: number;
  techniques: Technique[];
  progress: Progress[];
};

export type AppRoute = 'home' | 'library' | 'progress' | 'about' | 'basics';

export type Filters = {
  category?: string;
  attack?: string;
  stance?: string;
  weapon?: string;
  level?: Grade;
};
