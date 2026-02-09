import { afterEach, describe, expect, it, vi } from 'vitest';
import techniquesData from '../src/generated/content/techniques.json';
import { loadDB } from '../src/shared/services/storageService';
import { LOCALE_KEY } from '../src/shared/constants/storage';

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
});
