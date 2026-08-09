import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { ChildrenGame, ChildrenGameFilters, Locale } from '@shared/types';
import type { Copy } from '@shared/constants/i18n';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { filterChildrenGames } from '../filterModel';
import { ChildrenGameCard } from './ChildrenGameCard';

type ChildrenGamesPageProps = {
  games: ChildrenGame[];
  filters: ChildrenGameFilters;
  copy: Copy;
  locale: Locale;
  onOpenGame: (slug: string) => void;
};

export const ChildrenGamesPage = ({
  games,
  filters,
  copy,
  locale,
  onOpenGame,
}: ChildrenGamesPageProps): ReactElement => {
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();
  const filteredGames = filterChildrenGames(games, filters).sort((a, b) =>
    (a.name[locale] || a.name.de).localeCompare(b.name[locale] || b.name.de, locale, {
      sensitivity: 'base',
    }),
  );

  if (filteredGames.length === 0) {
    return (
      <div className="py-12 text-center no-select">
        <p className="text-muted">{copy.childrenGames.emptyFiltered}</p>
      </div>
    );
  }

  const key = filteredGames.map((game) => game.id).join(',');
  return (
    <motion.div
      key={key}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 no-select"
      variants={listMotion.container}
      initial={false}
      animate="show"
    >
      {filteredGames.map((game, index) => (
        <ChildrenGameCard
          key={game.id}
          game={game}
          copy={copy}
          locale={locale}
          onSelect={onOpenGame}
          motionIndex={index}
          variants={listMotion.item}
          getTransition={getItemTransition}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </motion.div>
  );
};
