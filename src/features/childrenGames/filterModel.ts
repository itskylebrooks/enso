import type { ChildrenGame, ChildrenGameFilters, ChildrenGameMaterial } from '@shared/types';

export const defaultChildrenGameFilters: ChildrenGameFilters = {
  settings: [],
  materials: [],
};

export const matchesChildrenGameFilters = (
  game: ChildrenGame,
  filters: ChildrenGameFilters,
): boolean => {
  if (
    filters.participantCount !== undefined &&
    (filters.participantCount < game.participants.min ||
      filters.participantCount > game.participants.max)
  ) {
    return false;
  }

  if (filters.settings.some((setting) => !game.settings[setting])) {
    return false;
  }

  if (
    filters.materials.length > 0 &&
    !filters.materials.some((material) => game.materials.includes(material))
  ) {
    return false;
  }

  return true;
};

export const filterChildrenGames = (
  games: ChildrenGame[],
  filters: ChildrenGameFilters,
): ChildrenGame[] => games.filter((game) => matchesChildrenGameFilters(game, filters));

export const getChildrenGameMaterials = (games: ChildrenGame[]): ChildrenGameMaterial[] => {
  const values = new Set(games.flatMap((game) => game.materials));
  const order: ChildrenGameMaterial[] = [
    'none',
    'soft-balls',
    'mat-floor',
    'werewolves-game',
    'indiaca',
    'blindfolds',
    'coasters',
  ];
  return order.filter((material) => values.has(material));
};
