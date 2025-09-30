import { useEffect, useMemo, useRef, useState, type ReactElement, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type { Locale, Technique } from '../../../shared/types';
import { EmphasizedName } from '../../../shared/components';
import { SearchIcon } from '../../../shared/components/ui/icons';
import { useFocusTrap } from '../../../shared/hooks/useFocusTrap';
import { buildSearchIndex, matchSearch, normalizeSearchQuery } from '../indexer';
import { useMotionPreferences } from '../../../components/ui/motion';

type SearchOverlayProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  onClose: () => void;
  onOpen: (slug: string) => void;
};

export const SearchOverlay = ({ copy, locale, techniques, onClose, onOpen }: SearchOverlayProps): ReactElement => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const {
    overlayMotion,
    prefersReducedMotion,
  } = useMotionPreferences();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useFocusTrap(true, dialogRef, onClose);

  const index = useMemo(() => buildSearchIndex(techniques), [techniques]);

  const normalizedQuery = useMemo(() => normalizeSearchQuery(query), [query]);

  const results = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return techniques.slice(0, 25);
    }

    return index.filter((entry) => matchSearch(entry.haystack, normalizedQuery)).map((entry) => entry.technique);
  }, [index, normalizedQuery, techniques]);

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
        onOpen(results[selectedIndex].slug);
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
              results.map((technique, index) => (
                <button
                  key={technique.id}
                  type="button"
                  onClick={(event) => {
                    const openInNewTab = event.metaKey || event.ctrlKey;
                    onOpen(technique.slug);
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
                  title={technique.name[locale]}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                      <EmphasizedName name={technique.name[locale]} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
                      {technique.jp && (
                        <span className="font-medium uppercase tracking-wide text-[0.65rem]">
                          {technique.jp}
                        </span>
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
