import type { KeyboardEvent, ReactElement } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { GlossaryTerm } from '../../../shared/types';
import type { Locale } from '../../../shared/types';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

type GlossaryCardProps = {
  term: GlossaryTerm;
  locale: Locale;
  onSelect: (slug: string) => void;
  motionIndex: number;
} & MotionProps;

const getCategoryLabel = (category: GlossaryTerm['category']): string => {
  const labels: Record<GlossaryTerm['category'], string> = {
    movement: 'Movement',
    stance: 'Stance',
    attack: 'Attack',
    etiquette: 'Etiquette',
    philosophy: 'Philosophy',
    other: 'Other',
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

export const GlossaryCard = ({
  term,
  locale,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  prefersReducedMotion,
}: GlossaryCardProps): ReactElement => {
  const definition = term.def[locale] || term.def.en;
  const categoryLabel = getCategoryLabel(term.category);
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

  const ariaLabel = `${term.romaji} – ${definition}`;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left cursor-pointer"
      variants={variants}
      transition={getTransition(motionIndex)}
      whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 8px 20px -12px rgba(15,23,42,0.25)' }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      aria-label={ariaLabel}
    >
      {/* Header with romaji and badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold leading-tight">{term.romaji}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {term.jp && (
              <span className="text-sm font-medium text-muted bg-black/5 px-2 py-0.5 rounded-sm dark:bg-white/10">
                {term.jp}
              </span>
            )}
            {term.kana && (
              <span className="text-xs text-muted bg-black/5 px-2 py-0.5 rounded-sm dark:bg-white/10">
                {term.kana}
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${categoryStyle}`}>
          {categoryLabel}
        </span>
      </div>

      {/* Definition */}
      <p className="text-sm text-muted leading-relaxed flex-1">
        {truncateDefinition(definition, 140)}
      </p>
    </motion.div>
  );
};