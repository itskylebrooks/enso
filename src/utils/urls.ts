/**
 * Utility functions for building hierarchical technique URLs
 */

import type { EntryMode, Direction, WeaponKind } from '../shared/types';

const isEntryPathMode = (value: string | undefined): value is EntryMode =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';

const isDirection = (value: string | undefined): value is Direction =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';

const isWeaponKind = (value: string | undefined): value is WeaponKind =>
  value === 'empty' || value === 'bokken' || value === 'jo' || value === 'tanto';

/**
 * Builds a technique URL with optional trainer and entry parameters
 * 
 * @param slug - The technique slug
 * @param trainerId - Optional trainer ID for trainer-specific version
 * @param entry - Optional entry mode (irimi/tenkan)
 * @returns Hierarchical technique URL
 * 
 * Examples:
 * - buildTechniqueUrl('katate-dori-kaiten-nage-soto') → '/technique/katate-dori-kaiten-nage-soto'
 * - buildTechniqueUrl('katate-dori-kaiten-nage-soto', 'alfred-haase') → '/technique/katate-dori-kaiten-nage-soto/alfred-haase'
 * - buildTechniqueUrl('katate-dori-kaiten-nage-soto', 'alfred-haase', 'irimi') → '/technique/katate-dori-kaiten-nage-soto/alfred-haase/irimi'
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
export const parseTechniquePath = (pathname: string): { slug: string; trainerId?: string; entry?: EntryMode } | null => {
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
 * Toolbar-based variant parameters (query string approach)
 */
export type TechniqueVariantParams = {
  direction?: Direction;
  weapon?: WeaponKind;
  versionId?: string | null;
};

/**
 * Builds a technique URL with toolbar query parameters
 * 
 * @param slug - The technique slug
 * @param params - Toolbar variant parameters
 * @returns Technique URL with query string
 * 
 * Examples:
 * - buildTechniqueUrlWithVariant('shiho-nage') → '/technique/shiho-nage'
 * - buildTechniqueUrlWithVariant('shiho-nage', {direction: 'irimi'}) → '/technique/shiho-nage?dir=irimi'
 * - buildTechniqueUrlWithVariant('shiho-nage', {direction: 'irimi', weapon: 'bokken', versionId: 'haase-bsv'}) 
 *   → '/technique/shiho-nage?dir=irimi&wp=bokken&ver=haase-bsv'
 */
export const buildTechniqueUrlWithVariant = (slug: string, params?: TechniqueVariantParams): string => {
  const encodedSlug = encodeURIComponent(slug);
  let path = `/technique/${encodedSlug}`;
  
  if (!params) return path;
  
  const queryParams: string[] = [];
  
  if (params.direction) {
    queryParams.push(`dir=${encodeURIComponent(params.direction)}`);
  }
  
  if (params.weapon) {
    queryParams.push(`wp=${encodeURIComponent(params.weapon)}`);
  }
  
  if (params.versionId) {
    queryParams.push(`ver=${encodeURIComponent(params.versionId)}`);
  }
  
  if (queryParams.length > 0) {
    path += '?' + queryParams.join('&');
  }
  
  return path;
};

/**
 * Parses toolbar variant parameters from URL search params
 * 
 * @param search - The URL search string (e.g., '?dir=irimi&wp=empty&ver=haase-bsv')
 * @returns Parsed variant parameters
 */
export const parseTechniqueVariantParams = (search: string): TechniqueVariantParams => {
  const params = new URLSearchParams(search);
  
  const directionCandidate = params.get('dir');
  const weaponCandidate = params.get('wp');
  const versionId = params.get('ver');
  
  return {
    direction: isDirection(directionCandidate || undefined) ? directionCandidate as Direction : undefined,
    weapon: isWeaponKind(weaponCandidate || undefined) ? weaponCandidate as WeaponKind : undefined,
    versionId: versionId || undefined,
  };
};