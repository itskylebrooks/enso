import { memo, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { FixedSizeList } from 'react-window';
import type { Copy } from '../../constants/i18n';
import type { Grade, Locale } from '../../types';
import { gradeLabel, getGradeStyle } from '../../styles/belts';
import { getTaxonomyLabel } from '../../i18n/taxonomy';
import type { SearchHit } from '../../lib/search';
import { classNames } from '../../utils/classNames';

const HIGHLIGHT_CLASS = 'bg-transparent text-emerald-400 dark:text-emerald-300';
const ROW_HEIGHT = 64;
const MAX_VISIBLE_ROWS = 8;

const useViewportHeight = (): number => {
  const [height, setHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 720));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return height;
};

const highlightText = (
  value: string | undefined,
  matches: SearchHit['matches'],
  keys: string[],
): ReactElement | string => {
  if (!value) return '';
  if (!matches || matches.length === 0) {
    return value;
  }

  const match = matches.find((entry) => entry.key && keys.includes(entry.key as string));
  if (!match || !match.indices || match.indices.length === 0) {
    return value;
  }

  const segments: Array<string | ReactElement> = [];
  let lastIndex = 0;
  for (const [start, end] of match.indices) {
    if (start > lastIndex) {
      segments.push(value.slice(lastIndex, start));
    }
    segments.push(
      <mark key={`${start}-${end}`} className={HIGHLIGHT_CLASS}>
        {value.slice(start, end + 1)}
      </mark>,
    );
    lastIndex = end + 1;
  }

  if (lastIndex < value.length) {
    segments.push(value.slice(lastIndex));
  }

  return <>{segments}</>;
};

type SpotlightResultItemProps = {
  hit: SearchHit;
  index: number;
  locale: Locale;
  active: boolean;
  onSelect: (hit: SearchHit, openInNewTab?: boolean) => void;
  onHover: (index: number) => void;
  buttonRef?: (element: HTMLButtonElement | null) => void;
};

const SpotlightResultItem = memo(
  ({ hit, index, locale, active, onSelect, onHover, buttonRef }: SpotlightResultItemProps): ReactElement => {
    const { item, matches } = hit;
    const primaryNameKey = locale === 'de' ? 'name_de' : 'name_en';
    const secondaryNameKey = locale === 'de' ? 'name_en' : 'name_de';
    const localizedCategory = item.category ? getTaxonomyLabel(locale, 'category', item.category) : undefined;
    const localizedStance = item.stance ? getTaxonomyLabel(locale, 'stance', item.stance) : undefined;
    const grade = item.level as Grade | undefined;
    const gradeLabelValue = grade ? gradeLabel(grade, locale) : undefined;
    const gradeStyle = grade ? getGradeStyle(grade) : undefined;

    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          const openInNewTab = event.metaKey || event.ctrlKey;
          onSelect(hit, openInNewTab);
        }}
        onMouseEnter={() => onHover(index)}
        className={classNames(
          'relative flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition-soft',
          active ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-text)]',
          active && 'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-emerald-400',
        )}
        role="option"
        aria-selected={active}
        id={`spotlight-option-${item.id}`}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
            {highlightText(item[primaryNameKey as keyof typeof item], matches, [primaryNameKey, secondaryNameKey])}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtle">
            {item.jp && (
              <span className="font-medium uppercase tracking-wide text-[0.65rem]">
                {highlightText(item.jp, matches, ['jp'])}
              </span>
            )}
            {(localizedCategory || localizedStance || item.attack) && (
              <span className="rounded-full border surface-border px-2 py-[2px] text-[0.65rem] text-subtle">
                {highlightText(localizedCategory ?? localizedStance ?? item.attack ?? '', matches, [
                  'category',
                  'stance',
                  'attack',
                ])}
              </span>
            )}
          </div>
        </div>
        {grade && gradeLabelValue && gradeStyle && (
          <span
            className="shrink-0 rounded-full px-2 py-[2px] text-[0.65rem] font-semibold"
            style={gradeStyle}
          >
            {gradeLabelValue}
          </span>
        )}
      </button>
    );
  },
);

SpotlightResultItem.displayName = 'SpotlightResultItem';

type SpotlightListProps = {
  results: SearchHit[];
  locale: Locale;
  selectedIndex: number;
  onSelect: (hit: SearchHit, openInNewTab?: boolean) => void;
  onHover: (index: number) => void;
  copy: Copy;
  query: string;
  listboxId: string;
};

export const SpotlightList = ({
  results,
  locale,
  selectedIndex,
  onSelect,
  onHover,
  copy,
  query,
  listboxId,
}: SpotlightListProps): ReactElement => {
  const activeItemRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<FixedSizeList<SearchHit> | null>(null);
  const useVirtualization = results.length > 150;
  const viewportHeight = useViewportHeight();
  const listHeight = useMemo(() => {
    const maxByViewport = Math.floor((viewportHeight * 0.6) / ROW_HEIGHT);
    const visibleRows = Math.min(MAX_VISIBLE_ROWS, Math.max(6, maxByViewport));
    const clampedRows = Math.min(results.length, visibleRows);
    return Math.max(clampedRows * ROW_HEIGHT, ROW_HEIGHT * Math.min(results.length, 3));
  }, [results.length, viewportHeight]);

  useEffect(() => {
    if (!useVirtualization) {
      activeItemRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, useVirtualization]);

  useEffect(() => {
    if (useVirtualization && listRef.current && selectedIndex >= 0) {
      listRef.current.scrollToItem(selectedIndex, 'smart');
    }
  }, [selectedIndex, useVirtualization]);

  const renderEmptyState = () => (
    <div className="px-3 py-6 text-sm text-subtle">
      {query.trim().length === 0 ? copy.searchEmptyState : copy.searchEmptyResults}
    </div>
  );

  if (results.length === 0) {
    return renderEmptyState();
  }

  if (!useVirtualization) {
    return (
      <div
        role="listbox"
        aria-label={copy.searchBtn}
        className="max-h-[60vh] overflow-y-auto pr-1"
        id={listboxId}
      >
        {results.map((hit, index) => (
          <div key={hit.item.id} className="px-1">
            <SpotlightResultItem
              hit={hit}
              index={index}
              locale={locale}
              active={index === selectedIndex}
              onSelect={onSelect}
              onHover={onHover}
              buttonRef={index === selectedIndex ? (element) => {
                activeItemRef.current = element;
              } : undefined}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role="listbox" aria-label={copy.searchBtn} id={listboxId}>
      <FixedSizeList
        ref={listRef}
        height={listHeight}
        width="100%"
        itemCount={results.length}
        itemSize={ROW_HEIGHT}
        itemData={results}
      >
        {({ index, style, data }) => (
          <div style={style} key={data[index].item.id} className="px-1">
            <SpotlightResultItem
              hit={data[index]}
              index={index}
              locale={locale}
              active={index === selectedIndex}
              onSelect={onSelect}
              onHover={onHover}
              buttonRef={index === selectedIndex ? (element) => {
                if (element) {
                  element.scrollIntoView({ block: 'nearest' });
                }
              } : undefined}
            />
          </div>
        )}
      </FixedSizeList>
    </div>
  );
};
