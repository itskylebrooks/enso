import { describe, expect, it } from 'vitest';
import { getAppPageKey } from '../src/shared/app/AppScreenRouter';
import type { Technique } from '../src/shared/types';

const technique: Technique = {
  id: 'technique-1',
  slug: 'katate-tori-irimi-nage',
  name: { en: 'Katate-tori Irimi-nage', de: 'Katate-tori Irimi-nage' },
  category: 'throws',
  level: 'kyu4',
  summary: { en: 'Entering throw.', de: 'Eingangswurf.' },
  tags: [],
  versions: [],
};

describe('AppScreenRouter page keys', () => {
  it('preserves existing route transition page keys', () => {
    expect(
      getAppPageKey({
        route: 'techniques',
        activeSlug: 'katate-tori-irimi-nage',
        currentTechnique: technique,
      }),
    ).toBe('technique-technique-1');

    expect(
      getAppPageKey({
        route: 'exercises',
        activeSlug: 'dead-bug',
      }),
    ).toBe('exercises-dead-bug');

    expect(
      getAppPageKey({
        route: 'terms',
        activeSlug: 'aikido',
      }),
    ).toBe('terms-aikido');

    expect(
      getAppPageKey({
        route: 'bookmarks',
        activeSlug: null,
      }),
    ).toBe('bookmarks');
  });
});
