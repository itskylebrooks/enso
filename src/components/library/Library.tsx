import type { ReactElement } from 'react'
import { motion } from 'motion/react'

import { TechniqueCard } from './TechniqueCard'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { Copy } from '@/lib/i18n/copy'
import type { Locale, Progress, Technique } from '@/types'

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

  // Create a stable key that changes when technique IDs change to force remount on filter changes
  const techniqueKey = techniques.map(t => t.id).join(',');

  return (
    <motion.div
      key={techniqueKey}
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
        <motion.div 
          className="col-span-full text-sm text-muted"
          variants={listMotion.item}
          transition={getItemTransition(0)}
        >
          No techniques found for the selected filters.
        </motion.div>
      )}
    </motion.div>
  );
};
