import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type KeyboardEvent,
} from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type {
  Exercise,
  Locale,
  Technique,
  GlossaryTerm,
  Progress,
  GlossaryProgress,
  ExerciseProgress,
} from '../../../shared/types';
import { EmphasizedName } from '../../../shared/components';
import { gradeLabel, getGradeStyle } from '@shared/styles/belts';
import { Bookmark, Search, X } from 'lucide-react';
import { useFocusTrap } from '../../../shared/hooks/useFocusTrap';
import {
  buildSearchIndex,
  buildGlossarySearchIndex,
  buildExerciseSearchIndex,
  matchSearch,
  normalizeSearchQuery,
} from '../indexer';
import { scoreSearchResult, applyTieBreakers, type ScoredSearchResult } from '../scorer';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { loadAllTerms } from '../../glossary/loader';

type SearchResult =
  | { type: 'technique'; item: Technique }
  | { type: 'glossary'; item: GlossaryTerm }
  | { type: 'exercise'; item: Exercise };

type SearchOverlayProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  exercises: Exercise[];
  progress: Progress[];
  glossaryProgress: GlossaryProgress[];
  exerciseProgress: ExerciseProgress[];
  onClose: () => void;
  onOpen: (slug: string) => void;
  onOpenGlossary: (slug: string) => void;
  onOpenExercise: (slug: string) => void;
  onToggleTechniqueBookmark?: (techniqueId: string) => void;
  onToggleGlossaryBookmark?: (termId: string) => void;
  onToggleExerciseBookmark?: (exerciseId: string) => void;
  // Indicates how the overlay was opened. When opened by keyboard, pointer
  // (mouse) interactions should not affect selection until the user actually
  // moves or clicks the mouse.
  openedBy?: 'keyboard' | 'mouse';
};

export const SearchOverlay = ({
  copy,
  locale,
  techniques,
  exercises,
  progress,
  glossaryProgress,
  exerciseProgress,
  onClose,
  onOpen,
  onOpenGlossary,
  onOpenExercise,
  onToggleTechniqueBookmark,
  onToggleGlossaryBookmark,
  onToggleExerciseBookmark,
  openedBy,
}: SearchOverlayProps): ReactElement => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [highlightPosition, setHighlightPosition] = useState({ y: 0, height: 0 });
  const [hasMoreContent, setHasMoreContent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { overlayMotion } = useMotionPreferences();

  // When opened via keyboard shortcut, ignore pointer hover changes until the
  // user actually uses the mouse (mousemove or mousedown). This prevents the
  // mouse cursor from immediately stealing selection when the user intends
  // to navigate with keyboard.
  const [pointerEnabled, setPointerEnabled] = useState(openedBy !== 'keyboard');

  useEffect(() => {
    if (openedBy !== 'keyboard') return;

    const enablePointer = () => {
      setPointerEnabled(true);
      document.removeEventListener('mousemove', enablePointer);
      document.removeEventListener('mousedown', enablePointer);
    };

    document.addEventListener('mousemove', enablePointer, { passive: true });
    document.addEventListener('mousedown', enablePointer, { passive: true });

    return () => {
      document.removeEventListener('mousemove', enablePointer);
      document.removeEventListener('mousedown', enablePointer);
    };
  }, [openedBy]);

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
  const exerciseIndex = useMemo(() => buildExerciseSearchIndex(exercises), [exercises]);

  const normalizedQuery = useMemo(() => normalizeSearchQuery(query), [query]);

  const results = useMemo((): SearchResult[] => {
    // Require minimum query length to avoid too many partial matches
    if (normalizedQuery.length === 0 || query.trim().length < 2) {
      // Return a deterministic default ordering when search is empty.
      // Requested default order (techniques then glossary):
      // 1) Katate tori shiho nage (katate-tori-shiho-nage)
      // 2) Katate-tori Kaiten-nage (Soto) (katate-tori-kaiten-nage-soto)
      // 3) Ryote-tori Koshi-nage (ryote-tori-koshi-nage)
      // 4) Onegai shimasu (onegai-shimasu) [glossary]
      // 5) Kamae (kamae) [glossary]
      // 6) uke (uke) [glossary]

      const techniqueOrder = [
        'ryote-tori-koshi-nage',
        'katate-tori-kaiten-nage-soto',
        'katate-tori-irimi-nage',
      ];

      const glossaryOrder = ['onegai-shimasu', 'kamae', 'uke'];

      const recentTechniques: SearchResult[] = techniqueOrder
        .map((slug) => techniques.find((t) => t.slug === slug))
        .filter(Boolean)
        .map((item) => ({ type: 'technique', item: item as Technique }));

      const someGlossaryTerms: SearchResult[] = glossaryOrder
        .map((slug) => glossaryTerms.find((g) => g.slug === slug))
        .filter(Boolean)
        .map((item) => ({ type: 'glossary', item: item as GlossaryTerm }));

      return [...recentTechniques, ...someGlossaryTerms];
    }

    // Get all matching results using the existing haystack filtering
    const allTechniqueResults: ScoredSearchResult[] = techniqueIndex
      .filter((entry) => matchSearch(entry.haystack, normalizedQuery))
      .map((entry) => {
        const score = scoreSearchResult(
          { type: 'technique', item: entry.technique },
          normalizedQuery,
          locale,
        );
        return { type: 'technique', item: entry.technique, score };
      });

    const allGlossaryResults: ScoredSearchResult[] = glossaryIndex
      .filter((entry) => matchSearch(entry.haystack, normalizedQuery))
      .map((entry) => {
        const score = scoreSearchResult(
          { type: 'glossary', item: entry.term },
          normalizedQuery,
          locale,
        );
        return { type: 'glossary', item: entry.term, score };
      });

    const allExerciseResults: ScoredSearchResult[] = exerciseIndex
      .filter((entry) => matchSearch(entry.haystack, normalizedQuery))
      .map((entry) => {
        const score = scoreSearchResult(
          { type: 'exercise', item: entry.exercise },
          normalizedQuery,
          locale,
        );
        return { type: 'exercise', item: entry.exercise, score };
      });

    // Combine and sort by score with tie-breaking rules
    const allResults = [...allTechniqueResults, ...allGlossaryResults, ...allExerciseResults];
    allResults.sort(applyTieBreakers);

    // Limit results and remove score for return type compatibility
    return allResults.slice(0, 20).map((result) => ({
      type: result.type,
      item: result.item,
    })) as SearchResult[];
  }, [
    techniqueIndex,
    glossaryIndex,
    exerciseIndex,
    normalizedQuery,
    techniques,
    glossaryTerms,
    query,
    locale,
  ]);

  // Reset selection when results change
  useEffect(() => {
    // Clear refs when results change
    resultRefs.current = [];

    if (results.length === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= results.length || selectedIndex === -1) {
      setSelectedIndex(0);
    }
  }, [results, selectedIndex]);

  // Update highlight position when selection changes and ensure visibility
  useLayoutEffect(() => {
    if (selectedIndex >= 0 && resultRefs.current[selectedIndex] && resultsContainerRef.current) {
      const selectedElement = resultRefs.current[selectedIndex];
      const container = resultsContainerRef.current;

      if (selectedElement) {
        const elementRect = selectedElement.getBoundingClientRect();

        setHighlightPosition({
          y: selectedElement.offsetTop,
          height: elementRect.height,
        });

        // Smooth scroll to ensure the selected item is visible
        const itemTop = selectedElement.offsetTop;
        const itemBottom = itemTop + selectedElement.offsetHeight;
        const containerScrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const containerVisibleTop = containerScrollTop;
        const containerVisibleBottom = containerScrollTop + containerHeight;

        // Check if item is above visible area
        if (itemTop < containerVisibleTop) {
          container.scrollTo({
            top: itemTop - 8, // 8px padding from top
            behavior: 'smooth',
          });
        }
        // Check if item is below visible area
        else if (itemBottom > containerVisibleBottom) {
          container.scrollTo({
            top: itemBottom - containerHeight + 8, // 8px padding from bottom
            behavior: 'smooth',
          });
        }
      }
    }
  }, [selectedIndex, results]);

  // Check if there's scrollable content and update on scroll
  useLayoutEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrollable = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1; // 1px tolerance

      // Show fade only if scrollable AND not at bottom
      setHasMoreContent(isScrollable && !isAtBottom);
    };

    // Initial check
    updateScrollState();

    // Update on scroll
    container.addEventListener('scroll', updateScrollState, { passive: true });

    return () => container.removeEventListener('scroll', updateScrollState);
  }, [results]);

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
        } else if (result.type === 'glossary') {
          onOpenGlossary(result.item.slug);
        } else {
          onOpenExercise(result.item.slug);
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-start justify-center pt-4 sm:pt-[15vh] px-4 bg-black/45"
      variants={overlayMotion.backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={overlayMotion.transition}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        className="relative w-full max-w-[92vw] sm:max-w-[640px] no-select"
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
        <div className="w-full rounded-2xl border surface surface-border p-3 panel-shadow">
          <div className="relative">
            <div className="relative flex items-center pl-3 pr-12 py-2">
              <span className="text-muted" aria-hidden>
                <Search className="h-4 w-4" />
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
                maxLength={60}
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
              <X className="h-6 w-6" aria-hidden />
              <span className="sr-only">Close</span>
            </motion.button>
          </div>
          <div className="border-t surface-border mt-2 pt-3 relative">
            <div
              ref={resultsContainerRef}
              className="max-h-[50vh] sm:max-h-[60vh] overflow-y-auto relative scrollbar-hide"
            >
              {/* Animated background highlight */}
              {results.length > 0 && selectedIndex >= 0 && (
                <motion.div
                  className="absolute rounded-xl pointer-events-none z-0"
                  animate={{
                    y: highlightPosition.y,
                    opacity: 1,
                  }}
                  initial={{
                    y: 0,
                    opacity: 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 40,
                    mass: 0.8,
                  }}
                  style={{
                    backgroundColor: 'var(--color-surface-hover)',
                    width: 'calc(100% - 0px)',
                    height: highlightPosition.height || 64,
                    left: 0,
                    top: 0,
                  }}
                />
              )}

              {results.length > 0 ? (
                results.map((result, index) => (
                  <button
                    key={result.type === 'technique' ? result.item.id : result.item.id}
                    ref={(el) => {
                      resultRefs.current[index] = el;
                    }}
                    type="button"
                    onClick={(event) => {
                      const openInNewTab = event.metaKey || event.ctrlKey;
                      if (result.type === 'technique') {
                        onOpen(result.item.slug);
                      } else if (result.type === 'glossary') {
                        onOpenGlossary(result.item.slug);
                      } else {
                        onOpenExercise(result.item.slug);
                      }
                      if (!openInNewTab) {
                        onClose();
                      }
                    }}
                    onMouseEnter={() => {
                      if (!pointerEnabled) return;
                      setSelectedIndex(index);
                    }}
                    className="relative flex w-full items-baseline justify-between gap-4 rounded-xl px-3 py-3 text-left transition-colors z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-text)]"
                    title={
                      result.type === 'technique'
                        ? result.item.name[locale]
                        : result.type === 'glossary'
                          ? result.item.romaji
                          : result.item.name[locale]
                    }
                  >
                    <div className="min-w-0 flex-1">
                      {result.type === 'technique' ? (
                        <>
                          <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                            <EmphasizedName name={result.item.name[locale]} />
                          </div>
                          <div className="mt-1 text-xs font-medium text-subtle truncate mb-1">
                            {result.item.summary?.[locale] ?? result.item.summary?.en}
                          </div>
                        </>
                      ) : result.type === 'glossary' ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                              {result.item.romaji}
                            </div>
                          </div>
                          <div className="text-xs font-medium text-subtle truncate mb-1">
                            {result.item.def[locale] || result.item.def.en}
                          </div>
                          {/* Japanese name intentionally omitted in search results */}
                        </>
                      ) : (
                        <>
                          <div className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                            <EmphasizedName name={result.item.name[locale]} />
                          </div>
                          <div className="mt-1 text-xs font-medium text-subtle truncate mb-1">
                            {result.item.summary?.[locale] ?? result.item.summary?.en}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Right-side label: technique belt or glossary label */}
                    <div className="flex-shrink-0 ml-3 w-14 flex flex-col items-center gap-2">
                      {result.type === 'technique' ? (
                        <>
                          <span
                            className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full"
                            style={(() => {
                              const style = getGradeStyle(result.item.level);
                              return { backgroundColor: style.backgroundColor, color: style.color };
                            })()}
                          >
                            {gradeLabel(result.item.level, locale)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTechniqueBookmark?.(result.item.id);
                            }}
                            aria-label={
                              progress.find((p) => p.techniqueId === result.item.id && p.bookmarked)
                                ? 'Unbookmark'
                                : 'Bookmark'
                            }
                            className="p-1 -mt-1"
                          >
                            {progress.find(
                              (p) => p.techniqueId === result.item.id && p.bookmarked,
                            ) ? (
                              <Bookmark
                                className="w-4 h-4 text-subtle"
                                aria-hidden
                                fill="currentColor"
                                stroke="none"
                              />
                            ) : (
                              <Bookmark className="w-4 h-4 text-subtle" aria-hidden />
                            )}
                          </button>
                        </>
                      ) : result.type === 'glossary' ? (
                        <>
                          <span
                            className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#474747', color: '#FFFFFF' }}
                          >
                            Glossary
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleGlossaryBookmark?.(result.item.id);
                            }}
                            aria-label={
                              glossaryProgress.find(
                                (g) => g.termId === result.item.id && g.bookmarked,
                              )
                                ? 'Unbookmark'
                                : 'Bookmark'
                            }
                            className="p-1 -mt-1"
                          >
                            {glossaryProgress.find(
                              (g) => g.termId === result.item.id && g.bookmarked,
                            ) ? (
                              <Bookmark
                                className="w-4 h-4 text-subtle"
                                aria-hidden
                                fill="currentColor"
                                stroke="none"
                              />
                            ) : (
                              <Bookmark className="w-4 h-4 text-subtle" aria-hidden />
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className="text-[0.65rem] font-medium px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#7C3AED', color: '#FFFFFF' }}
                          >
                            Exercise
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExerciseBookmark?.(result.item.id);
                            }}
                            aria-label={
                              exerciseProgress.find(
                                (p) => p.exerciseId === result.item.id && p.bookmarked,
                              )
                                ? 'Unbookmark'
                                : 'Bookmark'
                            }
                            className="p-1 -mt-1"
                          >
                            {exerciseProgress.find(
                              (p) => p.exerciseId === result.item.id && p.bookmarked,
                            ) ? (
                              <Bookmark
                                className="w-4 h-4 text-subtle"
                                aria-hidden
                                fill="currentColor"
                                stroke="none"
                              />
                            ) : (
                              <Bookmark className="w-4 h-4 text-subtle" aria-hidden />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-sm text-subtle">
                  {query.trim().length === 0 ? 'Start typing to search...' : 'No results'}
                </div>
              )}
            </div>

            {/* Fade gradient to indicate scrollable content */}
            {hasMoreContent && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[var(--color-surface)] from-0% via-[var(--color-surface)]/80 via-40% to-transparent pointer-events-none z-10" />
            )}
          </div>
          <div className="mt-2 px-3 pb-1 pt-2 text-xs text-subtle text-center">
            <span className="hidden sm:inline">
              Use ↑↓ to navigate • Enter to select • Esc to close
            </span>
            <span className="sm:hidden">Scroll to see more results</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
