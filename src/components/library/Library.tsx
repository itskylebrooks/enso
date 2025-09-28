import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Locale, Progress, Technique } from '../../types';
import type { Copy } from '../../constants/i18n';
import { TechniqueCard } from './TechniqueCard';
import { useMotionPreferences } from '../ui/motion';

const buildProgressMap = (entries: Progress[]): Record<string, Progress> =>
  Object.fromEntries(entries.map((entry) => [entry.techniqueId, entry]));

type LibraryProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  progress: Progress[];
  onOpen: (slug: string) => void;
};

export const Library = ({ copy, locale, techniques, progress, onOpen }: LibraryProps): ReactElement => {
  const progressById = buildProgressMap(progress);
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={listMotion.container}
      initial="hidden"
      animate="show"
      layout
    >
      {techniques.map((technique, index) => (
        <TechniqueCard
          key={technique.id}
          technique={technique}
          locale={locale}
          progress={progressById[technique.id]}
          copy={copy}
          onSelect={onOpen}
          motionIndex={index}
          variants={listMotion.item}
          getTransition={getItemTransition}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
      {techniques.length === 0 && (
        <div className="col-span-full text-sm text-muted">No techniques found for the selected filters.</div>
      )}
    </motion.div>
  );
};
