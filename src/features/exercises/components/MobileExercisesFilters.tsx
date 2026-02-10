import { useEffect, useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { PracticeCategory, PracticeEquipment } from '@shared/types';
import { classNames } from '@shared/utils/classNames';
import { getExerciseCategoryLabel } from '@shared/styles/exercises';
import { SectionTitle } from '@shared/components';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { ChevronDown, PencilLine } from 'lucide-react';
import type { ExerciseFilters } from './ExercisesPage';

type MobileExercisesFiltersProps = {
  copy: Copy;
  filters: ExerciseFilters;
  categories: PracticeCategory[];
  onChange: (filters: ExerciseFilters) => void;
  onContribute?: () => void;
  onContributePrefetch?: () => void;
};

const getEquipmentLabel = (equipment: PracticeEquipment, copy: Copy): string => {
  const labels: Record<PracticeEquipment, string> = {
    none: copy.practiceEquipmentNone,
    mat: copy.practiceEquipmentMat,
    'resistance-band': copy.practiceEquipmentResistanceBand,
  };
  return labels[equipment];
};

export const MobileExercisesFilters = ({
  copy,
  filters,
  categories,
  onChange,
  onContribute,
  onContributePrefetch,
}: MobileExercisesFiltersProps): ReactElement => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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

          <FilterSection
            title={copy.category}
            isOpen={open.category}
            onToggle={() => toggleOpen('category')}
            collapseMotion={collapseMotion}
          >
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
                  <span className="truncate">{getExerciseCategoryLabel(category, copy)}</span>
                </button>
              );
            })}
          </FilterSection>

          <FilterSection
            title={copy.practiceEquipment}
            isOpen={open.equipment}
            onToggle={() => toggleOpen('equipment')}
            collapseMotion={collapseMotion}
          >
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
          </FilterSection>
          {onContribute && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onContribute}
                onMouseEnter={onContributePrefetch}
                onFocus={onContributePrefetch}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
              >
                <PencilLine width={20} height={20} aria-hidden />
                {copy.feedbackAddExerciseCta}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

type FilterSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  collapseMotion: ReturnType<typeof useMotionPreferences>['collapseMotion'];
  children: ReactElement[] | ReactElement;
};

const FilterSection = ({
  title,
  isOpen,
  onToggle,
  collapseMotion,
  children,
}: FilterSectionProps): ReactElement => (
  <section className="mb-3">
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
      className="flex w-full items-center justify-between text-left rounded-lg px-3 py-2 bg-[var(--color-surface)]/0 hover:bg-[var(--color-surface-hover)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] touch-manipulation"
      style={{ minHeight: 40 }}
    >
      <SectionTitle>
        <span className="text-sm">{title}</span>
      </SectionTitle>
      <motion.span
        aria-hidden
        className="text-subtle"
        animate={{ rotate: isOpen ? 0 : -90 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-4 h-4" />
      </motion.span>
    </button>

    <motion.div
      className="overflow-hidden"
      initial={false}
      animate={isOpen ? 'open' : 'closed'}
      variants={collapseMotion.variants}
      transition={collapseMotion.transition}
    >
      <div className="pt-3 space-y-2">{children}</div>
    </motion.div>
  </section>
);
