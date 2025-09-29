import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Technique } from '../../types';
import { EmphasizedName } from '../common';
import { SearchIcon } from '../common/icons';
import { useFocusTrap } from '../../utils/useFocusTrap';
import { buildSearchIndex, matchSearch, normalizeSearchQuery } from '../../search/indexer';
import { useMotionPreferences, defaultEase } from '../ui/motion';

type SearchOverlayProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  onClose: () => void;
  onOpen: (slug: string) => void;
};

export const SearchOverlay = ({ copy, locale, techniques, onClose, onOpen }: SearchOverlayProps): ReactElement => {
  const [query, setQuery] = useState('');
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
        <div className="relative">
          <div className="p-3 flex items-center gap-2 surface rounded-2xl border surface-border shadow-xl">
            <span className="text-muted" aria-hidden>
              <SearchIcon className="w-4 h-4" />
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
              className="w-full bg-transparent focus:outline-none"
            />
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1.5 p-2 text-lg text-subtle hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded-lg"
            variants={overlayMotion.closeButton}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.15, ease: defaultEase }}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            <span className="sr-only">Close</span>
          </motion.button>
        </div>
        <ul className="mt-2 max-h-80 overflow-auto surface rounded-2xl border surface-border shadow-xl">
          {results.map((technique) => (
            <li key={technique.id}>
              <motion.button
                type="button"
                onClick={() => {
                  onOpen(technique.slug);
                }}
                className="w-full text-left px-3 py-2 surface-hover focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                whileHover={prefersReducedMotion ? undefined : { y: -1 }}
                transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.2, ease: defaultEase }}
                title={technique.name[locale]}
              >
                <div className="font-medium">
                  <EmphasizedName name={technique.name[locale]} />
                </div>
                <div className="text-[10px] text-subtle">{technique.jp}</div>
              </motion.button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-6 text-sm text-muted">No results</li>}
        </ul>
      </motion.div>
    </motion.div>
  );
};
