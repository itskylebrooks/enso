import type {
  BookmarkCollection,
  Collection,
  DB,
  ExerciseBookmarkCollection,
  ExerciseProgress,
  Filters,
  GlossaryBookmarkCollection,
  GlossaryProgress,
  Grade,
  Locale,
  Progress,
  StudyStatusMap,
  Theme,
} from '@shared/types';

export type SupabaseEnv = {
  url: string;
  publishableKey: string;
  secretKey?: string;
};

export type AuthSession = {
  userId: string;
  email?: string;
  accessToken: string;
  expiresAt?: number;
};

export type SyncedDBState = Pick<
  DB,
  | 'progress'
  | 'glossaryProgress'
  | 'exerciseProgress'
  | 'studyStatus'
  | 'collections'
  | 'bookmarkCollections'
  | 'glossaryBookmarkCollections'
  | 'exerciseBookmarkCollections'
>;

export type SyncSettingsState = {
  themePreference: Theme | null;
  locale: Locale;
  filters: Filters;
  filterPanelPinned: boolean;
};

export type SyncHomepageState = {
  pinnedBeltGrade: Grade | null;
  beltPromptDismissed: boolean;
  onboardingDismissed: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number | null;
};

export type SyncDomainTimestamps = {
  db: number;
  settings: number;
  homepage: number;
};

export type SyncPayloadData = {
  version: 1;
  db: SyncedDBState;
  settings: SyncSettingsState;
  homepage: SyncHomepageState;
  timestamps: SyncDomainTimestamps;
};

export type SyncPayload = {
  userId: string;
  data: SyncPayloadData;
  updatedAt: string;
};

export type SyncMetaState = {
  dbUpdatedAt: number;
  settingsUpdatedAt: number;
  homepageUpdatedAt: number;
  lastSyncedAt: number | null;
};

export type SyncPushRequest = {
  payload: SyncPayloadData;
};

export type SyncPullResponse = {
  payload: SyncPayloadData | null;
  updatedAt: string | null;
};

export type SyncPushResponse = {
  payload: SyncPayloadData;
  updatedAt: string;
};

export type SyncedCollections = {
  collections: Collection[];
  bookmarkCollections: BookmarkCollection[];
  glossaryBookmarkCollections: GlossaryBookmarkCollection[];
  exerciseBookmarkCollections: ExerciseBookmarkCollection[];
};

export type SyncedProgressSets = {
  progress: Progress[];
  glossaryProgress: GlossaryProgress[];
  exerciseProgress: ExerciseProgress[];
  studyStatus: StudyStatusMap;
};
