import type { KeyboardEvent, ReactElement } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { GlossaryTerm, GlossaryProgress } from '../../../shared/types';
import type { Locale } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

type GlossaryBookmarkCardProps = {
  term: GlossaryTerm;
  locale: Locale;
  progress?: GlossaryProgress | null;
  copy: Copy;
  onSelect: (slug: string) => void;
  motionIndex: number;
  isDimmed?: boolean;
  actionSlot?: ReactElement;
} & MotionProps;

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

const getCategoryColor = (category: GlossaryTerm['category']): string => {
  const colors: Record<GlossaryTerm['category'], string> = {
    movement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    stance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    attack: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    etiquette: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    philosophy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
  };
  return colors[category];
};

const truncateDefinition = (text: string, maxLength: number = 120): string => {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? `${truncated.slice(0, lastSpace)}...` : `${truncated}...`;
};

export const GlossaryBookmarkCard = ({
  term,
  locale,
  progress,
  copy,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  prefersReducedMotion,
  isDimmed = false,
  actionSlot,
}: GlossaryBookmarkCardProps): ReactElement => {
  const definition = term.def[locale] || term.def.en;
  const categoryLabel = getCategoryLabel(term.category, copy);
  const categoryStyle = getCategoryColor(term.category);
  
  const handleActivate = () => {
    onSelect(term.slug);
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
      className={
        `group relative surface border surface-border rounded-2xl p-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] flex flex-col gap-3 text-left` +
        (isDimmed ? ' pointer-events-none opacity-70 blur-card' : '')
      }
      variants={variants}
      transition={getTransition(motionIndex)}
      whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 8px 20px -12px rgba(15,23,42,0.25)' }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      animate={isDimmed && !prefersReducedMotion ? { y: -2, boxShadow: '0 8px 20px -12px rgba(15,23,42,0.25)' } : {}}
    >
      {/* Action slot in top-right corner */}
      {actionSlot && (
        <div className="absolute top-3 right-3 z-10">
          {actionSlot}
        </div>
      )}
      
      {/* Header with term name only */}
      <div className="min-w-0 space-y-1">
        <h3 className="text-base font-semibold leading-tight" title={term.romaji}>
          {term.romaji}
        </h3>
        {term.jp && <div className="text-xs text-subtle truncate">{term.jp}</div>}
      </div>

      {/* Definition */}
      <p className="text-sm text-muted leading-relaxed flex-1">
        {truncateDefinition(definition, 140)}
      </p>

      {/* Category label in bottom right corner */}
      <div className="flex justify-end">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryStyle}`}>
          {categoryLabel}
        </span>
      </div>
    </motion.div>
  );
};