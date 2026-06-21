import { parseTechniquePath } from '@shared/constants/urls';
import type { AppRoute, EntryMode, Grade, GuideRoutine } from '@shared/types';

export type AppSection = 'guide' | 'library' | 'study' | 'teach';

export type HistoryState = {
  route?: AppRoute;
  slug?: string;
  trainerId?: string;
  entry?: EntryMode;
  sourceRoute?: AppRoute;
  sourceSlug?: string;
};

export type TechniqueParams = {
  slug: string;
  trainerId?: string;
  entry?: EntryMode;
};

export type ParsedAppLocation = {
  route: AppRoute;
  slug: string | null;
  techniqueParams?: TechniqueParams;
};

export const routeToPath = (route: AppRoute): string => {
  switch (route) {
    case 'home':
      return '/';
    case 'about':
      return '/about';
    case 'guide':
      return '/guide';
    case 'guideAdvanced':
      return '/guide/advanced';
    case 'guideDan':
      return '/guide/dan';
    case 'guideKyu5':
      return '/guide/5-kyu';
    case 'guideKyu4':
      return '/guide/4-kyu';
    case 'guideKyu3':
      return '/guide/3-kyu';
    case 'guideKyu2':
      return '/guide/2-kyu';
    case 'guideKyu1':
      return '/guide/1-kyu';
    case 'guideDan1':
      return '/guide/1-dan';
    case 'guideDan2':
      return '/guide/2-dan';
    case 'guideDan3':
      return '/guide/3-dan';
    case 'guideDan4':
      return '/guide/4-dan';
    case 'guideDan5':
      return '/guide/5-dan';
    case 'sync':
      return '/sync';
    case 'feedback':
      return '/feedback';
    case 'library':
      return '/library';
    case 'libraryTechniques':
      return '/library/techniques';
    case 'libraryTerms':
      return '/library/terms';
    case 'libraryExercises':
      return '/library/exercises';
    case 'libraryRoutines':
      return '/library/routines';
    case 'libraryRoutineWarmUp':
      return '/library/routines/warm-up';
    case 'libraryRoutineCooldown':
      return '/library/routines/cooldown';
    case 'libraryRoutineMobility':
      return '/library/routines/mobility';
    case 'libraryRoutineStrength':
      return '/library/routines/strength';
    case 'libraryRoutineSkill':
      return '/library/routines/skill';
    case 'libraryRoutineRecovery':
      return '/library/routines/recovery';
    case 'study':
      return '/study';
    case 'studyLearn':
      return '/study/learn';
    case 'teach':
      return '/teach';
    default:
      return '/';
  }
};

export const guideRouteToGrade = (route: AppRoute): Grade | null => {
  switch (route) {
    case 'guideKyu5':
      return 'kyu5';
    case 'guideKyu4':
      return 'kyu4';
    case 'guideKyu3':
      return 'kyu3';
    case 'guideKyu2':
      return 'kyu2';
    case 'guideKyu1':
      return 'kyu1';
    case 'guideDan1':
      return 'dan1';
    case 'guideDan2':
      return 'dan2';
    case 'guideDan3':
      return 'dan3';
    case 'guideDan4':
      return 'dan4';
    case 'guideDan5':
      return 'dan5';
    default:
      return null;
  }
};

export const gradeToGuideRoute = (grade: Grade): AppRoute | null => {
  switch (grade) {
    case 'kyu5':
      return 'guideKyu5';
    case 'kyu4':
      return 'guideKyu4';
    case 'kyu3':
      return 'guideKyu3';
    case 'kyu2':
      return 'guideKyu2';
    case 'kyu1':
      return 'guideKyu1';
    case 'dan1':
      return 'guideDan1';
    case 'dan2':
      return 'guideDan2';
    case 'dan3':
      return 'guideDan3';
    case 'dan4':
      return 'guideDan4';
    case 'dan5':
      return 'guideDan5';
    default:
      return null;
  }
};

export const routineToLibraryRoute = (routine: GuideRoutine): AppRoute => {
  switch (routine) {
    case 'warm-up':
      return 'libraryRoutineWarmUp';
    case 'cooldown':
      return 'libraryRoutineCooldown';
    case 'mobility':
      return 'libraryRoutineMobility';
    case 'strength':
      return 'libraryRoutineStrength';
    case 'skill':
      return 'libraryRoutineSkill';
    case 'recovery':
      return 'libraryRoutineRecovery';
  }
};

export const buildLibraryRoutinePath = (routine: GuideRoutine, routineSlug?: string): string => {
  const basePath = `/library/routines/${routine}`;
  return routineSlug ? `${basePath}/${encodeURIComponent(routineSlug)}` : basePath;
};

export const routeToRoutine = (route: AppRoute): GuideRoutine | null => {
  switch (route) {
    case 'libraryRoutineWarmUp':
      return 'warm-up';
    case 'libraryRoutineCooldown':
      return 'cooldown';
    case 'libraryRoutineMobility':
      return 'mobility';
    case 'libraryRoutineStrength':
      return 'strength';
    case 'libraryRoutineSkill':
      return 'skill';
    case 'libraryRoutineRecovery':
      return 'recovery';
    default:
      return null;
  }
};

export const isGuideLikeRoute = (value: AppRoute): boolean => value.startsWith('guide');

export const getSectionForRoute = (route: AppRoute): AppSection | null => {
  if (isGuideLikeRoute(route)) return 'guide';
  if (route === 'library' || route.startsWith('library')) return 'library';
  if (route === 'study' || route === 'studyLearn') return 'study';
  if (route === 'teach') return 'teach';
  return null;
};

const getGlossarySlugFromPath = (pathname: string): string | null => {
  const match = /^\/library\/terms\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const getExerciseSlugFromPath = (pathname: string): string | null => {
  const match = /^\/library\/exercises\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

export const parseLocation = (
  pathname: string,
  state?: HistoryState,
  search?: string,
): ParsedAppLocation => {
  const techniqueParams = parseTechniquePath(pathname, search);
  if (techniqueParams) {
    const fallbackRoute = state?.route ?? 'libraryTechniques';
    return { route: fallbackRoute, slug: techniqueParams.slug, techniqueParams };
  }

  if (pathname.startsWith('/library/terms/')) {
    const slug = getGlossarySlugFromPath(pathname);
    const slugRedirects: Record<string, string> = {
      'irimi-omote': 'irimi',
      'tenkan-ura': 'tenkan',
    };
    const finalSlug = slug && (slugRedirects[slug] || slug);
    const fallbackRoute = state?.route ?? 'libraryTerms';
    return { route: fallbackRoute, slug: finalSlug };
  }

  if (pathname.startsWith('/library/exercises/')) {
    const slug = getExerciseSlugFromPath(pathname);
    return { route: 'libraryExercises', slug };
  }

  if (pathname === '/library') return { route: 'library', slug: null };
  if (pathname === '/library/techniques') return { route: 'libraryTechniques', slug: null };
  if (pathname === '/library/terms') return { route: 'libraryTerms', slug: null };
  if (pathname === '/library/exercises') return { route: 'libraryExercises', slug: null };
  if (pathname === '/library/routines') return { route: 'libraryRoutines', slug: null };
  if (pathname === '/study') return { route: 'study', slug: null };
  if (pathname === '/study/learn') return { route: 'studyLearn', slug: null };
  if (pathname === '/teach') return { route: 'teach', slug: null };
  if (pathname === '/about') return { route: 'about', slug: null };
  if (pathname === '/sync') return { route: 'sync', slug: null };
  if (pathname === '/guide') return { route: 'guide', slug: null };
  if (pathname === '/guide/advanced') return { route: 'guideAdvanced', slug: null };
  if (pathname === '/guide/dan') return { route: 'guideDan', slug: null };

  const libraryRoutineMatch =
    /^\/library\/routines\/(warm-up|cooldown|mobility|strength|skill|recovery)(?:\/([^/?#]+))?$/.exec(
      pathname,
    );
  if (libraryRoutineMatch) {
    const [, routine, routineSlug] = libraryRoutineMatch;
    return {
      route: routineToLibraryRoute(routine as GuideRoutine),
      slug: routineSlug ? decodeURIComponent(routineSlug) : null,
    };
  }

  const guideGradeMatch = /^\/guide\/(\d+)-(kyu|dan)$/.exec(pathname);
  if (guideGradeMatch) {
    const [, number, type] = guideGradeMatch;
    if (type === 'kyu') {
      if (number === '5') return { route: 'guideKyu5', slug: null };
      if (number === '4') return { route: 'guideKyu4', slug: null };
      if (number === '3') return { route: 'guideKyu3', slug: null };
      if (number === '2') return { route: 'guideKyu2', slug: null };
      if (number === '1') return { route: 'guideKyu1', slug: null };
    } else if (type === 'dan') {
      if (number === '1') return { route: 'guideDan1', slug: null };
      if (number === '2') return { route: 'guideDan2', slug: null };
      if (number === '3') return { route: 'guideDan3', slug: null };
      if (number === '4') return { route: 'guideDan4', slug: null };
      if (number === '5') return { route: 'guideDan5', slug: null };
    }
  }

  if (pathname === '/feedback') return { route: 'feedback', slug: null };

  return { route: 'home', slug: null };
};

export const getInitialLocation = (): ParsedAppLocation => {
  if (typeof window === 'undefined') {
    return { route: 'home', slug: null };
  }

  const state = window.history.state as HistoryState | undefined;
  return parseLocation(window.location.pathname, state, window.location.search);
};
