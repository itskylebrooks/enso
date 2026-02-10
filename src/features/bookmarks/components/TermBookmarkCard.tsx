import type { KeyboardEvent, ReactElement, ReactNode, Ref } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { GlossaryTerm, GlossaryProgress, Locale, StudyStatus } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';
import { getCategoryStyle, getCategoryLabel } from '../../../shared/styles/terms';
import { StudyStatusIndicator } from '@shared/components/ui/StudyStatusIcon';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

type TermBookmarkCardProps = {
  term: GlossaryTerm;
  locale: Locale;
  progress?: GlossaryProgress | null;
  copy: Copy;
  onSelect: (slug: string) => void;
  motionIndex: number;
  isDimmed?: boolean;
  actionSlot?: ReactElement;
  descriptionSlot?: ReactNode;
  showJapanese?: boolean;
  headerAlign?: 'start' | 'center';
  onCardKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  cardRef?: Ref<HTMLDivElement>;
  enableLayoutAnimation?: boolean;
  studyStatus?: StudyStatus;
} & MotionProps;

export const TermBookmarkCard = ({
  term,
  locale,
  copy,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  // prefersReducedMotion removed (no hover motion)
  isDimmed = false,
  actionSlot,
  descriptionSlot,
  showJapanese = true,
  headerAlign = 'start',
  onCardKeyDown,
  cardRef,
  enableLayoutAnimation = false,
  studyStatus = 'none',
}: TermBookmarkCardProps): ReactElement => {
  const definition = term.def[locale] || term.def.en;
  const categoryLabel = getCategoryLabel(term.category, copy);
  const categoryStyle = getCategoryStyle(term.category);

  const handleActivate = () => {
    onSelect(term.slug);
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
        `surface border surface-border rounded-2xl p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] flex flex-col gap-3 text-left card-hover-shadow` +
        (isDimmed ? ' pointer-events-none opacity-70 blur-card' : '')
      }
      initial={false}
      variants={variants}
      transition={getTransition(motionIndex)}
      layout={enableLayoutAnimation}
      /* Hover and tap motion removed to disable hover effects completely */
      animate={isDimmed ? {} : {}}
    >
      <div
        className={`flex justify-between gap-3 ${
          headerAlign === 'center' ? 'items-center' : 'items-start'
        }`}
      >
        <div className="min-w-0 space-y-1">
          <div className="flex items-start gap-2">
            <h3
              className="min-w-0 flex-1 text-base font-medium leading-snug line-clamp-2"
              title={term.romaji}
            >
              {term.romaji}
            </h3>
            <StudyStatusIndicator
              status={studyStatus}
              practiceLabel={copy.collectionsStudyPractice}
              stableLabel={copy.collectionsStudyStable}
              className="mt-0.5"
            />
          </div>
          {showJapanese && term.jp && <div className="text-xs text-subtle truncate">{term.jp}</div>}
        </div>
        <div className="flex items-center gap-2">{actionSlot}</div>
      </div>

      <div className="relative">
        <p
          className={`text-sm text-muted leading-relaxed${
            descriptionSlot ? ' opacity-0 pointer-events-none select-none' : ''
          }`}
          aria-hidden={Boolean(descriptionSlot)}
        >
          {definition}
        </p>
        {descriptionSlot && (
          <div className="absolute inset-0 flex items-center">{descriptionSlot}</div>
        )}
      </div>

      {/* Category label at bottom */}
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
    </motion.div>
  );
};
