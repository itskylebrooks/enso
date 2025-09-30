import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import { loadTermBySlug } from '../loader';
import { useMotionPreferences } from '../../../components/ui/motion';
import type { GlossaryTerm } from '../../../shared/types';
import type { Locale } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';

type GlossaryDetailPageProps = {
  slug: string;
  copy: Copy;
  locale: Locale;
  onBack: () => void;
};

const getCategoryLabel = (category: GlossaryTerm['category']): string => {
  const labels: Record<GlossaryTerm['category'], string> = {
    movement: 'Movement',
    stance: 'Stance',
    attack: 'Attack',
    etiquette: 'Etiquette',
    philosophy: 'Philosophy',
    other: 'Other',
  };
  return labels[category];
};



export const GlossaryDetailPage = ({ slug, copy, locale, onBack }: GlossaryDetailPageProps): ReactElement => {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pageMotion } = useMotionPreferences();

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
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <div className="text-center">
          <p className="text-muted">Loading term...</p>
        </div>
      </div>
    );
  }

  if (error || !term) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6">
        <a
          href="/"
          aria-label={copy.backToGlossary}
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          <span>{copy.backToGlossary}</span>
        </a>
        
        <div className="text-center py-12">
          <h1 className="text-3xl font-semibold leading-tight mb-4">Term Not Found</h1>
          <p className="text-base text-muted leading-relaxed max-w-3xl mx-auto mb-6">
            The glossary term "{slug}" could not be found.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="btn-primary px-4 py-2 rounded-lg"
          >
            Back to Glossary
          </button>
        </div>
      </div>
    );
  }

  const definition = term.def[locale] || term.def.en;
  const notes = term.notes?.[locale] || term.notes?.en;
  const categoryLabel = getCategoryLabel(term.category);

  return (
    <motion.main
      className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-6"
      variants={pageMotion.variants}
      initial="initial"
      animate="animate"
      transition={pageMotion.transition}
    >
      {/* Header section - matches TechniqueHeader structure */}
      <header className="z-10 border-b surface-border pb-4 bg-transparent space-y-6">
        <div className="flex flex-wrap items-stretch justify-between gap-x-6 gap-y-4">
          <div className="min-w-0 space-y-3 flex-grow">
            <a
              href="/"
              aria-label={copy.backToGlossary}
              onClick={(event) => {
                event.preventDefault();
                onBack();
              }}
              className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
            >
              <span aria-hidden>←</span>
              <span>{copy.backToGlossary}</span>
            </a>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold leading-tight" title={term.romaji}>
                {term.romaji}
              </h1>
              {term.jp && <div className="text-sm text-subtle">{term.jp}</div>}
              <div className="flex flex-wrap gap-2 pt-1">
                {term.kana && (
                  <span className="rounded-lg border surface-border bg-[var(--color-surface)] px-2 py-1 text-xs uppercase tracking-wide text-subtle">
                    {term.kana}
                  </span>
                )}
                <span className="rounded-lg border surface-border bg-[var(--color-surface)] px-2 py-1 text-xs uppercase tracking-wide text-subtle">
                  {categoryLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-base text-muted leading-relaxed max-w-3xl">{definition}</p>
      </header>

      {/* Content section - matches TechniquePage content structure */}
      <motion.section
        variants={pageMotion.variants}
        initial="initial"
        animate="animate"
        transition={pageMotion.transition}
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr]">
          {/* Main content column */}
          <div className="space-y-8">
            {notes && (
              <section className="space-y-4">
                <header className="text-xs uppercase tracking-[0.3em] text-subtle">Notes</header>
                <div className="space-y-3">
                  {notes.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="text-base leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              </section>
            )}
          </div>
          
          {/* Sidebar column - reserved for future features */}
          <div className="space-y-8">
            {/* Future: Related terms */}
            {/* Future: Techniques using this term */}
          </div>
        </div>
      </motion.section>
    </motion.main>
  );
};