import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import { loadAllTerms } from '../loader';
import { useGlossaryStore } from '../store';
import { useMotionPreferences } from '../../../components/ui/motion';
import { GlossaryCard } from './GlossaryCard.tsx';
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

export const GlossaryPage = ({ locale, copy, filters = {}, onOpenTerm }: GlossaryPageProps): ReactElement => {
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

  // Apply filters and sort alphabetically
  const filteredTerms = terms.filter(term => {
    if (filters.category && term.category !== filters.category) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Sort all terms alphabetically by romaji, regardless of category
    return a.romaji.localeCompare(b.romaji, 'en', { sensitivity: 'base' });
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
          {filteredTerms.map((term, index) => (
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
        </motion.div>
      )}
    </>
  );
};