import type { KeyboardEvent, ReactElement, ReactNode, Ref } from 'react';
import { motion, type Transition, type Variants } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { Exercise, Locale, StudyStatus } from '@shared/types';
import { getExerciseCategoryLabel, getExerciseCategoryStyle } from '@shared/styles/exercises';
import { StudyStatusIndicator } from '@shared/components/ui/StudyStatusIcon';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

type ExerciseCardProps = {
  exercise: Exercise;
  copy: Copy;
  locale: Locale;
  onSelect: (slug: string) => void;
  motionIndex: number;
  actionSlot?: ReactNode;
  summarySlot?: ReactNode;
  isDimmed?: boolean;
  categoryPlacement?: 'header' | 'footer';
  headerAlign?: 'start' | 'center';
  summaryLines?: 2 | 3;
  compactSpacing?: boolean;
  onCardKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  cardRef?: Ref<HTMLDivElement>;
  enableLayoutAnimation?: boolean;
  studyStatus?: StudyStatus;
} & MotionProps;

export const ExerciseCard = ({
  exercise,
  copy,
  locale,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  actionSlot,
  summarySlot,
  isDimmed,
  categoryPlacement = 'header',
  headerAlign = 'start',
  summaryLines = 3,
  compactSpacing = false,
  onCardKeyDown,
  cardRef,
  enableLayoutAnimation = false,
  studyStatus = 'none',
}: ExerciseCardProps): ReactElement => {
  const categoryLabel = getExerciseCategoryLabel(exercise.category, copy);
  const categoryStyle = getExerciseCategoryStyle(exercise.category);
  const name = exercise.name[locale] || exercise.name.en;
  const summary = exercise.summary[locale] || exercise.summary.en;

  const handleActivate = () => {
    onSelect(exercise.slug);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onCardKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <motion.div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={
        `surface border surface-border rounded-2xl p-4 flex flex-col ${
          compactSpacing ? 'gap-2' : 'gap-3'
        } text-left card-hover-shadow` +
        (isDimmed ? ' pointer-events-none opacity-70 blur-card' : '')
      }
      initial={false}
      variants={variants}
      transition={getTransition(motionIndex)}
      layout={enableLayoutAnimation}
      title={name}
    >
      <div
        className={`flex justify-between gap-3 ${
          headerAlign === 'center' ? 'items-center' : 'items-start'
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="min-w-0 flex-1 text-base font-semibold leading-tight">{name}</h3>
            <StudyStatusIndicator
              status={studyStatus}
              practiceLabel={copy.collectionsStudyPractice}
              stableLabel={copy.collectionsStudyStable}
              className="mt-0.5"
            />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
          {categoryPlacement === 'header' && (
            <span
              className="glossary-tag text-xs font-medium px-2 py-1 rounded-full"
              style={{
                backgroundColor: categoryStyle.backgroundColor,
                color: categoryStyle.color,
              }}
            >
              {categoryLabel}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1">
        <p
          className={`text-sm text-muted leading-relaxed ${
            summaryLines === 2 ? 'line-clamp-2' : 'line-clamp-3'
          }${summarySlot ? ' opacity-0 pointer-events-none select-none' : ''}`}
          aria-hidden={Boolean(summarySlot)}
        >
          {summary}
        </p>
        {summarySlot && <div className="absolute inset-0 flex items-center">{summarySlot}</div>}
      </div>

      {categoryPlacement === 'footer' && (
        <div className="mt-auto flex justify-end pt-1">
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
      )}
    </motion.div>
  );
};
