import type { ReactElement } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type { GlossaryTerm } from '../../../shared/types';
import { classNames } from '../../../shared/utils/classNames';
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
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const isActive = filters.category === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => handleCategoryChange(isActive ? undefined : category)}
                          className={classNames(
                            'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                            isActive
                              ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] shadow-sm hover:bg-[var(--color-text)]'
                              : 'surface surface-border',
                          )}
                        >
                          <span className="truncate">{getCategoryLabel(category, copy)}</span>
                        </button>
                      );
                    })}
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