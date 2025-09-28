import { parseTechnique } from '../content/schema';
import { DB_VERSION, LOCALE_KEY, STORAGE_KEY, THEME_KEY } from '../constants/storage';
import type { DB, Locale, Progress, Technique, Theme } from '../types';

// Load technique files directly from the content/techniques folder.
// Vite's import.meta.glob with { eager: true } returns the parsed JSON modules at build time.
// We handle both module.default and module cases for robustness.
const techniqueModules = import.meta.glob('/content/techniques/*.json', { eager: true }) as Record<
  string,
  unknown
>;

const normalizeOptional = (value: string | undefined | null): string | undefined => {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeTechnique = (technique: Technique): Technique => {
  const notes = technique.ukeNotes
    ? {
        en: technique.ukeNotes.en.trim(),
        de: technique.ukeNotes.de.trim(),
      }
    : null;

  const variations = Array.from(new Set(technique.variations.map((entry) => entry.trim()).filter(Boolean)));

  return {
    ...technique,
    jp: normalizeOptional(technique.jp ?? undefined),
    attack: normalizeOptional(technique.attack ?? undefined),
    stance: normalizeOptional(technique.stance ?? undefined),
    weapon: normalizeOptional(technique.weapon ?? undefined),
    ukeNotes: notes && (notes.en.length > 0 || notes.de.length > 0) ? notes : null,
    variations,
  };
};

const seedTechniques: Technique[] = Object.keys(techniqueModules)
  .map((filePath) => {
    const mod = techniqueModules[filePath] as any;
    const raw = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
    const filename = filePath.split('/').pop() ?? '';
    const slug = filename.replace(/\.json$/i, '');
    // parse/validate technique using schema
    const parsed = parseTechnique(raw, slug);
    return normalizeTechnique(parsed);
  })
  .sort((a, b) => a.name.en.localeCompare(b.name.en));

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const fallbackLocale: Locale = 'en';
const fallbackTheme: Theme = 'light';

const buildDefaultProgress = (techniqueId: string): Progress => ({
  techniqueId,
  focus: false,
  notNow: false,
  confident: false,
  personalNote: '',
  updatedAt: Date.now(),
});

const buildDefaultDB = (): DB => ({
  version: DB_VERSION,
  techniques: seedTechniques,
  progress: seedTechniques.map((technique) => buildDefaultProgress(technique.id)),
});

const readLocalStorage = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLocalStorage = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
};

const removeLocalStorage = (key: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
};

const stripUnknownProgress = (progress: Progress[]): Progress[] =>
  progress.filter((entry): entry is Progress => Boolean(entry && entry.techniqueId));

const ensureProgressCoverage = (db: DB): Progress[] => {
  const progressMap = new Map(stripUnknownProgress(db.progress).map((entry) => [entry.techniqueId, entry]));
  return db.techniques.map((technique) => {
    const existing = progressMap.get(technique.id);
    return existing ? { ...existing } : buildDefaultProgress(technique.id);
  });
};

const normalizeDB = (db: DB): DB => ({
  version: DB_VERSION,
  techniques: seedTechniques,
  progress: ensureProgressCoverage(db),
});

const detectSystemTheme = (): Theme => {
  if (!isBrowser || typeof window.matchMedia !== 'function') {
    return fallbackTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const loadDB = (): DB => {
  const raw = readLocalStorage(STORAGE_KEY);
  if (!raw) {
    return buildDefaultDB();
  }

  try {
    const parsed = JSON.parse(raw) as DB;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('invalid db');
    }

    if (parsed.version !== DB_VERSION) {
      return buildDefaultDB();
    }

    return normalizeDB(parsed);
  } catch {
    return buildDefaultDB();
  }
};

export const saveDB = (db: DB): void => {
  writeLocalStorage(STORAGE_KEY, JSON.stringify({ ...db, version: DB_VERSION }));
};

export const hasStoredTheme = (): boolean => {
  const value = readLocalStorage(THEME_KEY) as Theme | null;
  return value === 'dark' || value === 'light';
};

export const loadTheme = (): Theme => {
  const value = readLocalStorage(THEME_KEY) as Theme | null;
  if (value === 'dark' || value === 'light') {
    return value;
  }
  return detectSystemTheme();
};

export const saveTheme = (theme: Theme): void => {
  writeLocalStorage(THEME_KEY, theme);
};

export const clearThemePreference = (): void => {
  removeLocalStorage(THEME_KEY);
};

export const loadLocale = (): Locale => {
  const value = readLocalStorage(LOCALE_KEY) as Locale | null;
  return value === 'en' || value === 'de' ? value : fallbackLocale;
};

export const saveLocale = (locale: Locale): void => {
  writeLocalStorage(LOCALE_KEY, locale);
};

export const exportDB = (db: DB): string => JSON.stringify({ ...db, version: DB_VERSION }, null, 2);

export const parseIncomingDB = (raw: string): DB => {
  const parsed = JSON.parse(raw) as DB;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON payload');
  }

  return normalizeDB(parsed);
};

export const clearDB = (): DB => {
  if (isBrowser) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return buildDefaultDB();
};
