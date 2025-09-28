import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Locale, Progress, Technique } from '../../types';
import type { Copy } from '../../constants/i18n';
import { TechniqueCard } from '../library/TechniqueCard';
import { useMotionPreferences } from '../ui/motion';

type ProgressListsProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  progress: Progress[];
  onOpen: (slug: string) => void;
};

export const ProgressLists = ({ copy, locale, techniques, progress, onOpen }: ProgressListsProps): ReactElement => {
  const progressById = Object.fromEntries(progress.map((entry) => [entry.techniqueId, entry]));
  const bookmarked = techniques.filter((technique) => progressById[technique.id]?.bookmarked);
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();

  return (
    <div>
      <h2 className="text-sm font-semibold mb-4">{copy.progress}</h2>
      <motion.div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={listMotion.container}
        initial="hidden"
        animate="show"
        layout
      >
        {bookmarked.map((technique, index) => (
          <TechniqueCard
            key={technique.id}
            technique={technique}
            locale={locale}
            copy={copy}
            onSelect={onOpen}
            motionIndex={index}
            variants={listMotion.item}
            getTransition={getItemTransition}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
        {bookmarked.length === 0 && <div className="col-span-full text-sm text-muted">No bookmarks yet.</div>}
      </motion.div>
    </div>
  );
};
