import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { Locale, Technique } from '@shared/types';
import { LevelBadge } from '@shared/components';
import { EmphasizedName } from '@shared/components';
import { useMotionPreferences } from '@shared/components/ui/motion';

export type ProgressListProps = {
  items: Technique[];
  locale: Locale;
  copy: Copy;
  onOpen: (slug: string) => void;
};

export const ProgressList = ({ items, locale, copy, onOpen }: ProgressListProps): ReactElement => {
  const { listMotion, getItemTransition } = useMotionPreferences();

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
            >
              <div className="min-w-0 space-y-1">
                <div className="leading-snug line-clamp-2" title={label}>
                  <EmphasizedName name={label} />
                </div>
                {technique.jp && (
                  <div className="text-[10px] text-subtle truncate">{technique.jp}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <LevelBadge locale={locale} level={technique.level} />
              </div>
            </motion.button>
          </li>
        );
      })}
    </motion.ul>
  );
};
