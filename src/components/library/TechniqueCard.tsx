import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { Copy } from '../../shared/constants/i18n';
import type { Locale, Progress, Technique } from '../../shared/types';
import { LevelBadge } from '../common';
import { EmphasizedName } from '../../shared/components';
import { getTaxonomyLabel } from '../../shared/i18n/taxonomy';

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
  actionSlot?: ReactNode;
  isDimmed?: boolean;
} & MotionProps;

export const TechniqueCard = ({
  technique,
  locale,
  // progress and copy intentionally unused after removing focus/confident indicators
  onSelect,
  motionIndex,
  variants,
  getTransition,
  prefersReducedMotion,
  actionSlot,
  isDimmed,
}: TechniqueCardProps): ReactElement => {
  // Get available entry modes from the first version (assume all versions have same entries)
  const availableEntries = technique.versions[0]?.stepsByEntry || {};
  const entryLabels: string[] = [];
  
  if (availableEntries.irimi) {
    entryLabels.push(locale === 'de' ? 'Irimi (Omote)' : 'Irimi (Omote)');
  }
  if (availableEntries.tenkan) {
    entryLabels.push(locale === 'de' ? 'Tenkan (Ura)' : 'Tenkan (Ura)');
  }

  const weaponLabel =
    technique.weapon && technique.weapon !== 'empty-hand'
      ? getTaxonomyLabel(locale, 'weapon', technique.weapon)
      : null;

  const handleActivate = () => {
    onSelect(technique.slug);
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
        `surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left` +
        (isDimmed ? ' pointer-events-none opacity-70 blur-card' : '')
      }
      variants={variants}
      transition={getTransition(motionIndex)}
      whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 16px 30px -22px rgba(15,23,42,0.35)' }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      animate={isDimmed && !prefersReducedMotion ? { y: -2, boxShadow: '0 16px 30px -22px rgba(15,23,42,0.35)' } : {}}
      title={technique.name[locale]}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="text-base font-medium leading-snug line-clamp-2" title={technique.name[locale]}>
            <EmphasizedName name={technique.name[locale]} />
          </div>
          {technique.jp && <div className="text-xs text-subtle truncate">{technique.jp}</div>}
        </div>
        <div className="flex items-center gap-2">
          {actionSlot}
        </div>
      </div>

      <p className="text-sm text-muted leading-relaxed">
        {technique.summary[locale] ?? technique.summary.en}
      </p>

      <div className="mt-auto flex items-end justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-subtle">
          {entryLabels.map((label) => (
            <span key={label} className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">{label}</span>
          ))}
          {weaponLabel && <span className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">{weaponLabel}</span>}
        </div>
        <LevelBadge locale={locale} level={technique.level} />
      </div>
    </motion.div>
  );
};
