import type { Technique, TechniqueVersion, StepsByEntry, LocalizedSteps } from '@shared/types';
import { ENTRY_MODE_ORDER } from '@shared/constants/entryModes';

/**
 * Migration helper to convert legacy step fields to the unified `stepsByEntry` structure.
 * Supports historical `stepsIrimi`, `stepsTenkan`, `stepsOmote`, `stepsUra`, and the original `steps` array.
 */
export function migrateVersionToStepsByEntry(version: TechniqueVersion): TechniqueVersion {
  const sanitizeExistingSteps = (): StepsByEntry => {
    const sanitized: StepsByEntry = {};
    ENTRY_MODE_ORDER.forEach((mode) => {
      const steps = version.stepsByEntry?.[mode];
      if (steps) {
        sanitized[mode] = steps;
      }
    });
    return sanitized;
  };

  const hasExistingSteps = ENTRY_MODE_ORDER.some((mode) => Boolean(version.stepsByEntry?.[mode]));
  if (hasExistingSteps) {
    return {
      ...version,
      stepsByEntry: sanitizeExistingSteps(),
    };
  }

  const legacyVersion = version as TechniqueVersion & {
    stepsIrimi?: LocalizedSteps;
    stepsTenkan?: LocalizedSteps;
    stepsOmote?: LocalizedSteps;
    stepsUra?: LocalizedSteps;
  };

  const migrated: StepsByEntry = {};

  ENTRY_MODE_ORDER.forEach((mode) => {
    const legacyKey = `steps${mode.charAt(0).toUpperCase()}${mode.slice(1)}` as keyof typeof legacyVersion;
    const legacySteps = legacyVersion[legacyKey] as LocalizedSteps | undefined;
    if (legacySteps) {
      migrated[mode] = legacySteps;
    }
  });

  if (Object.keys(migrated).length === 0 && legacyVersion.steps) {
    migrated.ura = legacyVersion.steps;
  }

  return {
    ...version,
    stepsByEntry: migrated,
    steps: legacyVersion.steps,
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