import type { KeyboardEvent, ReactElement } from 'react';
import { motion, type Transition, type Variants } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { Exercise, Locale, PracticeEquipment, PracticeWhen } from '@shared/types';
import { getPracticeCategoryLabel, getPracticeCategoryStyle } from '@shared/styles/practice';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

type PracticeCardProps = {
  exercise: Exercise;
  copy: Copy;
  locale: Locale;
  onSelect: (slug: string) => void;
  motionIndex: number;
} & MotionProps;

const getWhenLabel = (whenToUse: PracticeWhen, copy: Copy): string => {
  const labels: Record<PracticeWhen, string> = {
    'before-training': copy.practiceWhenBeforeTraining,
    'after-training': copy.practiceWhenAfterTraining,
    'rest-day': copy.practiceWhenRestDay,
    anytime: copy.practiceWhenAnytime,
  };
  return labels[whenToUse];
};

const getEquipmentLabel = (equipment: PracticeEquipment, copy: Copy): string => {
  const labels: Record<PracticeEquipment, string> = {
    none: copy.practiceEquipmentNone,
    mat: copy.practiceEquipmentMat,
    'resistance-band': copy.practiceEquipmentResistanceBand,
  };
  return labels[equipment];
};

const buildMetaLine = (exercise: Exercise, copy: Copy): string | null => {
  if (exercise.whenToUse && exercise.whenToUse.length > 0) {
    const labels = exercise.whenToUse.map((item) => getWhenLabel(item, copy));
    return `${copy.practiceWhenToUse}: ${labels.join(' · ')}`;
  }

  if (exercise.equipment && exercise.equipment.length > 0) {
    const labels = exercise.equipment.map((item) => getEquipmentLabel(item, copy));
    return `${copy.practiceEquipment}: ${labels.join(' · ')}`;
  }

  return null;
};

export const PracticeCard = ({
  exercise,
  copy,
  locale,
  onSelect,
  motionIndex,
  variants,
  getTransition,
}: PracticeCardProps): ReactElement => {
  const categoryLabel = getPracticeCategoryLabel(exercise.category, copy);
  const categoryStyle = getPracticeCategoryStyle(exercise.category);
  const metaLine = buildMetaLine(exercise, copy);
  const name = exercise.name[locale] || exercise.name.en;
  const summary = exercise.summary[locale] || exercise.summary.en;

  const handleActivate = () => {
    onSelect(exercise.slug);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left card-hover-shadow"
      initial={false}
      variants={variants}
      transition={getTransition(motionIndex)}
      title={name}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold leading-tight">{name}</h3>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className="glossary-tag text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: categoryStyle.backgroundColor,
              color: categoryStyle.color,
            }}
          >
            {categoryLabel}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted leading-relaxed flex-1">{summary}</p>

      {metaLine && <p className="text-xs text-subtle">{metaLine}</p>}
    </motion.div>
  );
};
