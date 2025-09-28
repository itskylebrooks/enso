import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Technique } from '../../types';
import { gradeLabel } from '../../utils/grades';
import { EmphasizedName } from '../common';
import { SearchIcon } from '../common/icons';
import { useFocusTrap } from '../../utils/useFocusTrap';

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useFocusTrap(true, dialogRef, onClose);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) {
      return techniques.slice(0, 25);
    }

    return techniques.filter((technique) => {
      const haystack = [
        technique.name.en,
        technique.name.de,
        technique.jp ?? '',
        technique.attack ?? '',
        technique.stance ?? '',
        technique.weapon ?? '',
        gradeLabel(technique.level, 'en'),
        gradeLabel(technique.level, 'de'),
        ...(technique.tags ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [query, techniques]);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center pt-[10vh]" onClick={onClose}>
      <div
        ref={dialogRef}
        className="w-full max-w-xl surface rounded-2xl border surface-border shadow-xl overflow-hidden relative"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
      >
        <h2 id="search-title" className="sr-only">
          {copy.searchBtn}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-lg text-subtle hover:text-[var(--color-text)] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          aria-label="Close"
        >
          <span aria-hidden>&times;</span>
          <span className="sr-only">Close</span>
        </button>
        <div className="p-3 border-b surface-border flex items-center gap-2">
          <span className="text-muted" aria-hidden>
            <SearchIcon className="w-4 h-4" />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.search}
            className="w-full px-2 py-1.5 rounded-lg border surface surface-border focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]"
          />
        </div>
        <ul className="max-h-80 overflow-auto">
          {results.map((technique) => (
            <li key={technique.id}>
              <button
                type="button"
                onClick={() => {
                  onOpen(technique.slug);
                }}
                className="w-full text-left px-3 py-2 transition-colors surface-hover"
              >
                <div className="font-medium">
                  <EmphasizedName name={technique.name[locale]} />
                </div>
                <div className="text-[10px] text-subtle">{technique.jp}</div>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-6 text-sm text-muted">No results</li>}
        </ul>
      </div>
    </div>
  );
};
