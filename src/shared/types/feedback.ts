import type { Locale, TechniqueVariantKey } from './index';

export const feedbackFlows = ['content', 'idea', 'bug'] as const;
export type FeedbackType = (typeof feedbackFlows)[number];

export const feedbackContentTypes = [
  'technique',
  'exercise',
  'routine',
  'form',
  'glossary',
  'exam',
  'other',
] as const;
export type FeedbackContentType = (typeof feedbackContentTypes)[number];

export type FeedbackContentMode = 'edit' | 'new';

export type FeedbackInitialContext = {
  flow: FeedbackType;
  contentType?: FeedbackContentType;
  mode?: FeedbackContentMode;
  entityId?: string;
  variantKey?: TechniqueVariantKey;
};

export type FeedbackMedia = {
  type: 'youtube' | 'image' | 'link';
  url: string;
  title?: string;
};

export type FeedbackBase = {
  version: 2;
  name: string;
  locale: Locale;
  summary: string;
  clientVersion?: string;
  honeypot: string;
};

export type ContentFeedbackSubmission = FeedbackBase & {
  kind: 'content';
  target: {
    entityType: FeedbackContentType;
    mode: FeedbackContentMode;
    entityId?: string;
    variantKey?: TechniqueVariantKey;
  };
  details: string;
  structured?: {
    contentName?: string;
    attack?: string;
    category?: string;
    level?: string;
    routineCategory?: string;
    estimatedMinutes?: number;
    routineExercises?: string[];
    steps?: string[];
    uke?: string;
    keyPoints?: string[];
    commonMistakes?: string[];
    context?: string;
    attribution?: string;
    media?: FeedbackMedia[];
  };
  consent: true;
};

export type AppIdeaSubmission = FeedbackBase & {
  kind: 'idea';
  area?: string;
  details: string;
  media?: FeedbackMedia[];
};

export type BugFeedbackSubmission = FeedbackBase & {
  kind: 'bug';
  location?: string;
  details: string;
  reproduction?: string;
  media?: FeedbackMedia[];
};

export type FeedbackSubmissionV2 =
  | ContentFeedbackSubmission
  | AppIdeaSubmission
  | BugFeedbackSubmission;
