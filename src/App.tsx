import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/layout/Header';
import { FilterPanel } from './components/filters/FilterPanel';
import { Library } from './components/library/Library';
import { ProgressLists } from './components/progress/ProgressLists';
import { SearchOverlay } from './components/overlay/SearchOverlay';
import { SettingsModal } from './components/settings/SettingsModal';
import { TechniquePage } from './components/technique/TechniquePage';
import { getCopy } from './constants/i18n';
import {
  clearThemePreference,
  hasStoredTheme,
  loadDB,
  loadLocale,
  loadTheme,
  saveDB,
  saveLocale,
  saveTheme,
} from './services/storageService';
import type { AppTab, DB, Filters, Locale, Progress, Technique, Theme } from './types';
import { gradeOrder } from './utils/grades';
import { unique, upsert } from './utils/array';

const defaultFilters: Filters = {};

const getSlugFromPath = (pathname: string): string | null => {
  const match = /^\/technique\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const isEditableElement = (element: EventTarget | null): boolean => {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const tag = element.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || element.isContentEditable || tag === 'select';
};

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function updateProgressEntry(progress: Progress[], id: string, patch: Partial<Progress>): Progress[] {
  const existing = progress.find((entry) => entry.techniqueId === id);
  const timestamp = Date.now();
  const baseline: Progress = existing ?? {
    techniqueId: id,
    focus: false,
    notNow: false,
    confident: false,
    personalNote: '',
    updatedAt: timestamp,
  };

  const nextEntry: Progress = {
    ...baseline,
    ...patch,
    techniqueId: id,
    updatedAt: timestamp,
  };

  return upsert(progress, (entry) => entry.techniqueId === id, nextEntry);
}

const getSelectableValues = (techniques: Technique[], selector: (technique: Technique) => string | undefined): string[] =>
  unique(
    techniques
      .map(selector)
      .filter((value): value is string => Boolean(value && value.trim().length > 0))
      .sort(),
  );

function applyFilters(techniques: Technique[], filters: Filters): Technique[] {
  return techniques.filter((technique) => {
    if (filters.category && technique.category !== filters.category) return false;
    if (filters.attack && technique.attack !== filters.attack) return false;
    if (filters.stance && technique.stance !== filters.stance) return false;
    if (filters.weapon && technique.weapon !== filters.weapon) return false;
    if (filters.level && technique.level !== filters.level) return false;
    return true;
  });
}

function useKeyboardShortcuts(onSearch: () => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (isEditableElement(event.target)) {
        if ((event.metaKey || event.ctrlKey) && key === 'k') {
          event.preventDefault();
          onSearch();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        onSearch();
      } else if (key === '/') {
        event.preventDefault();
        onSearch();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSearch]);
}

export default function App(): JSX.Element {
  const [locale, setLocale] = useState<Locale>(() => loadLocale());
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  const [hasManualTheme, setHasManualTheme] = useState<boolean>(() => hasStoredTheme());
  const [db, setDB] = useState<DB>(() => loadDB());
  const [tab, setTab] = useState<AppTab>('library');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [activeSlug, setActiveSlug] = useState<string | null>(
    () => (typeof window === 'undefined' ? null : getSlugFromPath(window.location.pathname))
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const copy = getCopy(locale);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (hasManualTheme) {
      saveTheme(theme);
    } else {
      clearThemePreference();
    }
  }, [hasManualTheme, theme]);

  useEffect(() => {
    saveLocale(locale);
  }, [locale]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromLocation = () => {
      setActiveSlug(getSlugFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  useKeyboardShortcuts(() => setSearchOpen(true));

  useEffect(() => {
    if (hasManualTheme || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      setTheme(media.matches ? 'dark' : 'light');
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [hasManualTheme]);

  const categories = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.category),
    [db.techniques],
  );
  const attacks = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.attack),
    [db.techniques],
  );
  const stances = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.stance),
    [db.techniques],
  );
  const weapons = useMemo(
    () => getSelectableValues(db.techniques, (technique) => technique.weapon),
    [db.techniques],
  );

  const filteredTechniques = useMemo(
    () => applyFilters(db.techniques, filters),
    [db.techniques, filters],
  );

  const currentTechnique = useMemo(
    () => (activeSlug ? db.techniques.find((technique) => technique.slug === activeSlug) ?? null : null),
    [db.techniques, activeSlug],
  );

  const currentProgress = useMemo(
    () => (currentTechnique ? db.progress.find((entry) => entry.techniqueId === currentTechnique.id) ?? null : null),
    [db.progress, currentTechnique],
  );

  const updateProgress = (id: string, patch: Partial<Progress>): void => {
    setDB((prev) => ({
      ...prev,
      progress: updateProgressEntry(prev.progress, id, patch),
    }));
  };

  const handleLocaleChange = (next: Locale): void => {
    setLocale(next);
  };

  const handleThemeChange = (next: Theme | 'system'): void => {
    if (next === 'system') {
      setHasManualTheme(false);
      setTheme(getSystemTheme());
      return;
    }

    setHasManualTheme(true);
    setTheme(next);
  };

  const handleDBChange = (next: DB): void => {
    setDB(next);
  };

  const openTechnique = (slug: string): void => {
    if (!db.techniques.some((technique) => technique.slug === slug)) {
      return;
    }

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (getSlugFromPath(currentPath) !== slug) {
        window.history.pushState({ slug }, '', `/technique/${encodeURIComponent(slug)}`);
      }
    }

    setActiveSlug(slug);
  };

  const closeTechnique = (): void => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
    setActiveSlug(null);
  };

  const toggleFocus = (technique: Technique, entry: Progress | null): void => {
    const nextFocus = !entry?.focus;
    updateProgress(technique.id, {
      focus: nextFocus,
      confident: nextFocus ? false : entry?.confident ?? false,
    });
  };

  const toggleConfident = (technique: Technique, entry: Progress | null): void => {
    const nextConfident = !entry?.confident;
    updateProgress(technique.id, {
      confident: nextConfident,
      focus: nextConfident ? false : entry?.focus ?? false,
    });
  };

  const techniqueNotFound = Boolean(activeSlug) && !currentTechnique;

  return (
    <div className="min-h-screen app-bg">
      <Header
        copy={copy}
        tab={tab}
        onChangeTab={setTab}
        onSearch={() => setSearchOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      {currentTechnique ? (
        <TechniquePage
          technique={currentTechnique}
          progress={currentProgress ?? null}
          copy={copy}
          locale={locale}
          onBack={closeTechnique}
          onToggleFocus={() => toggleFocus(currentTechnique, currentProgress ?? null)}
          onToggleConfident={() => toggleConfident(currentTechnique, currentProgress ?? null)}
        />
      ) : techniqueNotFound ? (
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-4 text-center">
          <p className="text-lg font-semibold">Technique not found.</p>
          <button
            type="button"
            onClick={closeTechnique}
            className="text-sm underline"
          >
            Back to Library
          </button>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="grid md:grid-cols-[16rem,1fr] gap-6">
            <aside className="surface border surface-border rounded-2xl p-3 h-max sticky top-20">
              <FilterPanel
                copy={copy}
                locale={locale}
                filters={filters}
                categories={categories}
                attacks={attacks}
                stances={stances}
                weapons={weapons}
                levels={gradeOrder}
                onChange={setFilters}
              />
            </aside>
            <main>
              {tab === 'library' && (
                <Library
                  copy={copy}
                  locale={locale}
                  techniques={filteredTechniques}
                  progress={db.progress}
                  onOpen={openTechnique}
                />
              )}
              {tab === 'progress' && (
                <ProgressLists
                  copy={copy}
                  locale={locale}
                  techniques={filteredTechniques}
                  progress={db.progress}
                  onOpen={openTechnique}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {searchOpen && (
        <SearchOverlay
          copy={copy}
          locale={locale}
          techniques={db.techniques}
          onClose={() => setSearchOpen(false)}
          onOpen={(slug) => {
            openTechnique(slug);
            setSearchOpen(false);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          copy={copy}
          locale={locale}
          theme={theme}
          isSystemTheme={!hasManualTheme}
          db={db}
          onClose={() => setSettingsOpen(false)}
          onChangeLocale={handleLocaleChange}
          onChangeTheme={handleThemeChange}
          onChangeDB={handleDBChange}
        />
      )}
    </div>
  );
}
