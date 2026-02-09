/**
 * Utility functions for canonical technique URLs.
 */

import type { Direction, EntryMode, Hanmi, WeaponKind } from '@shared/types';

const isEntryPathMode = (value: string | undefined): value is EntryMode =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';

const isDirection = (value: string | undefined): value is Direction =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';

const isWeaponKind = (value: string | undefined): value is WeaponKind =>
  value === 'empty' || value === 'bokken' || value === 'jo' || value === 'tanto';

const isHanmi = (value: string | undefined): value is Hanmi =>
  value === 'ai-hanmi' || value === 'gyaku-hanmi';

export const buildTechniqueUrl = (slug: string, trainerId?: string, entry?: EntryMode): string => {
  const encodedSlug = encodeURIComponent(slug);
  const query = new URLSearchParams();

  if (trainerId) {
    query.set('trainer', trainerId);
  }

  if (entry) {
    query.set('entry', entry);
  }

  const queryString = query.toString();
  return queryString ? `/techniques/${encodedSlug}?${queryString}` : `/techniques/${encodedSlug}`;
};

export const parseTechniquePath = (
  pathname: string,
  search = '',
): { slug: string; trainerId?: string; entry?: EntryMode } | null => {
  const match = /^\/(?:techniques|library|technique)\/([^/?#]+)(?:\/([^/?#]+))?(?:\/([^/?#]+))?/.exec(
    pathname,
  );

  if (!match) {
    return null;
  }

  const slug = decodeURIComponent(match[1]);
  const legacyTrainerId = match[2] ? decodeURIComponent(match[2]) : undefined;
  const legacyEntryCandidate = match[3] ? decodeURIComponent(match[3]) : undefined;

  const params = new URLSearchParams(search);
  const trainerFromQuery = params.get('trainer') ?? undefined;
  const entryFromQuery = params.get('entry') ?? undefined;

  const entryCandidate = entryFromQuery || legacyEntryCandidate;

  return {
    slug,
    trainerId: trainerFromQuery || legacyTrainerId,
    entry: isEntryPathMode(entryCandidate) ? entryCandidate : undefined,
  };
};

export type TechniqueVariantParams = {
  hanmi: Hanmi;
  direction: Direction;
  weapon: WeaponKind;
  versionId?: string | null;
};

export const buildTechniqueUrlWithVariant = (
  slug: string,
  params: TechniqueVariantParams,
): string => {
  const encodedSlug = encodeURIComponent(slug);
  const query = new URLSearchParams();

  query.set('version', params.versionId || 'v-base');
  query.set('hanmi', params.hanmi);
  query.set('direction', params.direction);
  query.set('weapon', params.weapon);

  return `/techniques/${encodedSlug}?${query.toString()}`;
};

export const parseTechniqueVariantParams = (
  pathname: string,
  search = '',
): TechniqueVariantParams | undefined => {
  const legacyPathMatch =
    /^\/(?:techniques|library|technique)\/[^/?#]+\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)(?:\/([^/?#]+))?/.exec(
      pathname,
    );

  const params = new URLSearchParams(search);

  const versionCandidate =
    params.get('version') || (legacyPathMatch ? decodeURIComponent(legacyPathMatch[1]) : undefined);
  const hanmiCandidateRaw =
    params.get('hanmi') || (legacyPathMatch ? decodeURIComponent(legacyPathMatch[2]) : undefined);
  const directionCandidateRaw =
    params.get('direction') ||
    (legacyPathMatch ? decodeURIComponent(legacyPathMatch[3]) : undefined);
  const weaponCandidateRaw =
    params.get('weapon') ||
    (legacyPathMatch && legacyPathMatch[4] ? decodeURIComponent(legacyPathMatch[4]) : 'empty');
  const hanmiCandidate = hanmiCandidateRaw ?? undefined;
  const directionCandidate = directionCandidateRaw ?? undefined;
  const weaponCandidate = weaponCandidateRaw ?? undefined;

  if (!versionCandidate || !isHanmi(hanmiCandidate)) {
    return undefined;
  }

  if (!isDirection(directionCandidate)) {
    return undefined;
  }

  if (!isWeaponKind(weaponCandidate)) {
    return undefined;
  }

  return {
    hanmi: hanmiCandidate,
    direction: directionCandidate,
    weapon: weaponCandidate,
    versionId: versionCandidate === 'v-base' ? null : versionCandidate,
  };
};
