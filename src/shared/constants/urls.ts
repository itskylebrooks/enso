/**
 * Utility functions for building hierarchical technique URLs
 */

import type { EntryMode, Direction, WeaponKind, Hanmi } from '@shared/types';

const isEntryPathMode = (value: string | undefined): value is EntryMode =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';

const isDirection = (value: string | undefined): value is Direction =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';

const isWeaponKind = (value: string | undefined): value is WeaponKind =>
  value === 'empty' || value === 'bokken' || value === 'jo' || value === 'tanto';

const isHanmi = (value: string | undefined): value is Hanmi =>
  value === 'ai-hanmi' || value === 'gyaku-hanmi';

/**
 * Builds a technique URL with optional trainer and entry parameters
 *
 * @param slug - The technique slug
 * @param trainerId - Optional trainer ID for trainer-specific version
 * @param entry - Optional entry mode (irimi/tenkan)
 * @returns Hierarchical technique URL
 *
 * Examples:
 * - buildTechniqueUrl('katate-tori-kaiten-nage-soto') → '/technique/katate-tori-kaiten-nage-soto'
 * - buildTechniqueUrl('katate-tori-kaiten-nage-soto', 'alfred-haase') → '/technique/katate-tori-kaiten-nage-soto/alfred-haase'
 * - buildTechniqueUrl('katate-tori-kaiten-nage-soto', 'alfred-haase', 'irimi') → '/technique/katate-tori-kaiten-nage-soto/alfred-haase/irimi'
 */
export const buildTechniqueUrl = (slug: string, trainerId?: string, entry?: EntryMode): string => {
  const encodedSlug = encodeURIComponent(slug);
  let path = `/technique/${encodedSlug}`;

  if (trainerId) {
    const encodedTrainerId = encodeURIComponent(trainerId);
    path += `/${encodedTrainerId}`;

    if (entry) {
      path += `/${entry}`;
    }
  }

  return path;
};

/**
 * Parses technique parameters from a pathname
 *
 * @param pathname - The pathname to parse (e.g., '/technique/slug/trainer/entry')
 * @returns Parsed technique parameters or null if not a technique path
 */
export const parseTechniquePath = (
  pathname: string,
): { slug: string; trainerId?: string; entry?: EntryMode } | null => {
  // Match patterns:
  // /technique/{slug}
  // /technique/{slug}/{trainerId}
  // /technique/{slug}/{trainerId}/{entry}
  const match = /^\/technique\/([^/?#]+)(?:\/([^/?#]+))?(?:\/([^/?#]+))?/.exec(pathname);

  if (!match) return null;

  const slug = decodeURIComponent(match[1]);
  const trainerId = match[2] ? decodeURIComponent(match[2]) : undefined;
  const entryCandidate = match[3] ? decodeURIComponent(match[3]) : undefined;
  const entry = isEntryPathMode(entryCandidate) ? entryCandidate : undefined;

  return { slug, trainerId, entry };
};

/**
 * Toolbar-based variant parameters (path-based approach)
 * URL structure: /technique/[slug]/[version]/[hanmi]/[direction]/[weapon]
 * - version: 'v-base' or custom version id (e.g., 'v-haase')
 * - hanmi: 'ai-hanmi' or 'gyaku-hanmi' (required)
 * - direction: 'irimi', 'tenkan', 'omote', or 'ura'
 * - weapon: omitted for 'empty' (default), or 'bokken', 'jo', 'tanto'
 */
export type TechniqueVariantParams = {
  hanmi: Hanmi;
  direction: Direction;
  weapon: WeaponKind;
  versionId?: string | null;
};

/**
 * Builds a technique URL with path-based variant parameters
 *
 * @param slug - The technique slug
 * @param params - Variant parameters (hanmi, direction, weapon, versionId)
 * @returns Path-based technique URL
 *
 * Examples:
 * - buildTechniqueUrlWithVariant('shiho-nage', {hanmi: 'ai-hanmi', direction: 'irimi', weapon: 'empty'})
 *   → '/technique/shiho-nage/v-base/ai-hanmi/irimi'
 * - buildTechniqueUrlWithVariant('shiho-nage', {hanmi: 'ai-hanmi', direction: 'irimi', weapon: 'bokken', versionId: 'v-haase'})
 *   → '/technique/shiho-nage/v-haase/ai-hanmi/irimi/bokken'
 */
export const buildTechniqueUrlWithVariant = (
  slug: string,
  params: TechniqueVariantParams,
): string => {
  const encodedSlug = encodeURIComponent(slug);
  const version = params.versionId || 'v-base';
  const segments = [
    'technique',
    encodedSlug,
    encodeURIComponent(version),
    encodeURIComponent(params.hanmi),
    encodeURIComponent(params.direction),
  ];

  // Only add weapon if it's not empty-hand (default)
  if (params.weapon !== 'empty') {
    segments.push(encodeURIComponent(params.weapon));
  }

  return '/' + segments.join('/');
};

/**
 * Parses toolbar variant parameters from pathname
 *
 * @param pathname - The URL pathname (e.g., '/technique/slug/v-base/ai-hanmi/irimi' or '/technique/slug/v-haase/gyaku-hanmi/omote/bokken')
 * @returns Parsed variant parameters or undefined if incomplete
 */
export const parseTechniqueVariantParams = (
  pathname: string,
): TechniqueVariantParams | undefined => {
  // Match pattern: /technique/{slug}/{version}/{hanmi}/{direction}/{weapon?}
  const match = /^\/technique\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)(?:\/([^/?#]+))?/.exec(
    pathname,
  );

  if (!match) return undefined;

  const versionCandidate = decodeURIComponent(match[2]);
  const hanmiCandidate = decodeURIComponent(match[3]);
  const directionCandidate = decodeURIComponent(match[4]);
  const weaponCandidate = match[5] ? decodeURIComponent(match[5]) : 'empty'; // Default to empty

  // Validate all parameters
  if (!isHanmi(hanmiCandidate)) return undefined;
  if (!isDirection(directionCandidate)) return undefined;
  if (!isWeaponKind(weaponCandidate)) return undefined;

  return {
    hanmi: hanmiCandidate as Hanmi,
    direction: directionCandidate as Direction,
    weapon: weaponCandidate as WeaponKind,
    versionId: versionCandidate === 'v-base' ? null : versionCandidate,
  };
};
