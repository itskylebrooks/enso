import childrenGamesData from '@generated/content/children-games.json';
import type { ChildrenGame } from '@shared/types';

const childrenGames = childrenGamesData as ChildrenGame[];

export async function loadAllChildrenGames(): Promise<ChildrenGame[]> {
  return childrenGames;
}

export async function loadChildrenGameBySlug(slug: string): Promise<ChildrenGame | undefined> {
  return childrenGames.find((game) => game.slug === slug);
}
