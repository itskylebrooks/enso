import { describe, expect, it } from 'vitest';
import {
  buildTechniqueUrl,
  buildTechniqueUrlWithVariant,
  parseTechniquePath,
  parseTechniqueVariantParams,
} from '../src/shared/constants/urls';
import {
  buildLibraryRoutinePath,
  gradeToGuideRoute,
  guideRouteToGrade,
  routeToRoutine,
  parseLocation,
  routeToPath,
  routineToLibraryRoute,
} from '../src/shared/navigation/appRoutes';

describe('technique route helpers', () => {
  it('builds canonical technique detail URLs under /library/techniques', () => {
    expect(buildTechniqueUrl('katate-tori-irimi-nage')).toBe(
      '/library/techniques/katate-tori-irimi-nage',
    );
  });

  it('parses canonical technique paths only', () => {
    expect(parseTechniquePath('/library/techniques/katate-tori-irimi-nage')).toEqual({
      slug: 'katate-tori-irimi-nage',
      trainerId: undefined,
      entry: undefined,
    });

    expect(parseTechniquePath('/techniques/katate-tori-irimi-nage')).toBeNull();
  });

  it('encodes and parses variant state via query params', () => {
    const url = buildTechniqueUrlWithVariant('katate-tori-irimi-nage', {
      hanmi: 'ai-hanmi',
      direction: 'irimi',
      weapon: 'empty',
      versionId: 'v-base',
    });

    const parsed = new URL(url, 'https://enso.local');
    expect(parsed.pathname).toBe('/library/techniques/katate-tori-irimi-nage');

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
    expect(routeToPath('library')).toBe('/library');
    expect(routeToPath('libraryTechniques')).toBe('/library/techniques');
    expect(routeToPath('libraryTerms')).toBe('/library/terms');
    expect(routeToPath('libraryExercises')).toBe('/library/exercises');
    expect(routeToPath('libraryRoutines')).toBe('/library/routines');
    expect(routeToPath('study')).toBe('/study');
    expect(routeToPath('studyLearn')).toBe('/study/learn');
    expect(routeToPath('teach')).toBe('/teach');
    expect(routeToPath('sync')).toBe('/sync');
  });

  it('maps guide grade and library routine routes both ways', () => {
    expect(gradeToGuideRoute('kyu5')).toBe('guideKyu5');
    expect(guideRouteToGrade('guideKyu5')).toBe('kyu5');
    expect(gradeToGuideRoute('dan5')).toBe('guideDan5');
    expect(guideRouteToGrade('guideDan5')).toBe('dan5');

    expect(routineToLibraryRoute('warm-up')).toBe('libraryRoutineWarmUp');
    expect(routeToRoutine('libraryRoutineWarmUp')).toBe('warm-up');
    expect(buildLibraryRoutinePath('warm-up', 'joint-prep')).toBe(
      '/library/routines/warm-up/joint-prep',
    );
  });

  it('parses canonical app locations', () => {
    expect(parseLocation('/library')).toEqual({ route: 'library', slug: null });
    expect(parseLocation('/library/techniques')).toEqual({
      route: 'libraryTechniques',
      slug: null,
    });
    expect(parseLocation('/library/terms/aikido')).toEqual({ route: 'libraryTerms', slug: 'aikido' });
    expect(parseLocation('/library/exercises/dead-bug')).toEqual({
      route: 'libraryExercises',
      slug: 'dead-bug',
    });
    expect(parseLocation('/library/routines')).toEqual({ route: 'libraryRoutines', slug: null });
    expect(parseLocation('/library/routines/warm-up')).toEqual({
      route: 'libraryRoutineWarmUp',
      slug: null,
    });
    expect(parseLocation('/study')).toEqual({ route: 'study', slug: null });
    expect(parseLocation('/study/learn')).toEqual({ route: 'studyLearn', slug: null });
    expect(parseLocation('/teach')).toEqual({ route: 'teach', slug: null });
  });

  it('preserves source route state when parsing detail paths', () => {
    expect(parseLocation('/library/techniques/katate-tori-irimi-nage', { route: 'study' })).toEqual({
      route: 'study',
      slug: 'katate-tori-irimi-nage',
      techniqueParams: {
        slug: 'katate-tori-irimi-nage',
        trainerId: undefined,
        entry: undefined,
      },
    });

    expect(parseLocation('/library/terms/irimi-omote')).toEqual({
      route: 'libraryTerms',
      slug: 'irimi',
    });
  });
});
