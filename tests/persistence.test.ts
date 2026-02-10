import { afterEach, describe, expect, it, vi } from 'vitest';
import techniquesData from '../src/generated/content/techniques.json';
import { loadDB } from '../src/shared/services/storageService';
import { LOCALE_KEY, STORAGE_KEY } from '../src/shared/constants/storage';

type StorageStub = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const createStorage = (seed: Record<string, string> = {}): StorageStub => {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
};

const setMockWindow = (seed: Record<string, string> = {}) => {
  vi.stubGlobal('window', {
    localStorage: createStorage(seed),
    navigator: {
      language: 'de-DE',
      languages: ['de-DE', 'en-US'],
    },
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('local-first persistence defaults', () => {
  it('keeps default DB seeded from generated techniques', () => {
    const db = loadDB();

    expect(db.techniques.length).toBe(techniquesData.length);
    expect(db.progress.length).toBe(techniquesData.length);
    expect(db.collections).toEqual([]);
    expect(db.studyStatus).toEqual({});
  });

  it('auto-detects German locale when browser language is German', async () => {
    setMockWindow();
    const { loadLocale } = await import('../src/shared/services/storageService');
    expect(loadLocale()).toBe('de');
  });

  it('uses saved locale when explicitly stored', async () => {
    setMockWindow({ [LOCALE_KEY]: 'de' });
    const { loadLocale } = await import('../src/shared/services/storageService');
    expect(loadLocale()).toBe('de');
  });

  it('reads locale from cookie when localStorage is empty', async () => {
    setMockWindow();
    vi.stubGlobal('document', { cookie: `${LOCALE_KEY}=de` });
    const { loadStoredLocale } = await import('../src/shared/services/storageService');
    expect(loadStoredLocale()).toBe('de');
  });

  it('restores and normalizes collection itemIds order from stored DB', async () => {
    const techniqueId = techniquesData[0]?.id as string;
    setMockWindow({
      [STORAGE_KEY]: JSON.stringify({
        version: 6,
        techniques: [],
        progress: [{ techniqueId, bookmarked: true, updatedAt: 1 }],
        glossaryProgress: [{ termId: 'term-a', bookmarked: true, updatedAt: 1 }],
        exerciseProgress: [{ exerciseId: 'exercise-a', bookmarked: true, updatedAt: 1 }],
        collections: [
          {
            id: 'collection-1',
            name: 'Collection',
            icon: null,
            itemIds: [`technique:${techniqueId}`, `technique:${techniqueId}`, 'unknown-item'],
            sortOrder: 0,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        bookmarkCollections: [
          { id: 'bc-1', techniqueId, collectionId: 'collection-1', createdAt: 10 },
        ],
        glossaryBookmarkCollections: [
          { id: 'gc-1', termId: 'term-a', collectionId: 'collection-1', createdAt: 20 },
        ],
        exerciseBookmarkCollections: [
          { id: 'ec-1', exerciseId: 'exercise-a', collectionId: 'collection-1', createdAt: 30 },
        ],
        studyStatus: {
          [`technique:${techniquesData[0]?.slug}`]: { status: 'practice', updatedAt: 123 },
          bad: { status: 'practice', updatedAt: 1 },
        },
      }),
    });

    const { loadDB: loadStoredDB } = await import('../src/shared/services/storageService');
    const db = loadStoredDB();

    expect(db.collections[0]?.itemIds).toEqual([
      `technique:${techniqueId}`,
      'glossary:term-a',
      'exercise:exercise-a',
    ]);
    expect(db.studyStatus[`technique:${techniquesData[0]?.slug}`]?.status).toBe('practice');
    expect(db.studyStatus.bad).toBeUndefined();
  });
});
