import { parseTechniquePath } from '@shared/constants/urls';
import type { AppRoute, EntryMode, Grade, LibraryRoutine } from '@shared/types';

export type AppSection = 'exams' | 'library' | 'study' | 'teach';

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
    case 'exams':
      return '/exams';
    case 'examsAdvanced':
      return '/exams/advanced';
    case 'examsDan':
      return '/exams/dan';
    case 'examsKyu5':
      return '/exams/5-kyu';
    case 'examsKyu4':
      return '/exams/4-kyu';
    case 'examsKyu3':
      return '/exams/3-kyu';
    case 'examsKyu2':
      return '/exams/2-kyu';
    case 'examsKyu1':
      return '/exams/1-kyu';
    case 'examsDan1':
      return '/exams/1-dan';
    case 'examsDan2':
      return '/exams/2-dan';
    case 'examsDan3':
      return '/exams/3-dan';
    case 'examsDan4':
      return '/exams/4-dan';
    case 'examsDan5':
      return '/exams/5-dan';
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
    case 'libraryForms':
      return '/library/forms';
    case 'libraryCulture':
      return '/library/culture';
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

export const examsRouteToGrade = (route: AppRoute): Grade | null => {
  switch (route) {
    case 'examsKyu5':
      return 'kyu5';
    case 'examsKyu4':
      return 'kyu4';
    case 'examsKyu3':
      return 'kyu3';
    case 'examsKyu2':
      return 'kyu2';
    case 'examsKyu1':
      return 'kyu1';
    case 'examsDan1':
      return 'dan1';
    case 'examsDan2':
      return 'dan2';
    case 'examsDan3':
      return 'dan3';
    case 'examsDan4':
      return 'dan4';
    case 'examsDan5':
      return 'dan5';
    default:
      return null;
  }
};

export const gradeToExamsRoute = (grade: Grade): AppRoute | null => {
  switch (grade) {
    case 'kyu5':
      return 'examsKyu5';
    case 'kyu4':
      return 'examsKyu4';
    case 'kyu3':
      return 'examsKyu3';
    case 'kyu2':
      return 'examsKyu2';
    case 'kyu1':
      return 'examsKyu1';
    case 'dan1':
      return 'examsDan1';
    case 'dan2':
      return 'examsDan2';
    case 'dan3':
      return 'examsDan3';
    case 'dan4':
      return 'examsDan4';
    case 'dan5':
      return 'examsDan5';
    default:
      return null;
  }
};

export const routineToLibraryRoute = (routine: LibraryRoutine): AppRoute => {
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

export const buildLibraryRoutinePath = (routine: LibraryRoutine, routineSlug?: string): string => {
  const basePath = `/library/routines/${routine}`;
  return routineSlug ? `${basePath}/${encodeURIComponent(routineSlug)}` : basePath;
};

export const routeToRoutine = (route: AppRoute): LibraryRoutine | null => {
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

export const isExamsLikeRoute = (value: AppRoute): boolean => value.startsWith('exams');

export const getSectionForRoute = (route: AppRoute): AppSection | null => {
  if (isExamsLikeRoute(route)) return 'exams';
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
  if (pathname === '/library/forms') return { route: 'libraryForms', slug: null };
  if (pathname === '/library/culture') return { route: 'libraryCulture', slug: null };
  if (pathname === '/study') return { route: 'study', slug: null };
  if (pathname === '/study/learn') return { route: 'studyLearn', slug: null };
  if (pathname === '/teach') return { route: 'teach', slug: null };
  if (pathname === '/about') return { route: 'about', slug: null };
  if (pathname === '/sync') return { route: 'sync', slug: null };
  if (pathname === '/exams') return { route: 'exams', slug: null };
  if (pathname === '/exams/advanced') return { route: 'examsAdvanced', slug: null };
  if (pathname === '/exams/dan') return { route: 'examsDan', slug: null };

  const libraryRoutineMatch =
    /^\/library\/routines\/(warm-up|cooldown|mobility|strength|skill|recovery)(?:\/([^/?#]+))?$/.exec(
      pathname,
    );
  if (libraryRoutineMatch) {
    const [, routine, routineSlug] = libraryRoutineMatch;
    return {
      route: routineToLibraryRoute(routine as LibraryRoutine),
      slug: routineSlug ? decodeURIComponent(routineSlug) : null,
    };
  }

  const examsGradeMatch = /^\/exams\/(\d+)-(kyu|dan)$/.exec(pathname);
  if (examsGradeMatch) {
    const [, number, type] = examsGradeMatch;
    if (type === 'kyu') {
      if (number === '5') return { route: 'examsKyu5', slug: null };
      if (number === '4') return { route: 'examsKyu4', slug: null };
      if (number === '3') return { route: 'examsKyu3', slug: null };
      if (number === '2') return { route: 'examsKyu2', slug: null };
      if (number === '1') return { route: 'examsKyu1', slug: null };
    } else if (type === 'dan') {
      if (number === '1') return { route: 'examsDan1', slug: null };
      if (number === '2') return { route: 'examsDan2', slug: null };
      if (number === '3') return { route: 'examsDan3', slug: null };
      if (number === '4') return { route: 'examsDan4', slug: null };
      if (number === '5') return { route: 'examsDan5', slug: null };
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
