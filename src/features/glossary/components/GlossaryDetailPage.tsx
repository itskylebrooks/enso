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

const getCategoryLabel = (category: GlossaryTerm['category'], copy: Copy): string => {
  const labels: Record<GlossaryTerm['category'], string> = {
    movement: copy.categoryMovement,
    stance: copy.categoryStance,
    attack: copy.categoryAttack,
    etiquette: copy.categoryEtiquette,
    philosophy: copy.categoryPhilosophy,
    other: copy.categoryOther,
  };
  return labels[category];
};

const getCategoryColor = (category: GlossaryTerm['category']): string => {
  const colors: Record<GlossaryTerm['category'], string> = {
    movement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    stance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    attack: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    etiquette: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    philosophy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
  };
  return colors[category];
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
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4 text-center">
        <p className="text-lg font-semibold">Term not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm underline"
        >
          {copy.backToGlossary}
        </button>
      </div>
    );
  }

  const definition = term.def[locale] || term.def.en;
  const notes = term.notes?.[locale] || term.notes?.en;
  const categoryLabel = getCategoryLabel(term.category, copy);
  const categoryStyle = getCategoryColor(term.category);

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
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryStyle}`}>
              {categoryLabel}
            </span>
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

      {/* Notes section */}
      {notes && (
        <section className="prose prose-sm max-w-none dark:prose-invert">
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] text-subtle text-center">Notes</h2>
            <div className="space-y-3">
              {notes.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="text-base leading-relaxed">
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