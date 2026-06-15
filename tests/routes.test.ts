import { describe, expect, it } from 'vitest';
import {
  buildTechniqueUrl,
  buildTechniqueUrlWithVariant,
  parseTechniquePath,
  parseTechniqueVariantParams,
} from '../src/shared/constants/urls';
import {
  buildGuideRoutinePath,
  gradeToGuideRoute,
  guideRouteToGrade,
  guideRouteToRoutine,
  parseLocation,
  routeToPath,
  routineToGuideRoute,
} from '../src/shared/navigation/appRoutes';

describe('technique route helpers', () => {
  it('builds canonical technique detail URLs under /techniques', () => {
    expect(buildTechniqueUrl('katate-tori-irimi-nage')).toBe('/techniques/katate-tori-irimi-nage');
  });

  it('parses canonical and legacy paths', () => {
    expect(parseTechniquePath('/techniques/katate-tori-irimi-nage')).toEqual({
      slug: 'katate-tori-irimi-nage',
      trainerId: undefined,
      entry: undefined,
    });

    expect(parseTechniquePath('/library/katate-tori-irimi-nage')).toEqual({
      slug: 'katate-tori-irimi-nage',
      trainerId: undefined,
      entry: undefined,
    });

    expect(parseTechniquePath('/technique/katate-tori-irimi-nage/alfred-haase/irimi')).toEqual({
      slug: 'katate-tori-irimi-nage',
      trainerId: 'alfred-haase',
      entry: 'irimi',
    });
  });

  it('encodes and parses variant state via query params', () => {
    const url = buildTechniqueUrlWithVariant('katate-tori-irimi-nage', {
      hanmi: 'ai-hanmi',
      direction: 'irimi',
      weapon: 'empty',
      versionId: 'v-base',
    });

    const parsed = new URL(url, 'https://enso.local');
    expect(parsed.pathname).toBe('/techniques/katate-tori-irimi-nage');

    expect(parseTechniqueVariantParams(parsed.pathname, parsed.search)).toEqual({
      hanmi: 'ai-hanmi',
      direction: 'irimi',
      weapon: 'empty',
      versionId: null,
    });
  });
});

describe('app route helpers', () => {
  it('maps top-level routes to canonical paths', () => {
    expect(routeToPath('home')).toBe('/');
    expect(routeToPath('techniques')).toBe('/techniques');
    expect(routeToPath('terms')).toBe('/terms');
    expect(routeToPath('exercises')).toBe('/exercises');
    expect(routeToPath('bookmarks')).toBe('/bookmarks');
    expect(routeToPath('sync')).toBe('/sync');
  });

  it('maps guide grade and routine routes both ways', () => {
    expect(gradeToGuideRoute('kyu5')).toBe('guideKyu5');
    expect(guideRouteToGrade('guideKyu5')).toBe('kyu5');
    expect(gradeToGuideRoute('dan5')).toBe('guideDan5');
    expect(guideRouteToGrade('guideDan5')).toBe('dan5');

    expect(routineToGuideRoute('warm-up')).toBe('guideRoutineWarmUp');
    expect(guideRouteToRoutine('guideRoutineWarmUp')).toBe('warm-up');
    expect(buildGuideRoutinePath('warm-up', 'joint-prep')).toBe('/guide/warm-up/joint-prep');
  });

  it('parses canonical and legacy app locations', () => {
    expect(parseLocation('/library')).toEqual({ route: 'techniques', slug: null });
    expect(parseLocation('/glossary/aikido')).toEqual({ route: 'terms', slug: 'aikido' });
    expect(parseLocation('/practice/dead-bug')).toEqual({
      route: 'exercises',
      slug: 'dead-bug',
    });
    expect(parseLocation('/basics')).toEqual({ route: 'guide', slug: null });
  });

  it('preserves source route state when parsing detail paths', () => {
    expect(parseLocation('/techniques/katate-tori-irimi-nage', { route: 'bookmarks' })).toEqual({
      route: 'bookmarks',
      slug: 'katate-tori-irimi-nage',
      techniqueParams: {
        slug: 'katate-tori-irimi-nage',
        trainerId: undefined,
        entry: undefined,
      },
    });

    expect(parseLocation('/terms/irimi-omote')).toEqual({ route: 'terms', slug: 'irimi' });
  });
});
