import { useEffect, useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { PracticeCategory, PracticeEquipment } from '@shared/types';
import { classNames } from '@shared/utils/classNames';
import { getPracticeCategoryLabel } from '@shared/styles/practice';
import { SectionTitle } from '@shared/components';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { ChevronDown } from 'lucide-react';
import type { PracticeFilters } from './PracticePage';

type MobilePracticeFiltersProps = {
  copy: Copy;
  filters: PracticeFilters;
  categories: PracticeCategory[];
  onChange: (filters: PracticeFilters) => void;
};

const getEquipmentLabel = (equipment: PracticeEquipment, copy: Copy): string => {
  const labels: Record<PracticeEquipment, string> = {
    none: copy.practiceEquipmentNone,
    mat: copy.practiceEquipmentMat,
    'resistance-band': copy.practiceEquipmentResistanceBand,
  };
  return labels[equipment];
};

export const MobilePracticeFilters = ({
  copy,
  filters,
  categories,
  onChange,
}: MobilePracticeFiltersProps): ReactElement => {
  const handleReset = () => {
    onChange({
      categories: [],
      equipment: [],
    });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.equipment.length > 0;

  type SectionKey = 'category' | 'equipment';
  const [open, setOpen] = useState<Record<SectionKey, boolean>>(() => ({
    category: filters.categories.length > 0,
    equipment: filters.equipment.length > 0,
  }));

  const { collapseMotion } = useMotionPreferences();

  const toggleOpen = (key: SectionKey): void => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    setOpen((prev) => ({
      ...prev,
      category: prev.category || filters.categories.length > 0,
      equipment: prev.equipment || filters.equipment.length > 0,
    }));
  }, [filters.categories.length, filters.equipment.length]);

  const toggleArrayValue = <T,>(values: T[], value: T): T[] =>
    values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

  return (
    <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle>{copy.filters}</SectionTitle>
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

      <section>
        <button
          type="button"
          aria-expanded={open.category}
          onClick={() => toggleOpen('category')}
          className="flex w-full items-center justify-between text-left"
        >
          <SectionTitle>{copy.category}</SectionTitle>
          <motion.span
            aria-hidden
            className="text-subtle"
            animate={{ rotate: open.category ? 0 : -90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={open.category ? 'open' : 'closed'}
          variants={collapseMotion.variants}
          transition={collapseMotion.transition}
        >
          <div className="pt-3 space-y-2">
            {categories.map((category) => {
              const active = filters.categories.includes(category);
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
                  onClick={() =>
                    onChange({
                      ...filters,
                      categories: toggleArrayValue(filters.categories, category),
                    })
                  }
                >
                  <span className="truncate">{getPracticeCategoryLabel(category, copy)}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section>
        <button
          type="button"
          aria-expanded={open.equipment}
          onClick={() => toggleOpen('equipment')}
          className="flex w-full items-center justify-between text-left"
        >
          <SectionTitle>{copy.practiceEquipment}</SectionTitle>
          <motion.span
            aria-hidden
            className="text-subtle"
            animate={{ rotate: open.equipment ? 0 : -90 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>
        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={open.equipment ? 'open' : 'closed'}
          variants={collapseMotion.variants}
          transition={collapseMotion.transition}
        >
          <div className="pt-3 space-y-2">
            {(['none', 'mat', 'resistance-band'] as PracticeEquipment[]).map((value) => {
              const active = filters.equipment.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  className={classNames(
                    'w-full rounded-lg border px-3 py-2.5 text-sm flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    active
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] font-semibold shadow-sm'
                      : 'surface surface-border hover:border-[var(--color-text)]',
                  )}
                  aria-pressed={active}
                  onClick={() =>
                    onChange({
                      ...filters,
                      equipment: toggleArrayValue(filters.equipment, value),
                    })
                  }
                >
                  <span className="truncate">{getEquipmentLabel(value, copy)}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>
    </div>
  );
};
