import { useEffect, useMemo, useRef, useState, type ReactElement, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type { Locale, Technique, GlossaryTerm } from '../../../shared/types';
import { EmphasizedName } from '../../../shared/components';
import { SearchIcon } from '../../../shared/components/ui/icons';
import { useFocusTrap } from '../../../shared/hooks/useFocusTrap';
import { buildSearchIndex, buildGlossarySearchIndex, matchSearch, normalizeSearchQuery } from '../indexer';
import { useMotionPreferences } from '../../../components/ui/motion';
import { loadAllTerms } from '../../glossary/loader';

type SearchResult = 
  | { type: 'technique'; item: Technique }
  | { type: 'glossary'; item: GlossaryTerm };

type SearchOverlayProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  onClose: () => void;
  onOpen: (slug: string) => void;
  onOpenGlossary: (slug: string) => void;
};

export const SearchOverlay = ({ copy, locale, techniques, onClose, onOpen, onOpenGlossary }: SearchOverlayProps): ReactElement => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const {
    overlayMotion,
    prefersReducedMotion,
  } = useMotionPreferences();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Load glossary terms when overlay opens
    loadAllTerms().then(setGlossaryTerms);
  }, []);

  useFocusTrap(true, dialogRef, onClose);

  const techniqueIndex = useMemo(() => buildSearchIndex(techniques), [techniques]);
  const glossaryIndex = useMemo(() => buildGlossarySearchIndex(glossaryTerms), [glossaryTerms]);

  const normalizedQuery = useMemo(() => normalizeSearchQuery(query), [query]);

  const results = useMemo((): SearchResult[] => {
    if (normalizedQuery.length === 0) {
      // Show mixed results when no query: recent techniques + some glossary terms
      const recentTechniques: SearchResult[] = techniques.slice(0, 15).map(item => ({ type: 'technique', item }));
      const someGlossaryTerms: SearchResult[] = glossaryTerms.slice(0, 10).map(item => ({ type: 'glossary', item }));
      return [...recentTechniques, ...someGlossaryTerms];
    }

    // Search both techniques and glossary terms
    const techniqueResults: SearchResult[] = techniqueIndex
      .filter((entry) => matchSearch(entry.haystack, normalizedQuery))
      .map((entry) => ({ type: 'technique', item: entry.technique }));
    
    const glossaryResults: SearchResult[] = glossaryIndex
      .filter((entry) => matchSearch(entry.haystack, normalizedQuery))
      .map((entry) => ({ type: 'glossary', item: entry.term }));

    // Combine and limit results, prioritizing techniques
    return [...techniqueResults.slice(0, 20), ...glossaryResults.slice(0, 10)];
  }, [techniqueIndex, glossaryIndex, normalizedQuery, techniques, glossaryTerms]);

  // Reset selection when results change
  useEffect(() => {
    if (results.length === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= results.length || selectedIndex === -1) {
      setSelectedIndex(0);
    }
  }, [results, selectedIndex]);

  // Keyboard navigation handlers
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % results.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        const result = results[selectedIndex];
        if (result.type === 'technique') {
          onOpen(result.item.slug);
        } else {
          onOpenGlossary(result.item.slug);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-start justify-center pt-[15vh] px-4 bg-black/45"
      variants={overlayMotion.backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={overlayMotion.transition}
      onClick={onClose}
      style={{ backdropFilter: prefersReducedMotion ? 'blur(8px)' : undefined }}
    >
      <motion.div
        ref={dialogRef}
        className="relative w-full max-w-xl"
        variants={overlayMotion.panel}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={overlayMotion.panelTransition}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
      >
        <h2 id="search-title" className="sr-only">
          {copy.searchBtn}
        </h2>
        <div className="w-[640px] max-w-[92vw] rounded-2xl border surface surface-border p-3 shadow-xl">
          <div className="relative">
            <div className="relative flex items-center pl-3 pr-12 py-2">
              <span className="text-muted" aria-hidden>
                <SearchIcon className="h-4 w-4" />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={copy.search}
                autoComplete="off"
                spellCheck={false}
                className="ml-2 h-10 flex-1 bg-transparent text-base text-[color:var(--color-text)] placeholder:text-subtle focus:outline-none"
              />
            </div>
            <motion.button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-lg text-subtle hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded-lg"
              transition={{ duration: 0.15 }}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span className="sr-only">Close</span>
            </motion.button>
          </div>
          <div className="border-t surface-border mt-2 pt-3">
          <div className="max-h-[60vh] overflow-y-auto">
            {results.length > 0 ? (
              results.map((result, index) => (
                <button
                  key={result.type === 'technique' ? result.item.id : result.item.id}
                  type="button"
                  onClick={(event) => {
                    const openInNewTab = event.metaKey || event.ctrlKey;
                    if (result.type === 'technique') {
                      onOpen(result.item.slug);
                    } else {
                      onOpenGlossary(result.item.slug);
                    }
                    if (!openInNewTab) {
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`relative flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition-soft ${
                    index === selectedIndex 
                      ? 'bg-black/5 dark:bg-white/5' 
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-text)]`}
                  title={result.type === 'technique' ? result.item.name[locale] : result.item.romaji}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                      {result.type === 'technique' ? (
                        <EmphasizedName name={result.item.name[locale]} />
                      ) : (
                        result.item.romaji
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                      {result.type === 'technique' ? (
                        result.item.jp && (
                          <span className="font-medium uppercase tracking-wide text-[0.65rem]">
                            {result.item.jp}
                          </span>
                        )
                      ) : (
                        <>
                          {result.item.jp && (
                            <span className="font-medium uppercase tracking-wide text-[0.65rem]">
                              {result.item.jp}
                            </span>
                          )}
                          <span className="text-[0.65rem] font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                            GLOSSARY
                          </span>
                          <span className="text-[0.65rem] font-medium text-subtle truncate">
                            {result.item.def[locale] || result.item.def.en}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-sm text-subtle">
                {query.trim().length === 0 ? 'Start typing to search...' : 'No results'}
              </div>
            )}
          </div>
          </div>
          <div className="mt-2 px-3 pb-1 pt-2 text-xs text-subtle text-center">
            Use ↑↓ to navigate • Enter to select • Esc to close
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
