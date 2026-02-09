import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { Exercise, Locale, PracticeCategory, PracticeEquipment, PracticeWhen } from '@shared/types';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { useIncrementalList } from '@shared/hooks/useIncrementalList';
import { PracticeCard } from './PracticeCard';
import { loadAllExercises } from '../loader';

export type PracticeFilters = {
  categories: PracticeCategory[];
  whenToUse: PracticeWhen[];
  equipment: PracticeEquipment[];
};

type PracticePageProps = {
  copy: Copy;
  locale: Locale;
  filters: PracticeFilters;
  onOpenExercise: (slug: string) => void;
};

export const PracticePage = ({
  copy,
  locale,
  filters,
  onOpenExercise,
}: PracticePageProps): ReactElement => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();

  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await loadAllExercises();
        setExercises(loaded);
      } catch (err) {
        console.error('Error loading practice exercises:', err);
        setError('Failed to load practice exercises');
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  const filteredExercises = useMemo(() => {
    return exercises
      .filter((exercise) => {
        if (filters.categories.length > 0 && !filters.categories.includes(exercise.category)) {
          return false;
        }

        if (filters.whenToUse.length > 0) {
          const whenTags = exercise.whenToUse ?? [];
          if (!filters.whenToUse.some((item) => whenTags.includes(item))) {
            return false;
          }
        }

        if (filters.equipment.length > 0) {
          const equipment = exercise.equipment ?? [];
          if (!filters.equipment.some((item) => equipment.includes(item))) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const aName = a.name[locale] || a.name.en;
        const bName = b.name[locale] || b.name.en;
        return aName.localeCompare(bName, locale, { sensitivity: 'accent' });
      });
  }, [exercises, filters, locale]);

  const exercisesKey = filteredExercises.map((exercise) => exercise.id).join(',');
  const {
    visibleItems: visibleExercises,
    hasMore,
    loadMore,
  } = useIncrementalList(filteredExercises, {
    pageSize: 18,
    resetKey: exercisesKey,
  });

  if (loading) {
    return (
      <div className="text-center py-12 no-select">
        <p className="text-muted">{copy.practiceLoading}</p>
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

  if (filteredExercises.length === 0) {
    return (
      <div className="text-center py-12 no-select">
        <p className="text-muted">
          {exercises.length === 0 ? copy.practiceEmpty : copy.practiceEmptyFiltered}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      key={exercisesKey}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 no-select"
      variants={listMotion.container}
      initial={false}
      animate="show"
    >
      {visibleExercises.map((exercise, index) => (
        <PracticeCard
          key={exercise.id}
          exercise={exercise}
          copy={copy}
          locale={locale}
          onSelect={onOpenExercise}
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
  );
};
