import { AnimatePresence, motion } from 'motion/react';
import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import type { Copy } from '../../constants/i18n';
import type { Locale, TechniqueV2 } from '../../types';
import { useFocusTrap } from '../../utils/useFocusTrap';
import { useMotionPreferences } from '../ui/motion';
import { buildSearchIndex, getSearchIndex, search, type SearchHit } from '../../lib/search';
import { useSearchPanelStore } from '../../store/searchPanel';
import { SearchPanelInput } from './SearchPanelInput';
import { SearchPanelList } from './SearchPanelList';

const isFocusableElement = (element: EventTarget | null): boolean => {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }
  const tagName = element.tagName.toLowerCase();
  const editable = element.getAttribute('contenteditable');
  if (editable && editable !== 'false') return true;
  return ['input', 'textarea', 'select', 'button'].includes(tagName);
};

type SearchPanelProps = {
  copy: Copy;
  locale: Locale;
  techniques: TechniqueV2[];
  onNavigate: (slug: string, openInNewTab?: boolean) => void;
};

export const SearchPanel = ({ copy, locale, techniques, onNavigate }: SearchPanelProps): ReactElement | null => {
  const listboxId = useId();
  const labelId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const {
    open,
    query,
    selectedIndex,
    openWithHotkey,
    close,
    setQuery,
    moveSelection,
    setResultCount,
    setSelectedIndex,
  } = useSearchPanelStore();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [indexReady, setIndexReady] = useState(false);
  const { overlayMotion } = useMotionPreferences();

  useFocusTrap(open, panelRef, close);

  // Warm search index when techniques or locale change
  useEffect(() => {
    let cancelled = false;
    const prepareIndex = async () => {
      await buildSearchIndex(techniques, locale);
      if (!cancelled) {
        setIndexReady(true);
      }
    };
    prepareIndex();
    return () => {
      cancelled = true;
    };
  }, [techniques, locale]);

  // Sync query to store
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query]);

  // Perform search when query changes
  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const runSearch = async () => {
      if (!indexReady) {
        return;
      }

      const trimmed = debouncedQuery.trim();
      if (trimmed.length === 0) {
        if (!cancelled) {
          setResults([]);
          setResultCount(0);
        }
        return;
      }

      const existingIndex = getSearchIndex();
      if (!existingIndex || existingIndex.locale !== locale) {
        await buildSearchIndex(techniques, locale);
      }

      const hits = search(trimmed, 50);
      if (!cancelled) {
        setResults(hits);
        setResultCount(hits.length);
      }
    };

    runSearch();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, indexReady, locale, open, techniques, setResultCount]);

  // Reset results when closing
  useEffect(() => {
    if (!open) {
      setResults([]);
    }
  }, [open]);

  // Auto-focus input when opening
  useEffect(() => {
    if (open) {
      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        if (isFocusableElement(event.target)) return;
        event.preventDefault();
        openWithHotkey(undefined, 'hotkey');
        return;
      }

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (isFocusableElement(event.target)) return;
        event.preventDefault();
        openWithHotkey('', 'slash');
        return;
      }

      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown as unknown as EventListener);
    return () => window.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
  }, [open, openWithHotkey, close]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
      return;
    }
    if (event.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        event.preventDefault();
        const openInNewTab = event.metaKey || event.ctrlKey;
        const slug = results[selectedIndex].item.slug;
        onNavigate(slug, openInNewTab);
        if (!openInNewTab) {
          close();
        }
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  const handleSelect = (hit: SearchHit, openInNewTab?: boolean) => {
    onNavigate(hit.item.slug, openInNewTab);
    if (!openInNewTab) {
      close();
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const activeOptionId = useMemo(() => {
    if (selectedIndex < 0 || !results[selectedIndex]) {
      return undefined;
    }
    return `search-panel-option-${results[selectedIndex].item.id}`;
  }, [results, selectedIndex]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <Fragment>
          <motion.div
            className="fixed inset-0 z-[999] bg-black/45 backdrop-blur-sm"
            variants={overlayMotion.backdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlayMotion.transition}
            onClick={() => close()}
          />
          <motion.div
            ref={panelRef}
            className="fixed inset-0 z-[1000] flex items-start justify-center px-4 pt-[15vh]"
            variants={overlayMotion.panel}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={overlayMotion.panelTransition}
            onClick={() => close()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
          >
            <div
              className="w-[640px] max-w-[92vw] rounded-2xl border search-panel-surface p-3 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 id={labelId} className="sr-only">
                {copy.searchBtn}
              </h2>
              <SearchPanelInput
                ref={inputRef}
                value={query}
                placeholder={copy.search}
                label={copy.searchInputLabel}
                clearLabel={copy.searchClearLabel}
                listboxId={listboxId}
                activeOptionId={activeOptionId}
                onChange={handleQueryChange}
                onKeyDown={handleInputKeyDown}
                onClear={() => handleQueryChange('')}
              />
              <div className="mt-3 rounded-2xl border search-panel-surface">
                <SearchPanelList
                  results={results}
                  locale={locale}
                  selectedIndex={selectedIndex}
                  onSelect={handleSelect}
                  onHover={(index) => setSelectedIndex(index)}
                  copy={copy}
                  query={query}
                  listboxId={listboxId}
                />
              </div>
              <div className="mt-2 px-3 pb-1 pt-2 text-xs text-subtle">
                {copy.searchFooterHint}
              </div>
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>,
    document.body,
  );
};
