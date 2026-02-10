import { useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type { GlossaryTerm } from '../../../shared/types';
import { classNames } from '@shared/utils/classNames';
import { useMotionPreferences } from '@shared/components/ui/motion';

type GlossaryFilters = {
  category?: GlossaryTerm['category'];
};

type MobileTermsFiltersProps = {
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

export const MobileTermsFilters = ({
  copy,
  filters,
  categories,
  onChange,
}: MobileTermsFiltersProps): ReactElement => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { collapseMotion } = useMotionPreferences();

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

  return (
    <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4">
      <button
        type="button"
        aria-expanded={isPanelOpen}
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-base font-semibold leading-tight focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
      >
        <span>{copy.filters}</span>
      </button>

      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={isPanelOpen ? 'open' : 'closed'}
        variants={collapseMotion.variants}
        transition={collapseMotion.transition}
      >
        <div className="pt-3">
          <div className="mb-3 flex items-center justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              >
                {copy.resetFilters}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {categories.map((category) => {
              const active = filters.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={classNames(
                    'w-full rounded-lg border px-3 py-2.5 text-sm flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    active
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] font-semibold shadow-sm'
                      : 'surface surface-border hover:border-[var(--color-text)]',
                  )}
                  aria-pressed={active}
                  onClick={() => handleCategoryChange(active ? undefined : category)}
                >
                  <span className="truncate">{getCategoryLabel(category, copy)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
