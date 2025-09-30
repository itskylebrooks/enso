import type { ReactElement } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type { GlossaryTerm } from '../../../shared/types';
import { Chip } from '../../../shared/components/ui/Chip';
import { useMotionPreferences } from '../../../components/ui/motion';

type GlossaryFilters = {
  category?: GlossaryTerm['category'];
};

type MobileGlossaryFiltersProps = {
  copy: Copy;
  filters: GlossaryFilters;
  categories: GlossaryTerm['category'][];
  onChange: (filters: GlossaryFilters) => void;
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

export const MobileGlossaryFilters = ({
  copy,
  filters,
  categories,
  onChange,
}: MobileGlossaryFiltersProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const { overlayMotion } = useMotionPreferences();

  const handleCategoryChange = (category: GlossaryTerm['category'] | undefined) => {
    onChange({
      ...filters,
      category,
    });
  };

  const handleReset = () => {
    onChange({});
  };

  const hasActiveFilters = filters.category;
  const activeFiltersCount = hasActiveFilters ? 1 : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-lg border btn-tonal surface-hover"
      >
        <span className="flex items-center gap-2">
          <span>{copy.filters}</span>
          {activeFiltersCount > 0 && (
            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed inset-x-4 bottom-4 top-auto bg-[var(--color-surface)] border border-[var(--color-surface-border)] rounded-2xl p-4 z-50 space-y-4 max-h-[80vh] overflow-y-auto"
              variants={overlayMotion.panel}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={overlayMotion.panelTransition}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{copy.filters}</h2>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-sm text-muted hover:text-primary underline"
                    >
                      {copy.resetFilters}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-sm px-3 py-1.5 rounded-lg border btn-tonal"
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-subtle uppercase tracking-wide mb-3">
                    {copy.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Chip
                        key={category}
                        label={getCategoryLabel(category)}
                        active={filters.category === category}
                        onClick={() => 
                          handleCategoryChange(filters.category === category ? undefined : category)
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};