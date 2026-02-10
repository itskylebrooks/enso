import techniquesData from '@generated/content/techniques.json';
import { ENTRY_MODE_ORDER } from '../constants/entryModes';
import {
  ANIMATION_PREFERENCE_KEY,
  APP_NAME,
  DB_VERSION,
  FILTERS_KEY,
  FILTER_PANEL_PINNED_KEY,
  HOME_BELT_PROMPT_DISMISSED_KEY,
  HOME_PINNED_BELT_KEY,
  LOCALE_KEY,
  STORAGE_KEY,
  THEME_KEY,
} from '../constants/storage';
import type {
  BookmarkCollection,
  Collection,
  DB,
  ExerciseBookmarkCollection,
  ExerciseProgress,
  GlossaryBookmarkCollection,
  GlossaryProgress,
  Grade,
  Locale,
  MediaType,
  Progress,
  StepsByEntry,
  Technique,
  TechniqueVersion,
  Theme,
} from '../types';
import {
  createCollectionItemId,
  normalizeCollectionItemIds,
  sanitizeCollectionItemIds,
} from '../utils/collectionItems';

const normalizeOptional = (value: string | undefined | null): string | undefined => {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeLocalizedString = (value: { en: string; de: string }) => ({
  en: value.en.trim(),
  de: value.de.trim(),
});

const normalizeLocalizedArray = (value: { en: string[]; de: string[] }) => {
  const entries: Array<{ en: string; de: string }> = [];
  for (let index = 0; index < value.en.length; index += 1) {
    const en = (value.en[index] ?? '').trim();
    const de = (value.de[index] ?? '').trim();
    if (en.length === 0 && de.length === 0) continue;
    entries.push({ en, de });
  }

  return {
    en: entries.map((entry) => entry.en),
    de: entries.map((entry) => entry.de),
  };
};

const normalizeVersion = (version: TechniqueVersion): TechniqueVersion => {
  const normalizedSteps: StepsByEntry = {};

  ENTRY_MODE_ORDER.forEach((mode) => {
    const steps = version.stepsByEntry?.[mode];
    if (steps) {
      normalizedSteps[mode] = normalizeLocalizedArray(steps);
    }
  });

  const normalized: TechniqueVersion = {
    ...version,
    trainerId: normalizeOptional(version.trainerId),
    dojoId: normalizeOptional(version.dojoId),
    label: version.label ? version.label.trim() : undefined,
    stepsByEntry: normalizedSteps,
    uke: {
      role: normalizeLocalizedString(version.uke.role),
      notes: normalizeLocalizedArray(version.uke.notes),
    },
    commonMistakes: normalizeLocalizedArray(version.commonMistakes),
    context: version.context ? normalizeLocalizedString(version.context) : undefined,
    media: Array.isArray(version.media)
      ? version.media.map((item: { type: string; url?: string; title?: string }) => ({
          type: item.type as MediaType,
          url: (item.url ?? '').trim(),
          title: typeof item.title === 'string' ? item.title.trim() : undefined,
        }))
      : [],
    // support optional per-entry media block under stepsByEntry.media
    mediaByEntry: (() => {
      const mediaObj = (version.stepsByEntry as Record<string, unknown>)?.media;
      if (!mediaObj || typeof mediaObj !== 'object') return undefined;
      const out: Record<string, Array<{ type: MediaType; url: string; title?: string }>> = {};
      ['irimi', 'tenkan', 'omote', 'ura'].forEach((k) => {
        const arr = (mediaObj as Record<string, unknown>)[k];
        if (Array.isArray(arr)) {
          out[k] = arr.map((m: { type: string; url?: string; title?: string }) => ({
            type: m.type as MediaType,
            url: (m.url ?? '').trim(),
            title: typeof m.title === 'string' ? m.title.trim() : undefined,
          }));
        }
      });
      return Object.keys(out).length > 0 ? out : undefined;
    })(),
  };

  return normalized;
};

const normalizeTechnique = (technique: Technique): Technique => ({
  ...technique,
  jp: normalizeOptional(technique.jp ?? undefined),
  attack: normalizeOptional(technique.attack ?? undefined),
  weapon: normalizeOptional(technique.weapon ?? undefined),
  aliases: technique.aliases
    ? technique.aliases.filter((alias) => alias.trim().length > 0)
    : undefined,
  summary: normalizeLocalizedString(technique.summary),
  tags: Array.from(
    new Set(technique.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
  ),
  versions: technique.versions.map(normalizeVersion),
});

const seedTechniques: Technique[] = (techniquesData as Technique[])
  .map((technique) => normalizeTechnique(technique))
  .sort((a, b) => a.name.en.localeCompare(b.name.en));

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const fallbackLocale: Locale = 'en';
const fallbackTheme: Theme = 'light';

const buildDefaultProgress = (techniqueId: string): Progress => ({
  techniqueId,
  bookmarked: false,
  updatedAt: Date.now(),
});

const buildDefaultGlossaryProgress = (termId: string): GlossaryProgress => ({
  termId,
  bookmarked: false,
  updatedAt: Date.now(),
});

const buildDefaultExerciseProgress = (exerciseId: string): ExerciseProgress => ({
  exerciseId,
  bookmarked: false,
  updatedAt: Date.now(),
});

const buildDefaultDB = (): DB => ({
  version: DB_VERSION,
  techniques: seedTechniques,
  progress: seedTechniques.map((technique) => buildDefaultProgress(technique.id)),
  glossaryProgress: [],
  exerciseProgress: [],
  collections: [],
  bookmarkCollections: [],
  glossaryBookmarkCollections: [],
  exerciseBookmarkCollections: [],
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

const readCookie = (key: string): string | null => {
  if (!isBrowser || typeof document === 'undefined') return null;
  try {
    const entries = document.cookie.split(';');
    for (const entry of entries) {
      const [rawName, ...rawValue] = entry.trim().split('=');
      if (rawName === key) {
        return decodeURIComponent(rawValue.join('='));
      }
    }
    return null;
  } catch {
    return null;
  }
};

const writeCookie = (key: string, value: string): void => {
  if (!isBrowser || typeof document === 'undefined') return;
  try {
    document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* noop */
  }
};

const stripUnknownProgress = (progress: Progress[]): Progress[] =>
  progress.filter((entry): entry is Progress => Boolean(entry && entry.techniqueId));

const ensureProgressCoverage = (db: DB): Progress[] => {
  const progressMap = new Map(
    stripUnknownProgress(db.progress).map((entry) => [entry.techniqueId, entry]),
  );
  return db.techniques.map((technique) => {
    const existing = progressMap.get(technique.id);
    return existing ? { ...existing } : buildDefaultProgress(technique.id);
  });
};

const stripUnknownGlossaryProgress = (progress: GlossaryProgress[]): GlossaryProgress[] =>
  progress.filter((entry): entry is GlossaryProgress => Boolean(entry && entry.termId));

const ensureGlossaryProgress = (rawGlossaryProgress: GlossaryProgress[]): GlossaryProgress[] => {
  return stripUnknownGlossaryProgress(
    Array.isArray(rawGlossaryProgress) ? rawGlossaryProgress : [],
  );
};

const stripUnknownExerciseProgress = (progress: ExerciseProgress[]): ExerciseProgress[] =>
  progress.filter((entry): entry is ExerciseProgress => Boolean(entry && entry.exerciseId));

const ensureExerciseProgress = (rawExerciseProgress: ExerciseProgress[]): ExerciseProgress[] => {
  return stripUnknownExerciseProgress(
    Array.isArray(rawExerciseProgress) ? rawExerciseProgress : [],
  );
};

const ensureGlossaryBookmarkCollections = (
  raw: GlossaryBookmarkCollection[],
  validCollectionIds: Set<string>,
): GlossaryBookmarkCollection[] => {
  if (!Array.isArray(raw)) return [];

  const sanitized = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const { id, termId, collectionId, createdAt } = entry as Partial<GlossaryBookmarkCollection>;
      if (typeof id !== 'string' || id.trim().length === 0) return null;
      if (typeof termId !== 'string' || termId.trim().length === 0) return null;
      if (typeof collectionId !== 'string' || collectionId.trim().length === 0) return null;
      if (!validCollectionIds.has(collectionId)) return null;
      return {
        id,
        termId,
        collectionId,
        createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
      } satisfies GlossaryBookmarkCollection;
    })
    .filter((entry): entry is GlossaryBookmarkCollection => entry !== null);

  return sanitized;
};

const ensureExerciseBookmarkCollections = (
  raw: ExerciseBookmarkCollection[],
  validCollectionIds: Set<string>,
): ExerciseBookmarkCollection[] => {
  if (!Array.isArray(raw)) return [];

  const sanitized = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const { id, exerciseId, collectionId, createdAt } =
        entry as Partial<ExerciseBookmarkCollection>;
      if (typeof id !== 'string' || id.trim().length === 0) return null;
      if (typeof exerciseId !== 'string' || exerciseId.trim().length === 0) return null;
      if (typeof collectionId !== 'string' || collectionId.trim().length === 0) return null;
      if (!validCollectionIds.has(collectionId)) return null;
      return {
        id,
        exerciseId,
        collectionId,
        createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
      } satisfies ExerciseBookmarkCollection;
    })
    .filter((entry): entry is ExerciseBookmarkCollection => entry !== null);

  const seen = new Set<string>();
  return sanitized.filter((entry) => {
    const key = `${entry.collectionId}:${entry.exerciseId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const detectSystemTheme = (): Theme => {
  if (!isBrowser || typeof window.matchMedia !== 'function') {
    return fallbackTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const ensureCollections = (rawCollections: Collection[]): Collection[] => {
  if (!Array.isArray(rawCollections)) return [];

  const now = Date.now();
  const sanitized: Collection[] = [];

  rawCollections.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const { id, name, icon, itemIds, sortOrder, createdAt, updatedAt } = entry as Partial<Collection>;
    if (typeof id !== 'string' || id.trim().length === 0) return;
    if (typeof name !== 'string' || name.trim().length === 0) return;

    const cleanedIcon = typeof icon === 'string' && icon.trim().length > 0 ? icon.trim() : null;
    const created = typeof createdAt === 'number' ? createdAt : now;
    const updated = typeof updatedAt === 'number' ? updatedAt : created;
    const order = Number.isFinite(sortOrder) ? Number(sortOrder) : now;

    sanitized.push({
      id,
      name: name.trim().slice(0, 40),
      icon: cleanedIcon,
      itemIds: sanitizeCollectionItemIds(itemIds),
      sortOrder: order,
      createdAt: created,
      updatedAt: updated,
    });
  });

  return sanitized
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((entry, index) => ({
      ...entry,
      itemIds: sanitizeCollectionItemIds(entry.itemIds),
      sortOrder: index,
    }));
};

const normalizeCollectionItemOrder = (
  collections: Collection[],
  bookmarkCollections: BookmarkCollection[],
  glossaryBookmarkCollections: GlossaryBookmarkCollection[],
  exerciseBookmarkCollections: ExerciseBookmarkCollection[],
): Collection[] => {
  const orderedMembershipItems = [
    ...bookmarkCollections.map((entry) => ({
      collectionId: entry.collectionId,
      itemId: createCollectionItemId('technique', entry.techniqueId),
      createdAt: entry.createdAt,
    })),
    ...glossaryBookmarkCollections.map((entry) => ({
      collectionId: entry.collectionId,
      itemId: createCollectionItemId('glossary', entry.termId),
      createdAt: entry.createdAt,
    })),
    ...exerciseBookmarkCollections.map((entry) => ({
      collectionId: entry.collectionId,
      itemId: createCollectionItemId('exercise', entry.exerciseId),
      createdAt: entry.createdAt,
    })),
  ].sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      return a.createdAt - b.createdAt;
    }
    return a.itemId.localeCompare(b.itemId);
  });

  const orderedPresentIdsByCollection = new Map<string, string[]>();

  orderedMembershipItems.forEach((entry) => {
    const items = orderedPresentIdsByCollection.get(entry.collectionId) ?? [];
    items.push(entry.itemId);
    orderedPresentIdsByCollection.set(entry.collectionId, items);
  });

  return collections.map((collection) => {
    const orderedPresentIds = orderedPresentIdsByCollection.get(collection.id) ?? [];
    return {
      ...collection,
      itemIds: normalizeCollectionItemIds(collection.itemIds, orderedPresentIds, orderedPresentIds),
    };
  });
};

const ensureBookmarkCollections = (
  raw: BookmarkCollection[],
  techniques: Technique[],
  validCollectionIds: Set<string>,
): BookmarkCollection[] => {
  if (!Array.isArray(raw)) return [];
  const techniqueIds = new Set(techniques.map((technique) => technique.id));

  const sanitized = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const { id, techniqueId, collectionId, createdAt } = entry as Partial<BookmarkCollection>;
      if (typeof id !== 'string' || id.trim().length === 0) return null;
      if (typeof techniqueId !== 'string' || !techniqueIds.has(techniqueId)) return null;
      if (typeof collectionId !== 'string' || collectionId.trim().length === 0) return null;
      if (!validCollectionIds.has(collectionId)) return null;
      return {
        id,
        techniqueId,
        collectionId,
        createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
      } satisfies BookmarkCollection;
    })
    .filter((entry): entry is BookmarkCollection => Boolean(entry));

  const seen = new Set<string>();
  return sanitized.filter((entry) => {
    const key = `${entry.collectionId}:${entry.techniqueId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const loadDB = (): DB => {
  const raw = readLocalStorage(STORAGE_KEY);
  if (!raw) {
    return buildDefaultDB();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DB>;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('invalid db');
    }

    const collections = ensureCollections(parsed.collections ?? []);
    const collectionIds = new Set(collections.map((collection) => collection.id));
    const bookmarkCollections = ensureBookmarkCollections(
      parsed.bookmarkCollections ?? [],
      seedTechniques,
      collectionIds,
    );
    const glossaryBookmarkCollections = ensureGlossaryBookmarkCollections(
      parsed.glossaryBookmarkCollections ?? [],
      collectionIds,
    );
    const exerciseBookmarkCollections = ensureExerciseBookmarkCollections(
      parsed.exerciseBookmarkCollections ?? [],
      collectionIds,
    );
    const normalizedCollections = normalizeCollectionItemOrder(
      collections,
      bookmarkCollections,
      glossaryBookmarkCollections,
      exerciseBookmarkCollections,
    );

    const db: DB = {
      version: DB_VERSION,
      techniques: seedTechniques,
      progress: ensureProgressCoverage({
        techniques: seedTechniques,
        progress: Array.isArray(parsed.progress) ? (parsed.progress as Progress[]) : [],
        glossaryProgress: [],
        exerciseProgress: [],
        collections: normalizedCollections,
        bookmarkCollections: [],
        glossaryBookmarkCollections: [],
        exerciseBookmarkCollections: [],
        version: DB_VERSION,
      }),
      glossaryProgress: ensureGlossaryProgress(parsed.glossaryProgress ?? []),
      exerciseProgress: ensureExerciseProgress(parsed.exerciseProgress ?? []),
      collections: normalizedCollections,
      bookmarkCollections,
      glossaryBookmarkCollections,
      exerciseBookmarkCollections,
    };

    return db;
  } catch {
    return buildDefaultDB();
  }
};

export const saveDB = (db: DB): void => {
  writeLocalStorage(STORAGE_KEY, JSON.stringify(db));
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

export const loadAnimationsDisabled = (): boolean => {
  const value = readLocalStorage(ANIMATION_PREFERENCE_KEY);
  return value === '1' || value === 'true';
};

export const saveAnimationsDisabled = (disabled: boolean): void => {
  if (disabled) {
    writeLocalStorage(ANIMATION_PREFERENCE_KEY, '1');
  } else {
    removeLocalStorage(ANIMATION_PREFERENCE_KEY);
  }
};

const detectBrowserLanguage = (fallback: Locale = fallbackLocale): Locale => {
  if (!isBrowser) {
    return fallback;
  }

  const languages =
    window.navigator.languages && window.navigator.languages.length > 0
      ? window.navigator.languages
      : [window.navigator.language];

  return languages.some((lang) => lang?.toLowerCase().startsWith('de')) ? 'de' : fallback;
};

export const loadStoredLocale = (): Locale | null => {
  const localStorageValue = readLocalStorage(LOCALE_KEY);
  if (localStorageValue === 'en' || localStorageValue === 'de') {
    return localStorageValue;
  }

  const cookieValue = readCookie(LOCALE_KEY);
  return cookieValue === 'en' || cookieValue === 'de' ? cookieValue : null;
};

export const loadLocale = (fallback: Locale = fallbackLocale): Locale => {
  const value = loadStoredLocale();

  // If no saved preference exists, auto-detect from browser/system language.
  if (value === null) {
    return detectBrowserLanguage(fallback);
  }

  return value === 'en' || value === 'de' ? value : fallbackLocale;
};

export const saveLocale = (locale: Locale): void => {
  writeLocalStorage(LOCALE_KEY, locale);
  writeCookie(LOCALE_KEY, locale);
};

export const exportDB = (db: DB): string => {
  // Extract bookmarked technique IDs from progress
  const bookmarkedTechniqueIds = db.progress.filter((p) => p.bookmarked).map((p) => p.techniqueId);

  // Extract bookmarked glossary term IDs from glossary progress
  const bookmarkedGlossaryTermIds = db.glossaryProgress
    .filter((p) => p.bookmarked)
    .map((p) => p.termId);

  // Extract bookmarked exercise IDs from exercise progress
  const bookmarkedExerciseIds = db.exerciseProgress
    .filter((p) => p.bookmarked)
    .map((p) => p.exerciseId);

  // Create collection name mapping
  const collectionIdToName = new Map(db.collections.map((c) => [c.id, c.name]));

  // Export collections by name only
  const exportCollections = db.collections.map(({ name, icon, itemIds }) => ({
    name,
    icon,
    itemIds,
  }));

  // Export bookmark collections using collection names instead of IDs
  const exportBookmarkCollections = db.bookmarkCollections
    .map(({ techniqueId, collectionId }) => {
      const collectionName = collectionIdToName.get(collectionId);
      if (!collectionName) return null; // Skip if collection not found
      return {
        techniqueId,
        collectionName,
      };
    })
    .filter((entry): entry is { techniqueId: string; collectionName: string } => Boolean(entry));

  // Export glossary bookmark collections using collection names instead of IDs
  const exportGlossaryBookmarkCollections = db.glossaryBookmarkCollections
    .map(({ termId, collectionId }) => {
      const collectionName = collectionIdToName.get(collectionId);
      if (!collectionName) return null; // Skip if collection not found
      return {
        termId,
        collectionName,
      };
    })
    .filter((entry): entry is { termId: string; collectionName: string } => Boolean(entry));

  // Export exercise bookmark collections using collection names instead of IDs
  const exportExerciseBookmarkCollections = db.exerciseBookmarkCollections
    .map(({ exerciseId, collectionId }) => {
      const collectionName = collectionIdToName.get(collectionId);
      if (!collectionName) return null; // Skip if collection not found
      return {
        exerciseId,
        collectionName,
      };
    })
    .filter((entry): entry is { exerciseId: string; collectionName: string } => Boolean(entry));

  return JSON.stringify(
    {
      appName: APP_NAME,
      bookmarks: bookmarkedTechniqueIds,
      glossaryBookmarks: bookmarkedGlossaryTermIds,
      exerciseBookmarks: bookmarkedExerciseIds,
      collections: exportCollections,
      bookmarkCollections: exportBookmarkCollections,
      glossaryBookmarkCollections: exportGlossaryBookmarkCollections,
      exerciseBookmarkCollections: exportExerciseBookmarkCollections,
      animationsDisabled: loadAnimationsDisabled(),
    },
    null,
    2,
  );
};

export const parseIncomingDB = (
  raw: string,
): {
  bookmarks?: string[];
  glossaryBookmarks?: string[];
  exerciseBookmarks?: string[];
  collections?: Array<{ name: string; icon?: string | null; itemIds?: string[] }>;
  bookmarkCollections?: Array<{ techniqueId: string; collectionName: string }>;
  glossaryBookmarkCollections?: Array<{ termId: string; collectionName: string }>;
  exerciseBookmarkCollections?: Array<{ exerciseId: string; collectionName: string }>;
  animationsDisabled?: boolean;
} => {
  const parsed = JSON.parse(raw) as {
    appName?: string;
    bookmarks?: string[];
    glossaryBookmarks?: string[];
    exerciseBookmarks?: string[];
    collections?: Array<{ name: string; icon?: string | null; itemIds?: string[] }>;
    bookmarkCollections?: Array<{ techniqueId: string; collectionName: string }>;
    glossaryBookmarkCollections?: Array<{ termId: string; collectionName: string }>;
    exerciseBookmarkCollections?: Array<{ exerciseId: string; collectionName: string }>;
    animationsDisabled?: boolean;
  };

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON payload');
  }

  if (parsed.appName !== APP_NAME) {
    throw new Error('Not an Enso export file');
  }

  return {
    bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
    glossaryBookmarks: Array.isArray(parsed.glossaryBookmarks) ? parsed.glossaryBookmarks : [],
    exerciseBookmarks: Array.isArray(parsed.exerciseBookmarks) ? parsed.exerciseBookmarks : [],
    collections: Array.isArray(parsed.collections) ? parsed.collections : [],
    bookmarkCollections: Array.isArray(parsed.bookmarkCollections)
      ? parsed.bookmarkCollections
      : [],
    glossaryBookmarkCollections: Array.isArray(parsed.glossaryBookmarkCollections)
      ? parsed.glossaryBookmarkCollections
      : [],
    exerciseBookmarkCollections: Array.isArray(parsed.exerciseBookmarkCollections)
      ? parsed.exerciseBookmarkCollections
      : [],
    animationsDisabled:
      typeof parsed.animationsDisabled === 'boolean' ? parsed.animationsDisabled : undefined,
  };
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

export const importData = (currentDB: DB, importedData: ReturnType<typeof parseIncomingDB>): DB => {
  // Update progress with imported bookmarks
  const updatedProgress = currentDB.progress.map((progress) => {
    const isBookmarked = importedData.bookmarks?.includes(progress.techniqueId) || false;
    return {
      ...progress,
      bookmarked: isBookmarked,
      updatedAt: isBookmarked ? Date.now() : progress.updatedAt,
    };
  });

  // Update glossary progress with imported bookmarks
  const importedGlossaryBookmarkIds = new Set(importedData.glossaryBookmarks || []);
  const updatedGlossaryProgress = currentDB.glossaryProgress.map((progress) => {
    const isBookmarked = importedGlossaryBookmarkIds.has(progress.termId);
    return {
      ...progress,
      bookmarked: isBookmarked,
      updatedAt: isBookmarked ? Date.now() : progress.updatedAt,
    };
  });

  // Add new glossary progress entries for newly bookmarked terms that don't exist
  const existingGlossaryTermIds = new Set(currentDB.glossaryProgress.map((p) => p.termId));
  const newGlossaryProgressEntries: GlossaryProgress[] = (importedData.glossaryBookmarks || [])
    .filter((termId) => !existingGlossaryTermIds.has(termId))
    .map((termId) => buildDefaultGlossaryProgress(termId))
    .map((progress) => ({
      ...progress,
      bookmarked: true,
      updatedAt: Date.now(),
    }));

  const finalGlossaryProgress = [...updatedGlossaryProgress, ...newGlossaryProgressEntries];

  // Update exercise progress with imported bookmarks
  const importedExerciseBookmarkIds = new Set(importedData.exerciseBookmarks || []);
  const updatedExerciseProgress = currentDB.exerciseProgress.map((progress) => {
    const isBookmarked = importedExerciseBookmarkIds.has(progress.exerciseId);
    return {
      ...progress,
      bookmarked: isBookmarked,
      updatedAt: isBookmarked ? Date.now() : progress.updatedAt,
    };
  });

  // Add new exercise progress entries for newly bookmarked exercises that don't exist
  const existingExerciseIds = new Set(currentDB.exerciseProgress.map((p) => p.exerciseId));
  const newExerciseProgressEntries: ExerciseProgress[] = (importedData.exerciseBookmarks || [])
    .filter((exerciseId) => !existingExerciseIds.has(exerciseId))
    .map((exerciseId) => buildDefaultExerciseProgress(exerciseId))
    .map((progress) => ({
      ...progress,
      bookmarked: true,
      updatedAt: Date.now(),
    }));

  const finalExerciseProgress = [...updatedExerciseProgress, ...newExerciseProgressEntries];

  // Import collections and regenerate IDs and timestamps
  const now = Date.now();
  const collectionNameToId = new Map<string, string>();

  const importedCollections = ensureCollections(
    (importedData.collections || []).map((collection, index) => {
      const id = generateId();
      collectionNameToId.set(collection.name, id);
      return {
        id,
        name: collection.name,
        icon: collection.icon || null,
        itemIds: sanitizeCollectionItemIds(collection.itemIds),
        sortOrder: index,
        createdAt: now,
        updatedAt: now,
      };
    }),
  );

  // Import bookmark collections using collection name mapping
  const validTechniqueIds = new Set(currentDB.techniques.map((t) => t.id));

  const importedBookmarkCollections: BookmarkCollection[] = (importedData.bookmarkCollections || [])
    .map(({ techniqueId, collectionName }) => {
      const collectionId = collectionNameToId.get(collectionName);
      if (!collectionId || !validTechniqueIds.has(techniqueId)) {
        return null; // Skip invalid entries
      }
      return {
        id: generateId(),
        techniqueId,
        collectionId,
        createdAt: now,
      };
    })
    .filter((entry): entry is BookmarkCollection => Boolean(entry));

  // Import glossary bookmark collections using collection name mapping
  const importedGlossaryBookmarkCollections: GlossaryBookmarkCollection[] = (
    importedData.glossaryBookmarkCollections || []
  )
    .map(({ termId, collectionName }) => {
      const collectionId = collectionNameToId.get(collectionName);
      if (!collectionId) {
        return null; // Skip invalid entries - note: we don't validate termId since glossary terms are loaded separately
      }
      return {
        id: generateId(),
        termId,
        collectionId,
        createdAt: now,
      };
    })
    .filter((entry): entry is GlossaryBookmarkCollection => Boolean(entry));

  const importedExerciseBookmarkCollections: ExerciseBookmarkCollection[] = (
    importedData.exerciseBookmarkCollections || []
  )
    .map(({ exerciseId, collectionName }) => {
      const collectionId = collectionNameToId.get(collectionName);
      if (!collectionId) {
        return null; // Skip invalid entries - note: we don't validate exerciseId since exercises are loaded separately
      }
      return {
        id: generateId(),
        exerciseId,
        collectionId,
        createdAt: now,
      };
    })
    .filter((entry): entry is ExerciseBookmarkCollection => Boolean(entry));

  const normalizedImportedCollections = normalizeCollectionItemOrder(
    importedCollections,
    importedBookmarkCollections,
    importedGlossaryBookmarkCollections,
    importedExerciseBookmarkCollections,
  );

  // Restore preferences if they were included in the export
  if (typeof importedData.animationsDisabled === 'boolean') {
    saveAnimationsDisabled(importedData.animationsDisabled);
  }

  return {
    ...currentDB,
    progress: updatedProgress,
    glossaryProgress: finalGlossaryProgress,
    exerciseProgress: finalExerciseProgress,
    collections: normalizedImportedCollections,
    bookmarkCollections: importedBookmarkCollections,
    glossaryBookmarkCollections: importedGlossaryBookmarkCollections,
    exerciseBookmarkCollections: importedExerciseBookmarkCollections,
  };
};

export const clearDB = (): DB => {
  if (isBrowser) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  removeLocalStorage(HOME_PINNED_BELT_KEY);
  removeLocalStorage(HOME_BELT_PROMPT_DISMISSED_KEY);
  // Reset preferences to defaults (animations OFF)
  saveAnimationsDisabled(false);
  return buildDefaultDB();
};

// Filters persistence helpers
export const loadFilters = <T = unknown>(): T | null => {
  const raw = readLocalStorage(FILTERS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const saveFilters = (filters: unknown): void => {
  try {
    writeLocalStorage(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    /* noop */
  }
};

export const clearFilters = (): void => {
  removeLocalStorage(FILTERS_KEY);
};

// Filter panel pinned state helpers
export const loadFilterPanelPinned = (): boolean => {
  const value = readLocalStorage(FILTER_PANEL_PINNED_KEY);
  return value === '1' || value === 'true';
};

export const saveFilterPanelPinned = (pinned: boolean): void => {
  if (pinned) {
    writeLocalStorage(FILTER_PANEL_PINNED_KEY, '1');
  } else {
    removeLocalStorage(FILTER_PANEL_PINNED_KEY);
  }
};

export const loadPinnedBeltGrade = (): Grade | null => {
  const value = readLocalStorage(HOME_PINNED_BELT_KEY);
  return typeof value === 'string' && value.length > 0 ? (value as Grade) : null;
};

export const savePinnedBeltGrade = (grade: Grade | null): void => {
  if (grade) {
    writeLocalStorage(HOME_PINNED_BELT_KEY, grade);
  } else {
    removeLocalStorage(HOME_PINNED_BELT_KEY);
  }
};

export const loadBeltPromptDismissed = (): boolean => {
  const value = readLocalStorage(HOME_BELT_PROMPT_DISMISSED_KEY);
  return value === '1' || value === 'true';
};

export const saveBeltPromptDismissed = (dismissed: boolean): void => {
  if (dismissed) {
    writeLocalStorage(HOME_BELT_PROMPT_DISMISSED_KEY, '1');
  } else {
    removeLocalStorage(HOME_BELT_PROMPT_DISMISSED_KEY);
  }
};
