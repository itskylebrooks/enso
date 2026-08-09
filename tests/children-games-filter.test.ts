import { describe, expect, it } from 'vitest';
import childrenGamesData from '../src/generated/content/children-games.json';
import {
  defaultChildrenGameFilters,
  filterChildrenGames,
  getChildrenGameMaterials,
} from '../src/features/childrenGames/filterModel';
import type { ChildrenGame, ChildrenGameFilters } from '../src/shared/types';

const games = childrenGamesData as ChildrenGame[];
const slugs = (filters: ChildrenGameFilters) =>
  filterChildrenGames(games, filters).map((game) => game.slug);

describe('children game filters', () => {
  it('matches participant counts inclusively at range boundaries', () => {
    expect(slugs({ ...defaultChildrenGameFilters, participantCount: 2 })).toEqual(['indiaka']);
    expect(slugs({ ...defaultChildrenGameFilters, participantCount: 120 })).toEqual([
      'burger-spiel',
    ]);
  });

  it('requires every selected setting', () => {
    const result = slugs({
      ...defaultChildrenGameFilters,
      settings: ['indoor', 'evening'],
    });
    expect(result).toEqual(
      expect.arrayContaining([
        'indiaka',
        'raeuber-und-gendarm',
        'jeder-gegen-jeden',
        'reise-nach-tokio',
      ]),
    );
    expect(result).toHaveLength(4);
  });

  it('matches any selected material', () => {
    expect(
      slugs({
        ...defaultChildrenGameFilters,
        materials: ['blindfolds', 'coasters'],
      }),
    ).toEqual(expect.arrayContaining(['dampfer-im-nebel', 'reise-nach-tokio']));
  });

  it('combines participant, setting, and material groups with AND', () => {
    expect(
      slugs({
        participantCount: 10,
        settings: ['indoor', 'evening'],
        materials: ['none'],
      }),
    ).toEqual(expect.arrayContaining(['raeuber-und-gendarm', 'jeder-gegen-jeden']));
  });

  it('derives only material choices used by the catalog', () => {
    expect(getChildrenGameMaterials(games)).toEqual([
      'none',
      'soft-balls',
      'mat-floor',
      'werewolves-game',
      'indiaca',
      'blindfolds',
      'coasters',
    ]);
  });
});
