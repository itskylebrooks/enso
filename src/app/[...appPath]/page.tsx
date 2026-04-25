import App from '../../App';
import { parseTechniquePath } from '../../shared/constants/urls';
import type { AppRoute } from '../../shared/types';
import { detectRequestLocale } from '../_lib/locale';

const decodePathSegment = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getSlugFromPath = (pathname: string, pattern: RegExp): string | null => {
  const match = pattern.exec(pathname);
  if (!match || !match[1]) {
    return null;
  }

  return decodePathSegment(match[1]);
};

const resolveInitialRoute = (pathname: string): { route: AppRoute; slug: string | null } => {
  const techniqueParams = parseTechniquePath(pathname);
  if (techniqueParams) {
    return { route: 'techniques', slug: techniqueParams.slug };
  }

  if (pathname.startsWith('/terms/') || pathname.startsWith('/glossary/')) {
    const slugRedirects: Record<string, string> = {
      'irimi-omote': 'irimi',
      'tenkan-ura': 'tenkan',
    };
    const slug = getSlugFromPath(pathname, /^\/(?:terms|glossary)\/([^/?#]+)/);
    const finalSlug = slug ? (slugRedirects[slug] ?? slug) : null;
    return { route: 'terms', slug: finalSlug };
  }

  if (pathname.startsWith('/exercises/') || pathname.startsWith('/practice/')) {
    return { route: 'exercises', slug: getSlugFromPath(pathname, /^\/(?:exercises|practice)\/([^/?#]+)/) };
  }

  if (pathname === '/bookmarks') return { route: 'bookmarks', slug: null };
  if (pathname === '/techniques' || pathname === '/library') return { route: 'techniques', slug: null };
  if (pathname === '/exercises' || pathname === '/practice') return { route: 'exercises', slug: null };
  if (pathname === '/terms' || pathname === '/glossary') return { route: 'terms', slug: null };
  if (pathname === '/about') return { route: 'about', slug: null };
  if (pathname === '/sync') return { route: 'sync', slug: null };
  if (pathname === '/guide') return { route: 'guide', slug: null };
  if (pathname === '/guide/advanced') return { route: 'guideAdvanced', slug: null };
  if (pathname === '/guide/dan') return { route: 'guideDan', slug: null };

  const guideRoutineMatch =
    /^\/guide\/(warm-up|cooldown|mobility|strength|skill|recovery)(?:\/([^/?#]+))?$/.exec(
      pathname,
    );
  if (guideRoutineMatch) {
    const [, routine, routineSlug] = guideRoutineMatch;
    const decodedRoutineSlug = routineSlug ? decodePathSegment(routineSlug) : null;
    if (routine === 'warm-up') return { route: 'guideRoutineWarmUp', slug: decodedRoutineSlug };
    if (routine === 'cooldown')
      return { route: 'guideRoutineCooldown', slug: decodedRoutineSlug };
    if (routine === 'mobility')
      return { route: 'guideRoutineMobility', slug: decodedRoutineSlug };
    if (routine === 'strength')
      return { route: 'guideRoutineStrength', slug: decodedRoutineSlug };
    if (routine === 'skill') return { route: 'guideRoutineSkill', slug: decodedRoutineSlug };
    if (routine === 'recovery')
      return { route: 'guideRoutineRecovery', slug: decodedRoutineSlug };
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
    } else {
      if (number === '1') return { route: 'guideDan1', slug: null };
      if (number === '2') return { route: 'guideDan2', slug: null };
      if (number === '3') return { route: 'guideDan3', slug: null };
      if (number === '4') return { route: 'guideDan4', slug: null };
      if (number === '5') return { route: 'guideDan5', slug: null };
    }
  }

  if (pathname === '/feedback') {
    return { route: 'feedback', slug: null };
  }

  if (pathname === '/basics') {
    return { route: 'guide', slug: null };
  }

  return { route: 'home', slug: null };
};

type PageProps = {
  params: Promise<{ appPath: string[] }>;
};

export default async function CatchAllPage({ params }: PageProps) {
  const { appPath } = await params;
  const pathname = `/${appPath.join('/')}`;
  const initialLocale = await detectRequestLocale();
  const { route, slug } = resolveInitialRoute(pathname);

  return <App initialLocale={initialLocale} initialRoute={route} initialSlug={slug} />;
}
