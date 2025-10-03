/**
 * Helpers to map existing TechniqueVersion data to the new variant-based model
 * This enables backward compatibility during migration
 */

import type {
  Technique,
  TechniqueVersionMeta,
  TechniqueVariant,
  Direction,
  WeaponKind,
  Localized,
} from '@shared/types';
import { generateVersionLabel } from './versionLabels';

/**
 * Extract version metadata from existing technique versions
 * Excludes versions with id "v-standard" (which are treated as the default "Standard" version)
 */
export const extractVersionsMeta = (technique: Technique): TechniqueVersionMeta[] => {
  // Deduplicate by version.id - multiple versions can have the same ID
  // (e.g., same version for different hanmi)
  // Also exclude any version with id "v-standard" as it's the standard/default
  const seen = new Set<string>();
  const uniqueVersions: TechniqueVersionMeta[] = [];
  
  for (const version of technique.versions) {
    // Skip standard versions - they're accessed via the default "Standard" dropdown option
    if (version.id === 'v-standard') {
      continue;
    }
    
    if (!seen.has(version.id)) {
      seen.add(version.id);
      uniqueVersions.push({
        id: version.id,
        label: version.label || generateVersionLabel(version),
        dojo: version.dojoId,
        trainerId: version.trainerId,
      });
    }
  }
  
  return uniqueVersions;
};

/**
 * Convert existing TechniqueVersion stepsByEntry to new variant structure
 * Generates variants for each (direction, weapon, version) combination where data exists
 */
export const convertToVariants = (technique: Technique): TechniqueVariant[] => {
  const variants: TechniqueVariant[] = [];
  
  // Default weapon is empty-hand
  const defaultWeapon: WeaponKind = 'empty';
  
  // For each version, create variants for available directions
  technique.versions.forEach((version) => {
    if (!version.stepsByEntry) return;
    
    // Extract available directions from stepsByEntry
    const availableDirections = Object.keys(version.stepsByEntry) as Direction[];
    
    availableDirections.forEach((direction) => {
      const steps = version.stepsByEntry[direction];
      if (!steps) return;
      
      // Create variant for this (direction, weapon, version) combination
      const variant: TechniqueVariant = {
        key: {
          hanmi: version.hanmi, // Now required in TechniqueVersion
          direction,
          weapon: defaultWeapon,
          versionId: version.id === 'v-standard' ? null : version.id, // null for standard versions
        },
        steps: steps as Localized<string[]>,
        uke: version.uke ? {
          role: version.uke.role as Localized<string>,
          notes: version.uke.notes as Localized<string[]>,
        } : undefined,
        keyPoints: version.keyPoints as Localized<string[]> | undefined,
        commonMistakes: version.commonMistakes as Localized<string[]> | undefined,
        context: version.context as Localized<string> | undefined,
        media: version.media,
      };
      
      variants.push(variant);
    });
  });
  
  return variants;
};

/**
 * Enrich technique with versionsMeta and variants if not already present
 * This is a runtime migration helper
 */
export const enrichTechniqueWithVariants = (technique: Technique): Technique => {
  // If already has variants, return as-is
  if (technique.versionsMeta && technique.variants) {
    return technique;
  }
  
  // Otherwise, generate them
  return {
    ...technique,
    versionsMeta: extractVersionsMeta(technique),
    variants: convertToVariants(technique),
  };
};

/**
 * Get available directions for a technique (from variants or versions)
 */
export const getAvailableDirections = (technique: Technique): Direction[] => {
  if (technique.variants && technique.variants.length > 0) {
    const directions = new Set(technique.variants.map((v) => v.key.direction));
    return Array.from(directions).sort();
  }
  
  // Fallback to checking first version's stepsByEntry
  const firstVersion = technique.versions[0];
  if (firstVersion?.stepsByEntry) {
    return Object.keys(firstVersion.stepsByEntry) as Direction[];
  }
  
  return ['irimi']; // Default fallback
};

/**
 * Get available hanmis for a technique (from variants)
 */
export const getAvailableHanmis = (technique: Technique): import('@shared/types').Hanmi[] => {
  if (technique.variants && technique.variants.length > 0) {
    const hanmis = new Set(technique.variants.map((v) => v.key.hanmi));
    return Array.from(hanmis).sort();
  }
  
  // Fallback: should not happen with required hanmi
  return ['ai-hanmi'];
};

/**
 * Get available weapons for a technique (from variants)
 */
export const getAvailableWeapons = (technique: Technique): WeaponKind[] => {
  if (technique.variants && technique.variants.length > 0) {
    const weapons = new Set(technique.variants.map((v) => v.key.weapon));
    return Array.from(weapons).sort();
  }
  
  // Default to empty-hand only
  return ['empty'];
};
