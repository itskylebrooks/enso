import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ChildrenGame } from '../../../shared/types';
import { parseChildrenGame } from '../schemas/childrenGame';

const childrenGamesPath = path.join(process.cwd(), 'content', 'children-games.json');

export const loadAllChildrenGames = async (): Promise<ChildrenGame[]> => {
  const raw = await readFile(childrenGamesPath, 'utf8');
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid children games file: expected an array');
  }

  const games = parsed.map(parseChildrenGame);
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const game of games) {
    if (seenIds.has(game.id)) throw new Error(`Duplicate children game id: ${game.id}`);
    if (seenSlugs.has(game.slug)) throw new Error(`Duplicate children game slug: ${game.slug}`);
    seenIds.add(game.id);
    seenSlugs.add(game.slug);
  }

  return games.sort((a, b) => a.name.de.localeCompare(b.name.de, 'de', { sensitivity: 'base' }));
};

export const loadChildrenGameBySlug = async (slug: string): Promise<ChildrenGame | undefined> => {
  const games = await loadAllChildrenGames();
  return games.find((game) => game.slug === slug);
};
