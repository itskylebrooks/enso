import { ExerciseCard } from '@features/exercises/components/ExerciseCard';
import { TermCard } from '@features/terms/components/TermCard';
import { TechniqueCard } from '@features/technique/components/TechniqueCard';
import { useMotionPreferences } from '@shared/components/ui/motion';
import type { Copy } from '@shared/constants/i18n';
import { getRecents, type RecentItem } from '@shared/services/recentsService';
import type { Exercise, GlossaryTerm, Locale, Progress, Technique } from '@shared/types';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';

type ContinueCardProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  techniqueProgress: Progress[];
  glossaryTerms: GlossaryTerm[];
  exercises: Exercise[];
  onOpenTechnique: (slug: string) => void;
  onOpenTerm: (slug: string) => void;
  onOpenExercise: (slug: string) => void;
};

type ContinueItem =
  | {
      type: 'technique';
      data: Technique;
      key: string;
      openedEntry?: 'irimi' | 'tenkan' | 'omote' | 'ura';
    }
  | { type: 'term'; data: GlossaryTerm; key: string }
  | { type: 'exercise'; data: Exercise; key: string };

const MAX_VISIBLE_ITEMS = 3;

const buildProgressMap = (entries: Progress[]): Record<string, Progress> =>
  Object.fromEntries(entries.map((entry) => [entry.techniqueId, entry]));

const resolveRecentItems = (
  recents: RecentItem[],
  techniques: Technique[],
  glossaryTerms: GlossaryTerm[],
  exercises: Exercise[],
): ContinueItem[] => {
  const techniqueBySlug = new Map(techniques.map((item) => [item.slug, item]));
  const termBySlug = new Map(glossaryTerms.map((item) => [item.slug, item]));
  const exerciseBySlug = new Map(exercises.map((item) => [item.slug, item]));
  const resolved: ContinueItem[] = [];

  for (const recent of recents) {
    if (resolved.length >= MAX_VISIBLE_ITEMS) break;

    if (recent.type === 'technique') {
      const technique = techniqueBySlug.get(recent.slug);
      if (!technique) continue;
      resolved.push({
        type: 'technique',
        data: technique,
        key: `technique:${technique.slug}`,
        openedEntry: recent.entry,
      });
      continue;
    }

    if (recent.type === 'term') {
      const term = termBySlug.get(recent.slug);
      if (!term) continue;
      resolved.push({
        type: 'term',
        data: term,
        key: `term:${term.slug}`,
      });
      continue;
    }

    const exercise = exerciseBySlug.get(recent.slug);
    if (!exercise) continue;
    resolved.push({
      type: 'exercise',
      data: exercise,
      key: `exercise:${exercise.slug}`,
    });
  }

  return resolved;
};

export const ContinueCard = ({
  copy,
  locale,
  techniques,
  techniqueProgress,
  glossaryTerms,
  exercises,
  onOpenTechnique,
  onOpenTerm,
  onOpenExercise,
}: ContinueCardProps): ReactElement | null => {
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();
  const progressById = useMemo(() => buildProgressMap(techniqueProgress), [techniqueProgress]);

  useEffect(() => {
    const refreshRecents = () => setRecents(getRecents());
    refreshRecents();

    const handleFocus = () => refreshRecents();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshRecents();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const items = useMemo(
    () => resolveRecentItems(recents, techniques, glossaryTerms, exercises),
    [recents, techniques, glossaryTerms, exercises],
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border surface-border surface card-hover-shadow pt-2 pb-4 px-4 md:pt-3 md:pb-5 md:px-5 space-y-3">
      <h2 className="text-lg md:text-xl font-semibold text-center">{copy.homeRecentlyViewedTitle}</h2>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 no-select"
        variants={listMotion.container}
        initial={false}
        animate="show"
      >
        {items.map((item, index) => {
          if (item.type === 'technique') {
            return (
              <TechniqueCard
                key={item.key}
                technique={item.data}
                locale={locale}
                progress={progressById[item.data.id]}
                copy={copy}
                onSelect={(slug) => onOpenTechnique(slug)}
                openedEntry={item.openedEntry}
                motionIndex={index}
                variants={listMotion.item}
                getTransition={getItemTransition}
                prefersReducedMotion={prefersReducedMotion}
              />
            );
          }

          if (item.type === 'term') {
            return (
              <TermCard
                key={item.key}
                term={item.data}
                locale={locale}
                copy={copy}
                onSelect={onOpenTerm}
                motionIndex={index}
                variants={listMotion.item}
                getTransition={getItemTransition}
                prefersReducedMotion={prefersReducedMotion}
              />
            );
          }

          return (
            <ExerciseCard
              key={item.key}
              exercise={item.data}
              copy={copy}
              locale={locale}
              onSelect={onOpenExercise}
              motionIndex={index}
              variants={listMotion.item}
              getTransition={getItemTransition}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
      </motion.div>
    </section>
  );
};
