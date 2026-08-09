import type {
  FeedbackContentMode,
  FeedbackContentType,
  FeedbackInitialContext,
  FeedbackMedia,
  FeedbackSubmissionV2,
  FeedbackType,
} from '@shared/types/feedback';
import type { Direction, Grade, Hanmi, Locale, TechniqueVariantKey, WeaponKind } from '@shared/types';

export const FEEDBACK_DRAFT_KEY = 'enso.feedbackDraft.v2';
export const LEGACY_FEEDBACK_DRAFT_KEY = 'enso.feedbackDraft';

export type ContentDraft = {
  contentType: FeedbackContentType;
  mode: FeedbackContentMode;
  entityId: string;
  contentName: string;
  details: string;
  includeVariant: boolean;
  variantKey: TechniqueVariantKey;
  attack: string;
  category: string;
  level: Grade | '';
  routineCategory: string;
  estimatedMinutes: string;
  routineExercises: string[];
  steps: string[];
  uke: string;
  keyPoints: string[];
  commonMistakes: string[];
  context: string;
  attribution: string;
  mediaUrl: string;
  contributorName: string;
  consent: boolean;
};

export type IdeaDraft = {
  area: string;
  details: string;
  mediaUrl: string;
};

export type BugDraft = {
  location: string;
  details: string;
  reproduction: string;
  mediaUrl: string;
};

export type FeedbackDraftV2 = {
  version: 2;
  flow: FeedbackType | null;
  content: ContentDraft;
  idea: IdeaDraft;
  bug: BugDraft;
};

const defaultVariantKey = (): TechniqueVariantKey => ({
  hanmi: 'ai-hanmi',
  direction: 'irimi',
  weapon: 'empty',
  versionId: null,
});

export const createFeedbackDraft = (): FeedbackDraftV2 => ({
  version: 2,
  flow: null,
  content: {
    contentType: 'technique',
    mode: 'edit',
    entityId: '',
    contentName: '',
    details: '',
    includeVariant: false,
    variantKey: defaultVariantKey(),
    attack: '',
    category: '',
    level: '',
    routineCategory: '',
    estimatedMinutes: '',
    routineExercises: [],
    steps: [],
    uke: '',
    keyPoints: [],
    commonMistakes: [],
    context: '',
    attribution: '',
    mediaUrl: '',
    contributorName: '',
    consent: false,
  },
  idea: { area: '', details: '', mediaUrl: '' },
  bug: { location: '', details: '', reproduction: '', mediaUrl: '' },
});

const stringValue = (value: unknown): string => (typeof value === 'string' ? value : '');
const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const isFlow = (value: unknown): value is FeedbackType =>
  value === 'content' || value === 'idea' || value === 'bug';
const isContentType = (value: unknown): value is FeedbackContentType =>
  value === 'technique' ||
  value === 'exercise' ||
  value === 'routine' ||
  value === 'form' ||
  value === 'glossary' ||
  value === 'exam' ||
  value === 'other';
const isMode = (value: unknown): value is FeedbackContentMode => value === 'edit' || value === 'new';
const isHanmi = (value: unknown): value is Hanmi =>
  value === 'ai-hanmi' || value === 'gyaku-hanmi';
const isDirection = (value: unknown): value is Direction =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';
const isWeapon = (value: unknown): value is WeaponKind =>
  value === 'empty' || value === 'bokken' || value === 'jo' || value === 'tanto';

export const parseFeedbackDraft = (value: unknown): FeedbackDraftV2 => {
  const defaults = createFeedbackDraft();
  if (!value || typeof value !== 'object') return defaults;
  const stored = value as Record<string, unknown>;

  if (stored.version !== 2) return migrateLegacyDraft(stored);

  const content =
    stored.content && typeof stored.content === 'object'
      ? (stored.content as Record<string, unknown>)
      : {};
  const idea =
    stored.idea && typeof stored.idea === 'object' ? (stored.idea as Record<string, unknown>) : {};
  const bug =
    stored.bug && typeof stored.bug === 'object' ? (stored.bug as Record<string, unknown>) : {};
  const variant =
    content.variantKey && typeof content.variantKey === 'object'
      ? (content.variantKey as Record<string, unknown>)
      : {};

  return {
    version: 2,
    flow: isFlow(stored.flow) ? stored.flow : null,
    content: {
      ...defaults.content,
      contentType: isContentType(content.contentType)
        ? content.contentType
        : defaults.content.contentType,
      mode: isMode(content.mode) ? content.mode : defaults.content.mode,
      entityId: stringValue(content.entityId),
      contentName: stringValue(content.contentName),
      details: stringValue(content.details),
      includeVariant: Boolean(content.includeVariant),
      variantKey: {
        hanmi: isHanmi(variant.hanmi) ? variant.hanmi : defaults.content.variantKey.hanmi,
        direction: isDirection(variant.direction)
          ? variant.direction
          : defaults.content.variantKey.direction,
        weapon: isWeapon(variant.weapon) ? variant.weapon : defaults.content.variantKey.weapon,
        versionId: typeof variant.versionId === 'string' ? variant.versionId : null,
      },
      attack: stringValue(content.attack),
      category: stringValue(content.category),
      level: stringValue(content.level) as Grade | '',
      routineCategory: stringValue(content.routineCategory),
      estimatedMinutes: stringValue(content.estimatedMinutes),
      routineExercises: stringList(content.routineExercises),
      steps: stringList(content.steps),
      uke: stringValue(content.uke),
      keyPoints: stringList(content.keyPoints),
      commonMistakes: stringList(content.commonMistakes),
      context: stringValue(content.context),
      attribution: stringValue(content.attribution),
      mediaUrl: stringValue(content.mediaUrl),
      contributorName: stringValue(content.contributorName),
      consent: Boolean(content.consent),
    },
    idea: {
      area: stringValue(idea.area),
      details: stringValue(idea.details),
      mediaUrl: stringValue(idea.mediaUrl),
    },
    bug: {
      location: stringValue(bug.location),
      details: stringValue(bug.details),
      reproduction: stringValue(bug.reproduction),
      mediaUrl: stringValue(bug.mediaUrl),
    },
  };
};

const firstText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const localized = value as Record<string, unknown>;
  return stringValue(localized.en) || stringValue(localized.de);
};

export const migrateLegacyDraft = (legacy: Record<string, unknown>): FeedbackDraftV2 => {
  const draft = createFeedbackDraft();
  const selected = legacy.selectedType;
  if (selected === 'appFeedback') draft.flow = 'idea';
  else if (selected === 'bugReport') draft.flow = 'bug';
  else if (
    selected === 'improveTechnique' ||
    selected === 'addVariation' ||
    selected === 'newTechnique'
  ) {
    draft.flow = 'content';
  }

  const improve =
    legacy.improveTechnique && typeof legacy.improveTechnique === 'object'
      ? (legacy.improveTechnique as Record<string, unknown>)
      : {};
  const variation =
    legacy.addVariation && typeof legacy.addVariation === 'object'
      ? (legacy.addVariation as Record<string, unknown>)
      : {};
  const technique =
    legacy.newTechnique && typeof legacy.newTechnique === 'object'
      ? (legacy.newTechnique as Record<string, unknown>)
      : {};
  const idea =
    legacy.appFeedback && typeof legacy.appFeedback === 'object'
      ? (legacy.appFeedback as Record<string, unknown>)
      : {};
  const bug =
    legacy.bugReport && typeof legacy.bugReport === 'object'
      ? (legacy.bugReport as Record<string, unknown>)
      : {};

  if (selected === 'improveTechnique') {
    draft.content.mode = 'edit';
    draft.content.entityId = stringValue(improve.techniqueId);
    const textBySection =
      improve.textBySection && typeof improve.textBySection === 'object'
        ? Object.values(improve.textBySection as Record<string, unknown>).map(stringValue)
        : [];
    draft.content.details = textBySection.filter(Boolean).join('\n\n');
    draft.content.attribution = stringValue(improve.credit) || stringValue(improve.source);
  } else if (selected === 'addVariation') {
    draft.content.mode = 'edit';
    draft.content.entityId = stringValue(variation.relatedTechniqueId);
    draft.content.details = firstText(variation.summary) || firstText(variation.context);
    draft.content.includeVariant = true;
    if (isDirection(variation.direction)) draft.content.variantKey.direction = variation.direction;
    if (isHanmi(variation.stance)) draft.content.variantKey.hanmi = variation.stance;
    draft.content.attribution = stringValue(variation.trainerCredit) || stringValue(variation.trainer);
  } else if (selected === 'newTechnique') {
    draft.content.mode = 'new';
    draft.content.contentName = firstText(technique.name);
    draft.content.details = firstText(technique.summary);
    draft.content.attack = stringValue(technique.attack);
    draft.content.category = stringValue(technique.category);
    draft.content.attribution = stringValue(technique.trainerCredit);
  }

  draft.idea.area = stringValue(idea.area);
  draft.idea.details = stringValue(idea.feedback);
  draft.idea.mediaUrl = stringValue(idea.screenshotUrl);
  draft.bug.location = stringValue(bug.location);
  draft.bug.details = stringValue(bug.details);
  draft.bug.reproduction = stringValue(bug.reproduction);
  return draft;
};

export const applyInitialContext = (
  draft: FeedbackDraftV2,
  context: FeedbackInitialContext,
): FeedbackDraftV2 => ({
  ...draft,
  flow: context.flow,
  content:
    context.flow === 'content'
      ? {
          ...draft.content,
          contentType: context.contentType ?? draft.content.contentType,
          mode: context.mode ?? draft.content.mode,
          entityId: context.entityId ?? draft.content.entityId,
          routineCategory:
            context.contentType === 'routine' && context.mode === 'new' && context.entityId
              ? context.entityId
              : draft.content.routineCategory,
          includeVariant: Boolean(context.variantKey) || draft.content.includeVariant,
          variantKey: context.variantKey ?? draft.content.variantKey,
        }
      : draft.content,
});

const cleanList = (values: string[]): string[] | undefined => {
  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : undefined;
};

export const mediaFromUrl = (rawUrl: string): FeedbackMedia[] | undefined => {
  const url = rawUrl.trim();
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  const path = parsed.pathname.toLowerCase();
  const type: FeedbackMedia['type'] =
    parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')
      ? 'youtube'
      : /\.(png|jpe?g|gif|webp|avif)$/.test(path)
        ? 'image'
        : 'link';
  return [{ type, url }];
};

const summaryFrom = (value: string, fallback: string): string => {
  const firstLine = value
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  const summary = firstLine || fallback;
  return summary.length > 120 ? `${summary.slice(0, 117)}…` : summary;
};

const clientVersion = (): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  return document.documentElement.dataset.appVersion || undefined;
};

export const buildFeedbackSubmission = (
  draft: FeedbackDraftV2,
  locale: Locale,
): FeedbackSubmissionV2 | null => {
  const base = {
    version: 2 as const,
    name:
      draft.flow === 'content' ? draft.content.contributorName.trim() || 'Anonymous' : 'Anonymous',
    locale,
    clientVersion: clientVersion(),
    honeypot: '',
  };

  if (draft.flow === 'content') {
    const content = draft.content;
    if (!content.details.trim() || !content.consent) return null;
    if (content.mode === 'edit' && !content.entityId.trim()) return null;
    if (content.mode === 'new' && !content.contentName.trim()) return null;

    const parsedMinutes = Number.parseInt(content.estimatedMinutes, 10);
    const structured = {
      contentName: content.contentName.trim() || undefined,
      attack: content.attack.trim() || undefined,
      category: content.category.trim() || undefined,
      level: content.level || undefined,
      routineCategory: content.routineCategory.trim() || undefined,
      estimatedMinutes:
        Number.isInteger(parsedMinutes) && parsedMinutes > 0 && parsedMinutes <= 600
          ? parsedMinutes
          : undefined,
      routineExercises: cleanList(content.routineExercises),
      steps: cleanList(content.steps),
      uke: content.uke.trim() || undefined,
      keyPoints: cleanList(content.keyPoints),
      commonMistakes: cleanList(content.commonMistakes),
      context: content.context.trim() || undefined,
      attribution: content.attribution.trim() || undefined,
      media: mediaFromUrl(content.mediaUrl),
    };
    const hasStructured = Object.values(structured).some((value) => value !== undefined);
    return {
      ...base,
      kind: 'content',
      summary: summaryFrom(
        content.details,
        content.mode === 'new' ? `New ${content.contentType}` : `Update ${content.contentType}`,
      ),
      target: {
        entityType: content.contentType,
        mode: content.mode,
        entityId: content.mode === 'edit' ? content.entityId.trim() || undefined : undefined,
        variantKey:
          content.contentType === 'technique' && content.includeVariant
            ? content.variantKey
            : undefined,
      },
      details: content.details.trim(),
      structured: hasStructured ? structured : undefined,
      consent: true,
    };
  }

  if (draft.flow === 'idea') {
    if (!draft.idea.details.trim()) return null;
    return {
      ...base,
      kind: 'idea',
      summary: summaryFrom(draft.idea.details, 'App idea'),
      area: draft.idea.area.trim() || undefined,
      details: draft.idea.details.trim(),
      media: mediaFromUrl(draft.idea.mediaUrl),
    };
  }

  if (draft.flow === 'bug') {
    if (!draft.bug.details.trim()) return null;
    return {
      ...base,
      kind: 'bug',
      summary: summaryFrom(draft.bug.details, 'Bug report'),
      location: draft.bug.location.trim() || undefined,
      details: draft.bug.details.trim(),
      reproduction: draft.bug.reproduction.trim() || undefined,
      media: mediaFromUrl(draft.bug.mediaUrl),
    };
  }

  return null;
};
