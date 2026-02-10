import type { StudyStatus, StudyStatusEntry, StudyStatusMap, TechniqueVariantKey } from '@shared/types';
import { toVariantStorageKey } from './variantKeys';

export type StudyItemType = 'technique' | 'term' | 'exercise';

export const STUDY_PRACTICE_COLLECTION_ID = '__study-practice__';
export const STUDY_STABLE_COLLECTION_ID = '__study-stable__';

const STUDY_STATUS_VALUES: StudyStatus[] = ['none', 'practice', 'stable'];
const STUDY_STATUS_SET = new Set<StudyStatus>(STUDY_STATUS_VALUES);

export const buildStudyItemKey = (type: StudyItemType, slug: string): string =>
  `${type}:${slug.trim()}`;

export const buildTechniqueVariantStudyKey = (
  slug: string,
  variant: TechniqueVariantKey,
): string => `${buildStudyItemKey('technique', slug)}:${toVariantStorageKey(variant)}`;

export const cycleStudyStatus = (status: StudyStatus): StudyStatus => {
  if (status === 'none') return 'practice';
  if (status === 'practice') return 'stable';
  return 'none';
};

export const getStudyStatusForItem = (
  studyStatus: StudyStatusMap,
  type: StudyItemType,
  slug: string,
): StudyStatus => {
  const key = buildStudyItemKey(type, slug);
  return studyStatus[key]?.status ?? 'none';
};

export const getStudyStatusForTechniqueVariant = (
  studyStatus: StudyStatusMap,
  slug: string,
  variant: TechniqueVariantKey,
): StudyStatus => {
  const variantKey = buildTechniqueVariantStudyKey(slug, variant);
  const variantEntry = studyStatus[variantKey];
  if (variantEntry) {
    return variantEntry.status;
  }

  // Legacy fallback (pre-variant study statuses)
  return getStudyStatusForItem(studyStatus, 'technique', slug);
};

const getTechniqueStatusEntries = (
  studyStatus: StudyStatusMap,
  slug: string,
): StudyStatusEntry[] => {
  const prefix = `${buildStudyItemKey('technique', slug)}:`;
  const allVariantEntries = Object.entries(studyStatus)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value);

  // If variant keys exist, they are the source of truth for this technique.
  // This prevents stale legacy technique-level entries from leaking into UI state.
  if (allVariantEntries.length > 0) {
    return allVariantEntries.filter((value) => value.status !== 'none');
  }

  const legacy = studyStatus[buildStudyItemKey('technique', slug)];
  return legacy && legacy.status !== 'none' ? [legacy] : [];
};

export const getAggregateTechniqueStudyStatus = (
  studyStatus: StudyStatusMap,
  slug: string,
): StudyStatus => {
  const entries = getTechniqueStatusEntries(studyStatus, slug);
  if (entries.length === 0) return 'none';

  return [...entries].sort((a, b) => b.updatedAt - a.updatedAt)[0].status;
};

export const hasTechniqueStudyStatus = (
  studyStatus: StudyStatusMap,
  slug: string,
  status: Exclude<StudyStatus, 'none'>,
): boolean => getTechniqueStatusEntries(studyStatus, slug).some((entry) => entry.status === status);

export const isStudyCollectionId = (collectionId: string): boolean =>
  collectionId === STUDY_PRACTICE_COLLECTION_ID || collectionId === STUDY_STABLE_COLLECTION_ID;

export const getStudyStatusForCollectionId = (collectionId: string): StudyStatus | null => {
  if (collectionId === STUDY_PRACTICE_COLLECTION_ID) return 'practice';
  if (collectionId === STUDY_STABLE_COLLECTION_ID) return 'stable';
  return null;
};

export const sanitizeStudyStatusMap = (raw: unknown): StudyStatusMap => {
  if (!raw || typeof raw !== 'object') return {};

  const now = Date.now();
  const sanitized: StudyStatusMap = {};
  const entries = Object.entries(raw as Record<string, unknown>);

  entries.forEach(([key, value]) => {
    if (!/^(technique|term|exercise):/.test(key)) return;
    if (!value || typeof value !== 'object') return;

    const status = (value as Partial<StudyStatusEntry>).status;
    if (!status || !STUDY_STATUS_SET.has(status)) return;

    const updatedAt = (value as Partial<StudyStatusEntry>).updatedAt;
    sanitized[key] = {
      status,
      updatedAt: typeof updatedAt === 'number' ? updatedAt : now,
    };
  });

  return sanitized;
};
