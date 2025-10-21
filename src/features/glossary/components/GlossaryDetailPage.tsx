import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import { loadTermBySlug } from '../loader';
import { useMotionPreferences } from '@shared/components/ui/motion';
import type { GlossaryTerm } from '../../../shared/types';
import type { Locale } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';
import { AddToCollectionMenu } from '../../../features/bookmarks/components/AddToCollectionMenu';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { classNames } from '@shared/utils/classNames';
import { getCategoryStyle, getCategoryLabel } from '../../../shared/styles/glossary';
import { getInitialThemeState } from '@shared/utils/theme';
import BreathingDot from '@shared/components/ui/BreathingDot';

export type CollectionOption = {
  id: string;
  name: string;
  icon: string | null;
  checked: boolean;
};

type GlossaryDetailPageProps = {
  slug: string;
  copy: Copy;
  locale: Locale;
  onBack: () => void;
  backLabel?: string;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  collections: CollectionOption[];
  onToggleCollection: (collectionId: string, nextChecked: boolean) => void;
  onNavigateToGlossaryWithFilter?: (category: GlossaryTerm['category']) => void;
};





export const GlossaryDetailPage = ({ 
  slug, 
  copy, 
  locale, 
  onBack, 
  backLabel,
  isBookmarked, 
  onToggleBookmark, 
  collections, 
  onToggleCollection,
  onNavigateToGlossaryWithFilter,
}: GlossaryDetailPageProps): ReactElement => {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(getInitialThemeState);
  const { pageMotion } = useMotionPreferences();

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const html = document.documentElement;
      setIsDark(html.classList.contains('dark'));
    };

    // Initial check
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const loadTerm = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const loadedTerm = await loadTermBySlug(slug);
        if (loadedTerm) {
          setTerm(loadedTerm);
        } else {
          setError('Term not found');
        }
      } catch (err) {
        console.error('Error loading glossary term:', err);
        setError('Failed to load term');
      } finally {
        setLoading(false);
      }
    };

    loadTerm();
  }, [slug]);

  if (loading) {
    return (
      <div className="loader-center-viewport">
        <BreathingDot label={copy.loading} size={96} />
      </div>
    );
  }

  if (error || !term) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4 text-center">
        <p className="text-lg font-semibold">Term not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm underline"
        >
          {backLabel ?? copy.backToGlossary}
        </button>
      </div>
    );
  }

  const definition = term.def[locale] || term.def.en;
  const literal = term.literal?.[locale] || term.literal?.en;
  const notes = term.notes?.[locale] || term.notes?.en;
  const categoryLabel = getCategoryLabel(term.category, copy);
  const categoryStyle = getCategoryStyle(term.category, isDark);

  return (
    <motion.main
      className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-8"
      variants={pageMotion.variants}
      initial="initial"
      animate="animate"
      transition={pageMotion.transition}
    >
      {/* Back navigation */}
      <div className="flex items-center">
        <a
          href="/"
          aria-label={backLabel ?? copy.backToGlossary}
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          <span>{backLabel ?? copy.backToGlossary}</span>
        </a>
      </div>

      {/* Term header - centered and focused */}
      <header className="text-center space-y-4 pb-6 border-b surface-border">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold leading-tight" title={term.romaji}>
            {term.romaji}
          </h1>
          {term.jp && (
            <div className="text-sm text-subtle">
              {term.jp}
            </div>
          )}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => onNavigateToGlossaryWithFilter?.(term.category)}
              aria-label={`Show ${categoryLabel} in glossary`}
              className="rounded-lg px-2 py-1 text-xs uppercase tracking-wide hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              style={{
                backgroundColor: categoryStyle.backgroundColor,
                color: categoryStyle.color,
              }}
            >
              {categoryLabel}
            </button>
          </div>
        </div>
        
        {/* Bookmark controls */}
        <div className="flex justify-center gap-2">
          <AddToCollectionMenu
            copy={copy}
            collections={collections}
            onToggle={(collectionId, nextChecked) => onToggleCollection(collectionId, nextChecked)}
          />
          <div className="inline-flex rounded-lg border surface-border overflow-hidden">
            <motion.button
              type="button"
              onClick={onToggleBookmark}
              aria-pressed={isBookmarked}
              aria-label={copy.bookmark}
              transition={{ duration: 0.15 }}
              whileTap={{ scale: 0.96 }}
              className={classNames(
                'p-2 text-sm flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-colors duration-150',
                isBookmarked
                  ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                  : 'surface hover:surface-hover',
              )}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Definition section */}
      <section className="prose prose-sm max-w-none dark:prose-invert">
        <div className="text-center space-y-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">Definition</h2>
          <p className="text-base leading-relaxed">{definition}</p>
        </div>
      </section>

      {/* Literal translation section */}
      {literal && (
        <section className="prose prose-sm max-w-none dark:prose-invert">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] text-subtle italic text-[var(--color-text)]">Literal Translation</h2>
            <p className="text-base italic text-[var(--color-text)] leading-relaxed">{literal}</p>
          </div>
        </section>
      )}

      {/* Notes section */}
      {notes && (
        <section className="prose prose-sm max-w-none dark:prose-invert">
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] text-subtle text-center">Notes</h2>
            <div className="space-y-3">
              {notes.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="text-base leading-relaxed text-center">
                    {paragraph.trim()}
                  </p>
                )
              ))}
            </div>
          </div>
        </section>
      )}
    </motion.main>
  );
};
