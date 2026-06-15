import { parseTechniquePath } from '@shared/constants/urls';
import type { AppRoute, EntryMode, Grade, GuideRoutine } from '@shared/types';

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
    case 'guideRoutineWarmUp':
      return '/guide/warm-up';
    case 'guideRoutineCooldown':
      return '/guide/cooldown';
    case 'guideRoutineMobility':
      return '/guide/mobility';
    case 'guideRoutineStrength':
      return '/guide/strength';
    case 'guideRoutineSkill':
      return '/guide/skill';
    case 'guideRoutineRecovery':
      return '/guide/recovery';
    case 'sync':
      return '/sync';
    case 'feedback':
      return '/feedback';
    case 'techniques':
      return '/techniques';
    case 'exercises':
      return '/exercises';
    case 'terms':
      return '/terms';
    case 'bookmarks':
      return '/bookmarks';
    case 'learn':
      return '/learn';
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

export const routineToGuideRoute = (routine: GuideRoutine): AppRoute => {
  switch (routine) {
    case 'warm-up':
      return 'guideRoutineWarmUp';
    case 'cooldown':
      return 'guideRoutineCooldown';
    case 'mobility':
      return 'guideRoutineMobility';
    case 'strength':
      return 'guideRoutineStrength';
    case 'skill':
      return 'guideRoutineSkill';
    case 'recovery':
      return 'guideRoutineRecovery';
  }
};

export const buildGuideRoutinePath = (routine: GuideRoutine, routineSlug?: string): string => {
  const basePath = `/guide/${routine}`;
  return routineSlug ? `${basePath}/${encodeURIComponent(routineSlug)}` : basePath;
};

export const guideRouteToRoutine = (route: AppRoute): GuideRoutine | null => {
  switch (route) {
    case 'guideRoutineWarmUp':
      return 'warm-up';
    case 'guideRoutineCooldown':
      return 'cooldown';
    case 'guideRoutineMobility':
      return 'mobility';
    case 'guideRoutineStrength':
      return 'strength';
    case 'guideRoutineSkill':
      return 'skill';
    case 'guideRoutineRecovery':
      return 'recovery';
    default:
      return null;
  }
};

export const isGuideLikeRoute = (value: AppRoute): boolean => value.startsWith('guide');

const getGlossarySlugFromPath = (pathname: string): string | null => {
  const match = /^\/(?:terms|glossary)\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

const getPracticeSlugFromPath = (pathname: string): string | null => {
  const match = /^\/(?:exercises|practice)\/([^/?#]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : null;
};

export const parseLocation = (
  pathname: string,
  state?: HistoryState,
  search?: string,
): ParsedAppLocation => {
  const techniqueParams = parseTechniquePath(pathname, search);
  if (techniqueParams) {
    const fallbackRoute = state?.route ?? 'techniques';
    return { route: fallbackRoute, slug: techniqueParams.slug, techniqueParams };
  }

  if (pathname.startsWith('/terms/') || pathname.startsWith('/glossary/')) {
    const slug = getGlossarySlugFromPath(pathname);
    const slugRedirects: Record<string, string> = {
      'irimi-omote': 'irimi',
      'tenkan-ura': 'tenkan',
    };
    const finalSlug = slug && (slugRedirects[slug] || slug);
    const fallbackRoute = state?.route ?? 'terms';
    return { route: fallbackRoute, slug: finalSlug };
  }

  if (pathname.startsWith('/exercises/') || pathname.startsWith('/practice/')) {
    const slug = getPracticeSlugFromPath(pathname);
    return { route: 'exercises', slug };
  }

  if (pathname === '/bookmarks') return { route: 'bookmarks', slug: null };
  if (pathname === '/learn') return { route: 'learn', slug: null };
  if (pathname === '/techniques' || pathname === '/library') {
    return { route: 'techniques', slug: null };
  }
  if (pathname === '/exercises' || pathname === '/practice') {
    return { route: 'exercises', slug: null };
  }
  if (pathname === '/terms' || pathname === '/glossary') return { route: 'terms', slug: null };
  if (pathname === '/about') return { route: 'about', slug: null };
  if (pathname === '/sync') return { route: 'sync', slug: null };
  if (pathname === '/guide') return { route: 'guide', slug: null };
  if (pathname === '/guide/advanced') return { route: 'guideAdvanced', slug: null };
  if (pathname === '/guide/dan') return { route: 'guideDan', slug: null };

  const guideRoutineMatch =
    /^\/guide\/(warm-up|cooldown|mobility|strength|skill|recovery)(?:\/([^/?#]+))?$/.exec(pathname);
  if (guideRoutineMatch) {
    const [, routine, routineSlug] = guideRoutineMatch;
    return {
      route: routineToGuideRoute(routine as GuideRoutine),
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
  if (pathname === '/basics') return { route: 'guide', slug: null };

  return { route: 'home', slug: null };
};

export const getInitialLocation = (): ParsedAppLocation => {
  if (typeof window === 'undefined') {
    return { route: 'home', slug: null };
  }

  const state = window.history.state as HistoryState | undefined;
  return parseLocation(window.location.pathname, state, window.location.search);
};
