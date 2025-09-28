import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Progress, Technique } from '../../types';
import { EmphasizedName, LevelBadge } from '../common';
import { StarIcon, CheckIcon } from '../common/icons';
import { useMotionPreferences } from '../ui/motion';

export type ProgressListProps = {
  items: Technique[];
  locale: Locale;
  copy: Copy;
  progressById: Record<string, Progress>;
  onOpen: (slug: string) => void;
};

export const ProgressList = ({ items, locale, copy, progressById, onOpen }: ProgressListProps): ReactElement => {
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();

  if (items.length === 0) {
    return <div className="text-sm text-muted">—</div>;
  }

  return (
    <motion.ul
      className="flex flex-col gap-3"
      variants={listMotion.container}
      initial="hidden"
      animate="show"
      layout
    >
      {items.map((technique, index) => {
        const entry = progressById[technique.id];
        const label = technique.name[locale];

        return (
          <li key={technique.id}>
            <motion.button
              type="button"
              onClick={() => onOpen(technique.slug)}
              className="w-full text-left rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 flex items-start justify-between gap-4"
              aria-label={`${copy.openAriaPrefix} ${label}`}
              title={label}
              variants={listMotion.item}
              transition={getItemTransition(index)}
              whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 12px 24px -20px rgba(15,23,42,0.35)' }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
            >
              <div className="min-w-0 space-y-1">
                <div className="leading-snug line-clamp-2" title={label}>
                  <EmphasizedName name={label} />
                </div>
                {technique.jp && <div className="text-[10px] text-subtle truncate">{technique.jp}</div>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <LevelBadge locale={locale} level={technique.level} />
                {entry?.focus && (
                  <span title={copy.focus} className="inline-flex text-[0px]">
                    <StarIcon className="w-3.5 h-3.5" />
                  </span>
                )}
                {entry?.confident && (
                  <span title={copy.confident} className="inline-flex text-[0px]">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </motion.button>
          </li>
        );
      })}
    </motion.ul>
  );
};
