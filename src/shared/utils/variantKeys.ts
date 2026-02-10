import type { Progress, TechniqueVariantKey } from '@shared/types';

const DELIMITER = '|';

export const toVariantStorageKey = (variant: TechniqueVariantKey): string =>
  [
    variant.hanmi,
    variant.direction,
    variant.weapon,
    variant.versionId == null ? '' : variant.versionId,
  ].join(DELIMITER);

export const fromVariantStorageKey = (value: string): TechniqueVariantKey | null => {
  const [hanmi, direction, weapon, versionIdRaw] = value.split(DELIMITER);
  if (!hanmi || !direction || !weapon) {
    return null;
  }

  if (
    (hanmi !== 'ai-hanmi' && hanmi !== 'gyaku-hanmi') ||
    (direction !== 'irimi' &&
      direction !== 'tenkan' &&
      direction !== 'omote' &&
      direction !== 'ura') ||
    (weapon !== 'empty' && weapon !== 'bokken' && weapon !== 'jo' && weapon !== 'tanto')
  ) {
    return null;
  }

  return {
    hanmi,
    direction,
    weapon,
    versionId: versionIdRaw && versionIdRaw.length > 0 ? versionIdRaw : null,
  };
};

const unique = (entries: string[]): string[] => Array.from(new Set(entries));

export const getBookmarkedVariantKeys = (progress: Progress | null | undefined): string[] => {
  if (!progress) return [];

  const fromArray = Array.isArray(progress.bookmarkedVariantKeys)
    ? progress.bookmarkedVariantKeys.filter((value): value is string => typeof value === 'string')
    : [];

  const normalizedFromArray = fromArray.filter((value) => fromVariantStorageKey(value) !== null);
  if (normalizedFromArray.length > 0) {
    return unique(normalizedFromArray);
  }

  if (progress.bookmarked && progress.bookmarkedVariant) {
    return [toVariantStorageKey(progress.bookmarkedVariant)];
  }

  return [];
};

export const isVariantBookmarked = (
  progress: Progress | null | undefined,
  variant: TechniqueVariantKey,
): boolean => {
  const keys = getBookmarkedVariantKeys(progress);
  if (keys.length === 0) {
    return Boolean(progress?.bookmarked);
  }
  return keys.includes(toVariantStorageKey(variant));
};
