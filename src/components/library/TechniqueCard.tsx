import type { ReactElement } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Progress, Technique } from '../../types';
import { LevelBadge, EmphasizedName } from '../common';
import { StarIcon, CheckIcon } from '../common/icons';
import { getTaxonomyLabel } from '../../i18n/taxonomy';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

export type TechniqueCardProps = {
  technique: Technique;
  locale: Locale;
  progress?: Progress;
  copy: Copy;
  onSelect: (slug: string) => void;
  motionIndex: number;
} & MotionProps;

export const TechniqueCard = ({
  technique,
  locale,
  progress,
  copy,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  prefersReducedMotion,
}: TechniqueCardProps): ReactElement => {
  const stanceLabel = technique.stance ? getTaxonomyLabel(locale, 'stance', technique.stance) : null;
  const weaponLabel =
    technique.weapon && technique.weapon !== 'empty-hand'
      ? getTaxonomyLabel(locale, 'weapon', technique.weapon)
      : null;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(technique.slug)}
      className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left"
      variants={variants}
      transition={getTransition(motionIndex)}
      whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 16px 30px -22px rgba(15,23,42,0.35)' }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      title={technique.name[locale]}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="text-base font-medium leading-snug line-clamp-2" title={technique.name[locale]}>
            <EmphasizedName name={technique.name[locale]} />
          </div>
          {technique.jp && <div className="text-xs text-subtle truncate">{technique.jp}</div>}
        </div>
        <div className="flex items-center gap-2 text-base transition-soft motion-ease">
          {progress?.focus && (
            <span title={copy.focus} className="inline-flex text-[0px]">
              <StarIcon className="w-4 h-4" />
            </span>
          )}
          {progress?.confident && (
            <span title={copy.confident} className="inline-flex text-[0px]">
              <CheckIcon className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-muted leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {technique.description[locale]}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-subtle">
          {stanceLabel && <span className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">{stanceLabel}</span>}
          {weaponLabel && <span className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">{weaponLabel}</span>}
        </div>
        <LevelBadge locale={locale} level={technique.level} />
      </div>
    </motion.button>
  );
};
