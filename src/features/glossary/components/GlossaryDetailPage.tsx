import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { loadTermBySlug } from '../loader';
import { useMotionPreferences } from '@shared/components/ui/motion';
import type { GlossaryTerm } from '../../../shared/types';
import type { Locale } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';
import { AddToCollectionMenu } from '../../../features/bookmarks/components/AddToCollectionMenu';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { classNames } from '@shared/utils/classNames';
import { getCategoryStyle, getCategoryLabel } from '../../../shared/styles/glossary';
import BreathingDot from '@shared/components/ui/BreathingDot';
import { NameModal } from '@shared/components/ui/modals/NameModal';

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
  onCreateCollection?: (name: string) => string | null;
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
  onCreateCollection,
  onNavigateToGlossaryWithFilter,
}: GlossaryDetailPageProps): ReactElement => {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const { pageMotion } = useMotionPreferences();

  const openCreateDialog = () => setDialogOpen(true);
  const closeCreateDialog = () => setDialogOpen(false);

  const handleCreate = (name: string) => {
    if (!onCreateCollection) return closeCreateDialog();
    const newId = onCreateCollection(name);
    closeCreateDialog();
    if (newId && term) {
      // Assign the current glossary term to the newly created collection
      onToggleCollection(newId, true);
    }
  };

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
        <button type="button" onClick={onBack} className="text-sm underline">
          {backLabel ?? copy.backToGlossary}
        </button>
      </div>
    );
  }

  const definition = term.def[locale] || term.def.en;
  const literal = term.literal?.[locale] || term.literal?.en;
  const notes = term.notes?.[locale] || term.notes?.en;
  const categoryLabel = getCategoryLabel(term.category, copy);
  const categoryStyle = getCategoryStyle(term.category);
  const definitionLabel = locale === 'de' ? 'Definition' : 'Definition';
  const literalLabel = locale === 'de' ? 'Wortbedeutung' : 'Literal Translation';

  return (
    <motion.main
      className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6"
      variants={pageMotion.variants}
      initial="initial"
      animate="animate"
      transition={pageMotion.transition}
    >
      <header className="z-10 border-b surface-border pb-4 bg-transparent space-y-4">
        <a
          href="/terms"
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

        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold leading-tight" title={term.romaji}>
                {term.romaji}
              </h1>
              {term.jp && <div className="text-sm text-subtle">{term.jp}</div>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateToGlossaryWithFilter?.(term.category)}
                  aria-label={`Show ${categoryLabel} in glossary`}
                  className="glossary-tag glossary-tag--interactive rounded-lg px-2 py-1 text-xs uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  style={{
                    backgroundColor: categoryStyle.backgroundColor,
                    color: categoryStyle.color,
                  }}
                >
                  {categoryLabel}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AddToCollectionMenu
                copy={copy}
                collections={collections}
                onToggle={(collectionId, nextChecked) =>
                  onToggleCollection(collectionId, nextChecked)
                }
                onCreate={openCreateDialog}
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
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          {notes && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{copy.notes}</h2>
              <div className="space-y-2 text-sm leading-relaxed text-muted">
                {notes
                  .split('\n')
                  .map((paragraph) => paragraph.trim())
                  .filter((paragraph) => paragraph.length > 0)
                  .map((paragraph, index) => (
                    <p key={`${term.slug}-notes-${index}`}>{paragraph}</p>
                  ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{definitionLabel}</h2>
            <p className="text-sm leading-relaxed text-muted">{definition}</p>
          </section>

          {literal && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{literalLabel}</h2>
              <p className="text-sm italic leading-relaxed text-muted">{literal}</p>
            </section>
          )}
        </div>
      </div>

      <AnimatePresence>
        {dialogOpen && (
          <NameModal
            key="glossary-create-collection"
            strings={{
              title: copy.collectionsNew,
              nameLabel: copy.collectionsNameLabel,
              confirmLabel: copy.collectionsCreateAction,
              cancelLabel: copy.collectionsCancel,
            }}
            onCancel={closeCreateDialog}
            onConfirm={(name) => handleCreate(name)}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
};
