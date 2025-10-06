export type FeedbackCategory =
  | 'improve-technique'
  | 'new-variation'
  | 'new-technique'
  | 'app-feedback'
  | 'bug-report';

export type Locale = 'en' | 'de';

export interface FeedbackPayloadV1 {
  // contributor
  name: string; // default: "Anonymous"
  email?: string;

  // routing
  category: FeedbackCategory;
  entityType: 'technique';
  entityId?: string;
  locale: Locale;

  // human summary + compiled MD preview
  summary: string;
  detailsMd: string;

  // canonical diff block
  diffJson: {
    name: { en: string; de: string };
    summary: { en: string; de: string };
    levelHint: { en: string; de: string };
    steps: { en: string[]; de: string[] };
    uke: {
      role: { en: string; de: string };
      notes: { en: string[]; de: string[] };
    };
    keyPoints: { en: string[]; de: string[] };
    commonMistakes: { en: string[]; de: string[] };
    jpName: string;
    taxonomy: {
      attack: string;
      category: string;
      weapon: string;
      entries: string[];
      hanmi: string;
    };
    media?: string[];
    sources: string;
    creditName: string;
    trainerCredit: string;
    markAsBase: boolean;
    consent: boolean;
  };

  media?: string[];
  honeypot: string;
}
