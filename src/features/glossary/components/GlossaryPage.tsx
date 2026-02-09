import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import { loadAllTerms } from '../loader';
import { useGlossaryStore } from '../store';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { GlossaryCard } from './GlossaryCard';
import { useIncrementalList } from '@shared/hooks/useIncrementalList';
import type { Locale } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';

type GlossaryFilters = {
  category?: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other';
};

type GlossaryPageProps = {
  locale: Locale;
  copy: Copy;
  filters?: GlossaryFilters;
  onOpenTerm: (slug: string) => void;
};

export const GlossaryPage = ({
  locale,
  copy,
  filters = {},
  onOpenTerm,
}: GlossaryPageProps): ReactElement => {
  const { terms, loading, error, setTerms, setLoading, setError } = useGlossaryStore();
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();

  useEffect(() => {
    const loadTerms = async () => {
      if (terms.length > 0) return; // Already loaded

      setLoading(true);
      try {
        const loadedTerms = await loadAllTerms();
        setTerms(loadedTerms);
      } catch (err) {
        console.error('Error loading glossary terms:', err);
        setError('Failed to load glossary terms');
      }
    };

    loadTerms();
  }, [terms.length, setTerms, setLoading, setError]);

  // Apply filters and sort alphabetically
  const filteredTerms = terms
    .filter((term) => {
      if (filters.category && term.category !== filters.category) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort all terms alphabetically by romaji, regardless of category
      return a.romaji.localeCompare(b.romaji, 'en', { sensitivity: 'base' });
    });

  const termsKey = filteredTerms.map((t) => t.id).join(',');
  const {
    visibleItems: visibleTerms,
    hasMore,
    loadMore,
  } = useIncrementalList(filteredTerms, {
    pageSize: 18,
    resetKey: termsKey,
  });

  if (loading) {
    return (
      <div className="text-center py-12 no-select">
        <p className="text-muted">{copy.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 no-select">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <>
      {filteredTerms.length === 0 ? (
        <div className="text-center py-12 no-select">
          <p className="text-muted">
            {terms.length === 0
              ? 'No glossary terms available yet.'
              : 'No terms found for the selected filters.'}
          </p>
        </div>
      ) : (
        <motion.div
          key={termsKey}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 no-select"
          variants={listMotion.container}
          initial={false}
          animate="show"
        >
          {visibleTerms.map((term, index) => (
            <GlossaryCard
              key={term.id}
              term={term}
              locale={locale}
              copy={copy}
              onSelect={onOpenTerm}
              motionIndex={index}
              variants={listMotion.item}
              getTransition={getItemTransition}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
          {hasMore && (
            <div className="col-span-full flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex items-center justify-center rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
              >
                {copy.loadMore}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
};
