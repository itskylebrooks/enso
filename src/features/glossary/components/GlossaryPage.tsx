import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import { loadAllTerms } from '../loader';
import { useGlossaryStore } from '../store';
import { useMotionPreferences } from '../../../components/ui/motion';
import { GlossaryCard } from './GlossaryCard.tsx';
import type { Locale } from '../../../shared/types';

type GlossaryFilters = {
  category?: 'movement' | 'stance' | 'attack' | 'etiquette' | 'philosophy' | 'other';
};

type GlossaryPageProps = {
  locale: Locale;
  filters?: GlossaryFilters;
  onOpenTerm: (slug: string) => void;
};

export const GlossaryPage = ({ locale, filters = {}, onOpenTerm }: GlossaryPageProps): ReactElement => {
  const { terms, loading, error, setTerms, setLoading, setError } = useGlossaryStore();
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
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

  // Apply filters
  const filteredTerms = terms.filter(term => {
    if (filters.category && term.category !== filters.category) {
      return false;
    }
    return true;
  });

  const termsByCategory = filteredTerms.reduce((acc, term) => {
    const category = term.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(term);
    return acc;
  }, {} as Record<string, typeof filteredTerms>);

  const sortedCategories = Object.keys(termsByCategory).sort((a, b) => {
    // Order categories logically
    const order = ['movement', 'stance', 'attack', 'etiquette', 'philosophy', 'other'];
    return order.indexOf(a) - order.indexOf(b);
  });

  if (!mounted) {
    return <div className="max-w-4xl mx-auto px-4 py-8" />;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted">Loading glossary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Create a stable key for animation
  const termsKey = filteredTerms.map(t => t.id).join(',');

  return (
    <>
      {filteredTerms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">
            {terms.length === 0 ? 'No glossary terms available yet.' : 'No terms found for the selected filters.'}
          </p>
        </div>
      ) : (
        <motion.div
          key={termsKey}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={listMotion.container}
          initial="hidden"
          animate="show"
          layout
        >
          {sortedCategories.map((category) =>
            termsByCategory[category].map((term, termIndex) => {
              // Calculate global index for animation delay
              const globalIndex = sortedCategories
                .slice(0, sortedCategories.indexOf(category))
                .reduce((count, cat) => count + termsByCategory[cat].length, 0) + termIndex;

              return (
                <GlossaryCard
                  key={term.id}
                  term={term}
                  locale={locale}
                  onSelect={onOpenTerm}
                  motionIndex={globalIndex}
                  variants={listMotion.item}
                  getTransition={getItemTransition}
                  prefersReducedMotion={prefersReducedMotion}
                />
              );
            })
          )}
        </motion.div>
      )}
    </>
  );
};