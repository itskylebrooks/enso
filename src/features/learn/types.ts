import type { AppRoute } from '@shared/types';

export type LearnCardType = 'technique' | 'term';
export type LearnFrontMode = 'title' | 'definition';
export type LearnOrder = 'current' | 'random';
export type LearnStudyMode = 'standard' | 'japanesePronunciation' | 'japaneseWriting';

export type LearnTagStyle = {
  backgroundColor: string;
  color: string;
  borderColor?: string;
};

export type LearnCard = {
  id: string;
  cardType: LearnCardType;
  title: string;
  definition: string;
  pronunciationText: string;
  japaneseText?: string;
  tagLabel?: string;
  tagStyle?: LearnTagStyle;
};

export type LearnSetupOptions = {
  studyMode: LearnStudyMode;
  frontMode: LearnFrontMode;
  order: LearnOrder;
  showTags: boolean;
};

export type LearnSession = {
  id: string;
  cards: LearnCard[];
  options: LearnSetupOptions;
  sourceRoute: AppRoute;
  sourceLabel: string;
};

export type LearnQueueState = {
  queue: LearnCard[];
  rememberedCount: number;
  missedCount: number;
  totalCount: number;
};
