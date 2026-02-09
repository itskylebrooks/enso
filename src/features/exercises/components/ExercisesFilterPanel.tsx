import { useEffect, useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { PracticeCategory, PracticeEquipment } from '@shared/types';
import { classNames } from '@shared/utils/classNames';
import { usePinButton } from '@shared/components/ui';
import { SectionTitle } from '@shared/components';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { ChevronDown, Undo2, Pin, PinOff } from 'lucide-react';
import { getExerciseCategoryLabel } from '@shared/styles/exercises';
import type { ExerciseFilters } from './ExercisesPage';

type ExercisesFilterPanelProps = {
  copy: Copy;
  filters: ExerciseFilters;
  categories: PracticeCategory[];
  onChange: (filters: ExerciseFilters) => void;
};

const getEquipmentLabel = (equipment: PracticeEquipment, copy: Copy): string => {
  const labels: Record<PracticeEquipment, string> = {
    none: copy.practiceEquipmentNone,
    mat: copy.practiceEquipmentMat,
    'resistance-band': copy.practiceEquipmentResistanceBand,
  };
  return labels[equipment];
};

export const ExercisesFilterPanel = ({
  copy,
  filters,
  categories,
  onChange,
}: ExercisesFilterPanelProps): ReactElement => {
  const handleReset = () => {
    onChange({
      categories: [],
      equipment: [],
    });
  };

  const hasActiveFilters = filters.categories.length > 0 || filters.equipment.length > 0;
  const pinButtonContext = usePinButton();
  const { collapseMotion } = useMotionPreferences();

  type SectionKey = 'category' | 'equipment';
  const [open, setOpen] = useState<Record<SectionKey, boolean>>(() => ({
    category: filters.categories.length > 0,
    equipment: filters.equipment.length > 0,
  }));

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
    <div className="space-y-6 no-select">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-subtle">
          {copy.filters}
        </h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              aria-label={copy.resetFilters}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-subtle hover:text-[var(--color-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              <Undo2 className="h-4 w-4" aria-hidden />
            </button>
          )}
          {pinButtonContext && (
            <button
              type="button"
              onClick={pinButtonContext.togglePin}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-subtle hover:text-[var(--color-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              aria-label={pinButtonContext.isPinned ? 'Unpin panel' : 'Pin panel'}
              title={pinButtonContext.isPinned ? 'Unpin panel' : 'Pin panel'}
            >
              {pinButtonContext.isPinned ? (
                <PinOff className="w-4 h-4" aria-hidden />
              ) : (
                <Pin className="w-4 h-4" aria-hidden />
              )}
            </button>
          )}
        </div>
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
              const isActive = filters.categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onChange({
                      ...filters,
                      categories: toggleArrayValue(filters.categories, category),
                    })
                  }
                  className={classNames(
                    'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                    isActive
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] shadow-sm hover:bg-[var(--color-text)]'
                      : 'surface surface-border',
                  )}
                >
                  <span className="truncate">{getExerciseCategoryLabel(category, copy)}</span>
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
              const isActive = filters.equipment.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onChange({
                      ...filters,
                      equipment: toggleArrayValue(filters.equipment, value),
                    })
                  }
                  className={classNames(
                    'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                    isActive
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] shadow-sm hover:bg-[var(--color-text)]'
                      : 'surface surface-border',
                  )}
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
