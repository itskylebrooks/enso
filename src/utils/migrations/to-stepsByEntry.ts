import type { Technique, TechniqueVersion } from '../../shared/types';

/**
 * Migration helper to convert legacy `steps` format to new `stepsByEntry` structure.
 * Assumes most current content is ura/tenkan-based and maps existing steps to `stepsByEntry.ura`.
 */
export function migrateVersionToStepsByEntry(version: TechniqueVersion): TechniqueVersion {
  // If stepsByEntry already exists, no migration needed
  if (version.stepsByEntry) {
    return version;
  }

  // If no legacy steps exist, return as-is
  if (!version.steps) {
    return {
      ...version,
      stepsByEntry: {},
    };
  }

  // Migrate legacy steps to ura entry (most current content is ura/tenkan-based)
  return {
    ...version,
    stepsByEntry: {
      ura: version.steps,
    },
    // Keep legacy steps for compatibility during transition
    steps: version.steps,
  };
}

/**
 * Migrates a complete technique object, upgrading all versions that need migration.
 */
export function migrateTechniqueToStepsByEntry(technique: Technique): Technique {
  const needsMigration = technique.versions.some(v => !v.stepsByEntry);
  
  if (!needsMigration) {
    return technique;
  }

  return {
    ...technique,
    versions: technique.versions.map(migrateVersionToStepsByEntry),
  };
}

/**
 * Utility to check if a version needs migration.
 */
export function versionNeedsMigration(version: TechniqueVersion): boolean {
  return !version.stepsByEntry && !!version.steps;
}

/**
 * Utility to check if a technique needs migration.
 */
export function techniqueNeedsMigration(technique: Technique): boolean {
  return technique.versions.some(versionNeedsMigration);
}