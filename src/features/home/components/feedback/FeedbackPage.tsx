import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Select, type SelectOption } from '@shared/components/ui/Select';
import { Chip } from '@shared/components/ui/Chip';
import { useMotionPreferences, defaultEase } from '@shared/components/ui/motion';
import { classNames } from '@shared/utils/classNames';
import { gradeOrder } from '@shared/utils/grades';
import { getLevelLabel, getOrderedTaxonomyValues, getTaxonomyLabel } from '@shared/i18n/taxonomy';
import { stripDiacritics, toSearchable } from '@shared/utils/text';
import {
  BadgePlusIcon,
  BugIcon,
  HeartPulseIcon,
  LightbulbIcon,
  RocketIcon,
  PencilLineIcon,
  LinkIcon,
} from '@shared/components/ui/icons';
import type { Copy, FeedbackPageCopy } from '@shared/constants/i18n';
import { buildFeedbackPayloadV1, type NewTechniqueFormState } from '@shared/lib/buildFeedbackPayload';
import type { FeedbackPayloadV1 } from '@shared/types/feedback';
import type { Grade, Hanmi, Locale, Technique } from '@shared/types';

export type FeedbackType =
  | 'improveTechnique'
  | 'addVariation'
  | 'newTechnique'
  | 'appFeedback'
  | 'bugReport';

const feedbackTypeOrder: FeedbackType[] = ['improveTechnique', 'addVariation', 'newTechnique', 'appFeedback', 'bugReport'];

export type ImproveSection =
  | 'steps'
  | 'uke'
  | 'commonMistakes'
  | 'context'
  | 'notes'
  | 'translation'
  | 'other';

type ImproveTextSection = Exclude<ImproveSection, 'steps'>;

type StepItem = {
  id: string;
  text: string;
};

type MediaKind = 'youtube' | 'vimeo' | 'image' | 'link';

type MediaEntry = {
  id: string;
  url: string;
  type: MediaKind;
  embedUrl?: string;
  title?: string;
};

type CategoryTag =
  | 'throw'
  | 'pin'
  | 'defense'
  | 'jo'
  | 'tanto'
  | 'sword'
  | 'advanced'
  | 'randori'
  | 'weapons'
  | 'kids'
  | 'flow';

const categoryTagOrder: CategoryTag[] = ['throw', 'pin', 'defense', 'jo', 'tanto', 'sword', 'advanced', 'randori', 'weapons', 'kids', 'flow'];

const isCategoryTag = (value: unknown): value is CategoryTag =>
  typeof value === 'string' && (categoryTagOrder as string[]).includes(value);

type AppArea = 'library' | 'technique' | 'glossary' | 'guide' | 'settings' | 'other';

const isAppArea = (value: unknown): value is AppArea =>
  typeof value === 'string' && ['library', 'technique', 'glossary', 'guide', 'settings', 'other'].includes(value);

type ImproveTechniqueForm = {
  techniqueId: string | null;
  sections: ImproveSection[];
  steps: StepItem[];
  textBySection: Partial<Record<ImproveTextSection, string>>;
  media: MediaEntry[];
  source: string;
  credit: string;
  consent: boolean;
};

type VariationForm = {
  relatedTechniqueId: string | null;
  direction: 'irimi' | 'tenkan' | 'omote' | 'ura' | '';
  stance: Hanmi | null;
  trainer: string;
  summary: string;
  categoryTags: CategoryTag[];
  level: Grade | null;
  steps: StepItem[];
  ukeInstructions: string;
  media: MediaEntry[];
  keyPoints: string[];
  commonMistakes: string[];
  context: string;
  creditName: string;
  trainerCredit: string;
  markAsBase: boolean;
  consent: boolean;
};

type VariationDirection = Exclude<VariationForm['direction'], ''>;

const variationDirectionLabels: Record<VariationDirection, string> = {
  irimi: 'Irimi',
  tenkan: 'Tenkan',
  omote: 'Omote',
  ura: 'Ura',
};

const hanmiLabelMap: Record<Hanmi, string> = {
  'ai-hanmi': 'Ai-hanmi',
  'gyaku-hanmi': 'Gyaku-hanmi',
};

type AppFeedbackForm = {
  area: AppArea | null;
  title?: string;
  feedback: string;
  screenshotUrl: string;
};

type BugReportForm = {
  title?: string;
  location: string;
  details: string;
  reproduction: string;
};

type Entry = 'irimi' | 'tenkan' | 'omote' | 'ura';

type NewTechniqueForm = {
  name: string;
  jpName: string;
  attack: string | null;
  category: string | null;
  weapon: string | null;
  entries: Entry | '';
  hanmi: Hanmi | null;
  summary: string;
  levelHint: string;
  steps: StepItem[];
  ukeRole: string;
  ukeNotes: string[];
  keyPoints: string[];
  commonMistakes: string[];
  media: MediaEntry[];
  sources: string;
  creditName: string;
  trainerCredit: string;
  markAsBase: boolean;
  consent: boolean;
};

type FeedbackDraft = {
  selectedType: FeedbackType | null;
  improveTechnique: ImproveTechniqueForm;
  addVariation: VariationForm;
  appFeedback: AppFeedbackForm;
  bugReport: BugReportForm;
  newTechnique: NewTechniqueForm;
};

const STORAGE_KEY = 'enso.feedbackDraft';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const createStepList = (): StepItem[] => [{ id: createId(), text: '' }];

const SUMMARY_MAX = 230;

const ensureString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const localized = value as { en?: unknown; de?: unknown };
    if (typeof localized.en === 'string' && localized.en.trim()) return localized.en;
    if (typeof localized.de === 'string') return localized.de;
  }
  return fallback;
};

const ensureStringList = (value: unknown, minItems = 1): string[] => {
  const coerce = (list: unknown[]): string[] => {
    const cleaned = list.map((item) => (typeof item === 'string' ? item : '')).filter((item) => item !== undefined);
    while (cleaned.length < minItems) cleaned.push('');
    return cleaned.length > 0 ? cleaned : new Array(minItems).fill('');
  };

  if (Array.isArray(value) && value.length > 0) {
    return coerce(value);
  }

  if (value && typeof value === 'object') {
    const localized = value as { en?: unknown; de?: unknown };
    if (Array.isArray(localized.en) && localized.en.length > 0) {
      return coerce(localized.en);
    }
    if (Array.isArray(localized.de) && localized.de.length > 0) {
      return coerce(localized.de);
    }
  }

  return new Array(minItems).fill('');
};

const ensureStepList = (value: unknown): StepItem[] => {
  const normalize = (list: unknown[]): StepItem[] =>
    list.map((item) => {
      const it = item as Record<string, unknown>;
      return {
        id: typeof it?.id === 'string' ? (it.id as string) : createId(),
        text: typeof it?.text === 'string' ? (it.text as string) : '',
      };
    });

  if (Array.isArray(value) && value.length > 0) {
    return normalize(value);
  }

  if (value && typeof value === 'object') {
    const localized = value as { en?: unknown[]; de?: unknown[] };
    if (Array.isArray(localized.en) && localized.en.length > 0) {
      return normalize(localized.en);
    }
    if (Array.isArray(localized.de) && localized.de.length > 0) {
      return normalize(localized.de);
    }
  }

  return createStepList();
};

const sanitizeEntries = (entries?: unknown): Entry | '' => {
  const allowedValues = ['irimi', 'tenkan', 'omote', 'ura'];
  if (Array.isArray(entries) && entries.length > 0) {
    for (const entry of entries) {
      if (typeof entry === 'string' && allowedValues.includes(entry)) return entry as Entry;
    }
    return '';
  }
  if (typeof entries === 'string' && allowedValues.includes(entries)) return entries as Entry;
  if (entries && typeof entries === 'object') {
    const localized = entries as { en?: unknown; de?: unknown };
    if (Array.isArray(localized.en) && localized.en.length > 0) {
      for (const e of localized.en) if (typeof e === 'string' && allowedValues.includes(e)) return e as Entry;
    }
    if (Array.isArray(localized.de) && localized.de.length > 0) {
      for (const e of localized.de) if (typeof e === 'string' && allowedValues.includes(e)) return e as Entry;
    }
  }
  return '';
};

const sanitizeHanmi = (value: unknown): Hanmi | null =>
  value === 'ai-hanmi' || value === 'gyaku-hanmi' ? value : null;

const isVariationDirection = (value: unknown): value is VariationForm['direction'] =>
  value === 'irimi' || value === 'tenkan' || value === 'omote' || value === 'ura';

const slugify = (value: string): string =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildNewTechniqueSlug = (name: string): string => {
  // Slug should be derived only from the technique name. Exclude primary attack
  // and entry focus from the URL slug to keep slugs stable and concise.
  const nameSegment = name.trim() ? slugify(name) : '';
  return nameSegment;
};

const isUnusualAttackWeapon = (attack: string | null, weapon: string | null): boolean => {
  if (!attack || !weapon || weapon === 'empty-hand') return false;
  if (weapon === 'tanto') {
    return attack.endsWith('-dori');
  }
  if (weapon === 'jo' || weapon === 'bokken') {
    return attack.includes('dori');
  }
  return false;
};

const computeDuplicateMatches = (form: NewTechniqueForm, techniques: Technique[]): Technique[] => {
  const slugPreview = buildNewTechniqueSlug(form.name);
  const normalizedSlug = slugPreview ? toSearchable(slugPreview) : '';
  const normalizedName = toSearchable(form.name);
  const attack = form.attack;
  const weapon = form.weapon ?? 'empty-hand';

  if (!normalizedName && !normalizedSlug) return [];

  return techniques
    .filter((tech) => {
      const techNameEn = toSearchable(tech.name.en || '');
      const techNameDe = toSearchable(tech.name.de || '');
      const techSlug = toSearchable(tech.slug || '');
      const techAttack = tech.attack;
      const techWeapon = tech.weapon ?? 'empty-hand';

      const slugMatch = normalizedSlug && techSlug === normalizedSlug;
      const nameMatch =
        normalizedName && (techNameEn === normalizedName || techNameDe === normalizedName);
      const taxonomyMatch = (!attack || techAttack === attack) && techWeapon === weapon;

      return slugMatch || (nameMatch && taxonomyMatch);
    })
    .slice(0, 5);
};

const escapeInline = (value: string): string => {
  const normalized = value.replace(/\r/g, '').split('\n').map((line) => line.trim()).join(' ');
  return ['*', '[', ']', '`'].reduce((acc, ch) => acc.split(ch).join(`\\${ch}`), normalized);
};

const summarizeMedia = (media?: MediaEntry[]) =>
  (media ?? [])
    .map((item) => ({
      type: item.type === 'vimeo' ? 'link' : item.type,
      url: item.url,
      title: item.title,
    }))
    .filter((item) => item.url);

const getClientVersion = (): string | undefined => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (import.meta as any)?.env?.VITE_APP_VERSION ?? undefined;
  } catch {
    return undefined;
  }
};

type FeedbackMediaItem = { type: 'youtube' | 'image' | 'link'; url: string; title?: string };

type NewTechniqueSubmitPayload = Omit<FeedbackPayloadV1, 'media'> & {
  media?: FeedbackMediaItem[];
};

const mapNewTechniqueDraftToFormState = (form: NewTechniqueForm, locale: Locale): NewTechniqueFormState => ({
  contributorName: form.creditName || null,
  contributorEmail: null,
  name: {
    en: locale === 'en' ? form.name : '',
    de: locale === 'de' ? form.name : '',
  },
  summary: {
    en: locale === 'en' ? form.summary : '',
    de: locale === 'de' ? form.summary : '',
  },
  levelHint: {
    en: locale === 'en' ? form.levelHint : '',
    de: locale === 'de' ? form.levelHint : '',
  },
  steps: {
    en: locale === 'en' ? form.steps.map((step) => step.text || '') : [],
    de: locale === 'de' ? form.steps.map((step) => step.text || '') : [],
  },
  uke: {
    role: {
      en: locale === 'en' ? form.ukeRole : '',
      de: locale === 'de' ? form.ukeRole : '',
    },
    notes: {
      en: locale === 'en' ? form.ukeNotes : [],
      de: locale === 'de' ? form.ukeNotes : [],
    },
  },
  keyPoints: {
    en: locale === 'en' ? form.keyPoints : [],
    de: locale === 'de' ? form.keyPoints : [],
  },
  commonMistakes: {
    en: locale === 'en' ? form.commonMistakes : [],
    de: locale === 'de' ? form.commonMistakes : [],
  },
  jpName: form.jpName || null,
  taxonomy: {
    attack: form.attack || null,
    category: form.category || null,
    weapon: form.weapon || null,
    entries: form.entries ? [form.entries] : [],
    hanmi: form.hanmi || null,
  },
  mediaUrls: form.media.map((item) => item.url),
  sources: form.sources || null,
  creditName: form.creditName || null,
  trainerCredit: form.trainerCredit || null,
  markAsBase: form.markAsBase,
  consent: form.consent,
  honeypot: '',
  detailsPreviewMd: undefined,
});

const normalizeUrlForSubmission = (rawUrl: string): string | null => {
  const value = (rawUrl || '').trim();
  if (!value || value === 'EMPTY') return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const normalizeMediaForSubmission = (media: MediaEntry[]): FeedbackMediaItem[] =>
  media
    .map((entry) => {
      const url = normalizeUrlForSubmission(entry.url);
      if (!url) return null;
      const type: FeedbackMediaItem['type'] = entry.type === 'youtube' ? 'youtube' : entry.type === 'image' ? 'image' : 'link';
      const title = entry.title?.trim();
      return title ? { type, url, title } : { type, url };
    })
    .filter((item): item is FeedbackMediaItem => Boolean(item));

const buildNewTechniqueSubmission = (
  form: NewTechniqueForm,
  options: { locale: Locale; entityId?: string },
): { payload: NewTechniqueSubmitPayload; allTextEmpty: boolean; stepsEmpty: boolean } => {
  const { locale, entityId } = options;
  const formState = mapNewTechniqueDraftToFormState(form, locale);
  const v1 = buildFeedbackPayloadV1(formState, { locale: locale === 'de' ? 'de' : 'en', entityId });
  const diffLocale = locale;
  const diffSteps = v1.diffJson.steps[diffLocale];
  const allTextEmpty = v1.diffJson.name[diffLocale] === 'EMPTY' && v1.diffJson.summary[diffLocale] === 'EMPTY';
  const stepsEmpty = Array.isArray(diffSteps) && diffSteps.length === 1 && diffSteps[0] === 'EMPTY';
  const media = normalizeMediaForSubmission(form.media);
  const fallbackDetails = form.summary
    || form.steps.map((step) => step.text || '').filter(Boolean).join('\n')
    || 'New technique proposal';
  const detailsMd = v1.detailsMd && v1.detailsMd.trim().length > 0 ? v1.detailsMd : fallbackDetails;
  const { media: _legacyMedia, ...rest } = v1;
  const payload: NewTechniqueSubmitPayload = {
    ...rest,
    detailsMd,
    media: media.length > 0 ? media : undefined,
  };
  return { payload, allTextEmpty, stepsEmpty };
};

type FeedbackApiPayload = {
  name: string;
  email?: string;
  category: 'suggestion' | 'bug' | 'edit' | 'new-version' | 'new-variation' | 'new-technique';
  entityType: 'technique' | 'glossary' | 'exam' | 'guide' | 'other';
  entityId?: string;
  locale?: Locale;
  summary: string;
  detailsMd: string;
  diffJson?: unknown;
  media?: Array<{ type: 'youtube' | 'image' | 'link'; url: string; title?: string }>;
  clientVersion?: string;
  userAgent?: string;
  honeypot: string;
};

const buildFeedbackPayload = (
  selectedType: FeedbackType | null,
  draft: FeedbackDraft,
  options: {
    slugPreview: string;
    duplicateMatches: Technique[];
    locale: Locale;
    findTechniqueName: (slug: string | null) => string;
  },
): FeedbackApiPayload | null => {
  const { slugPreview, duplicateMatches, locale, findTechniqueName } = options;
  const clientVersion = getClientVersion();
  // userAgent collection removed intentionally
  const defaultName =
    [draft.newTechnique.creditName, draft.addVariation.creditName, draft.improveTechnique.credit]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find((value) => value.length > 0) ?? 'Anonymous';

  // Helpers to build flattened, bilingual fields with EMPTY fallbacks
  const toBilingual = (value: string): { en: string; de: string } => {
    const v = (value || '').trim();
    return locale === 'de'
      ? { en: v ? 'EMPTY' : 'EMPTY', de: v || 'EMPTY' }
      : { en: v || 'EMPTY', de: v ? 'EMPTY' : 'EMPTY' };
  };

  const toBilingualArray = (values: string[]): { en: string[]; de: string[] } => {
    const texts = Array.isArray(values) && values.length > 0 ? values.map((s) => (s || '').trim()) : [];
    const ensure = (arr: string[]): string[] => (arr.length > 0 ? arr : ['EMPTY']).map((s) => (s ? s : 'EMPTY'));
    if (locale === 'de') {
      return { en: ensure([]), de: ensure(texts) };
    }
    return { en: ensure(texts), de: ensure([]) };
  };

  const toBilingualSteps = (steps: StepItem[]): { en: string[]; de: string[] } => {
    const texts = Array.isArray(steps) && steps.length > 0 ? steps.map((s) => (s?.text || '').trim()) : [];
    return toBilingualArray(texts);
  };

  const fillMissing = (value: unknown): unknown => {
    if (value === null || value === undefined) return 'EMPTY';
    if (typeof value === 'string') return value.trim().length === 0 ? 'EMPTY' : value;
    if (Array.isArray(value)) return value.length === 0 ? ['EMPTY'] : value.map((item) => fillMissing(item));
    if (typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = fillMissing(v);
      }
      return result;
    }
    return value;
  };

  if (selectedType === 'newTechnique') {
    const form = draft.newTechnique;
    const summary = form.summary.trim() || 'New technique proposal';

    const listMd = (items: string[]) =>
      items.length ? items.map((item) => `- ${item || '-'}`).join('\n') : '-';
    const stepsMd = form.steps.map((step, index) => `  ${index + 1}. ${step.text || '-'}`).join('\n') || '  -';

    const detailsParts: string[] = [];
    detailsParts.push(`### Summary\n${form.summary || '-'}`);
    detailsParts.push(
      `\n### Taxonomy\n- Attack: ${form.attack ?? '—'}\n- Category: ${form.category ?? '—'}\n- Weapon: ${form.weapon ?? '—'}\n- Entries: ${form.entries || '—'}\n- Hanmi: ${form.hanmi ?? '—'}\n- Level hint: ${form.levelHint || '—'}`,
    );
    detailsParts.push(`\n### Steps\n${stepsMd}`);
    detailsParts.push(`\n### Uke guidance\n**Role:** ${form.ukeRole || '-'}\n${listMd(form.ukeNotes)}`);
    detailsParts.push(`\n### Key points\n${listMd(form.keyPoints)}`);
    detailsParts.push(`\n### Common mistakes\n${listMd(form.commonMistakes)}`);

    if (form.sources.trim()) {
      detailsParts.push(`\n### Sources / Attribution\n${form.sources.trim()}`);
    }

    if (duplicateMatches.length > 0) {
      const dupList = duplicateMatches
        .map((tech) => `- ${tech.name.en || tech.name.de} (${tech.slug})`)
        .join('\n');
      detailsParts.push(`\n### Possible duplicates\n${dupList}`);
    }

    const detailsMd = detailsParts.join('\n');

    // Build flattened, bilingual diff JSON
    const nameBi = toBilingual(form.name);
    const summaryBi = toBilingual(form.summary);
    const levelHintBi = toBilingual(form.levelHint);
    const stepsBi = toBilingualSteps(form.steps);
    const ukeRoleBi = toBilingual(form.ukeRole);
    const ukeNotesBi = toBilingualArray(form.ukeNotes);
    const keyPointsBi = toBilingualArray(form.keyPoints);
    const mistakesBi = toBilingualArray(form.commonMistakes);

    const flattened = {
      // Localized text
      name_en: nameBi.en,
      name_de: nameBi.de,
      summary_en: summaryBi.en,
      summary_de: summaryBi.de,
      levelHint_en: levelHintBi.en,
      levelHint_de: levelHintBi.de,
      steps_en: stepsBi.en,
      steps_de: stepsBi.de,
      ukeRole_en: ukeRoleBi.en,
      ukeRole_de: ukeRoleBi.de,
      ukeNotes_en: ukeNotesBi.en,
      ukeNotes_de: ukeNotesBi.de,
      keyPoints_en: keyPointsBi.en,
      keyPoints_de: keyPointsBi.de,
      commonMistakes_en: mistakesBi.en,
      commonMistakes_de: mistakesBi.de,
      // Non-localized
      jpName: form.jpName,
      taxonomy: {
        attack: form.attack,
        category: form.category,
        weapon: form.weapon,
    entries: form.entries ? [form.entries] : [],
        hanmi: form.hanmi,
      },
      media: form.media,
      sources: form.sources,
      creditName: form.creditName,
      trainerCredit: form.trainerCredit,
      markAsBase: form.markAsBase,
      consent: form.consent,
    } as const;

    return {
      name: escapeInline(form.creditName || defaultName),
      category: 'new-technique',
      entityType: 'technique',
      entityId: slugPreview || undefined,
      locale,
      summary: summary.length > 120 ? `${summary.slice(0, 117)}…` : summary,
      detailsMd,
      diffJson: fillMissing(flattened),
      media: summarizeMedia(form.media),
      clientVersion,
      honeypot: '',
    };
  }

  if (selectedType === 'addVariation') {
    const form = draft.addVariation;
    const techniqueLabel = findTechniqueName(form.relatedTechniqueId);
    const directionLabel = form.direction && form.direction in variationDirectionLabels
      ? variationDirectionLabels[form.direction as VariationDirection]
      : '—';
    const stanceLabel = form.stance ? hanmiLabelMap[form.stance] : '—';
    const tagList = form.categoryTags.length
      ? form.categoryTags.map((tag) => `- ${tag}`).join('\n')
      : '-';
    const stepsMd = form.steps
      .map((step, index) => `  ${index + 1}. ${step.text || '-'}`)
      .join('\n') || '  -';
    const keyPointsMd = form.keyPoints.map((item) => `- ${item || '-'}`).join('\n') || '-';
    const mistakesMd = form.commonMistakes.map((item) => `- ${item || '-'}`).join('\n') || '-';

    const summaryTextParts = [techniqueLabel, directionLabel].filter((value) => value && value !== '—');
    const summary = summaryTextParts.length > 0 ? `${summaryTextParts.join(' – ')} variation` : `${techniqueLabel} variation`;

    const detailsSections = [
      `### Summary\n${form.summary || '-'}`,
      `\n### Trainer & credit\n- Trainer: ${form.trainer || '—'}\n- Credit name: ${form.creditName || '—'}\n- Trainer credit: ${form.trainerCredit || '—'}\n- Mark as base: ${form.markAsBase ? 'Yes' : 'No'}`,
      `\n### Direction & stance\n- Direction: ${directionLabel}\n- Stance: ${stanceLabel}\n- Level: ${form.level ? getLevelLabel(locale, form.level) : '—'}`,
      `\n### Tags\n${tagList}`,
      `\n### Steps\n${stepsMd}`,
      `\n### Key points\n${keyPointsMd}`,
      `\n### Common mistakes\n${mistakesMd}`,
      `\n### Uke instructions\n${form.ukeInstructions || '-'}`,
      `\n### Context / notes\n${form.context || '-'}`,
    ];

    const detailsMd = detailsSections.join('\n');

    // Build flattened, bilingual diff JSON for variation
    const summaryBi = toBilingual(form.summary);
    const keyPointsBi = toBilingualArray(form.keyPoints);
    const mistakesBi = toBilingualArray(form.commonMistakes);
    const stepsBi = toBilingualSteps(form.steps);
    const ukeInstructionsBi = toBilingual(form.ukeInstructions);
    const contextBi = toBilingual(form.context);

    const flattened = {
      relatedTechniqueId: form.relatedTechniqueId,
      direction: form.direction,
      stance: form.stance,
      trainer: form.trainer,
      summary_en: summaryBi.en,
      summary_de: summaryBi.de,
      steps_en: stepsBi.en,
      steps_de: stepsBi.de,
      keyPoints_en: keyPointsBi.en,
      keyPoints_de: keyPointsBi.de,
      commonMistakes_en: mistakesBi.en,
      commonMistakes_de: mistakesBi.de,
      ukeInstructions_en: ukeInstructionsBi.en,
      ukeInstructions_de: ukeInstructionsBi.de,
      context_en: contextBi.en,
      context_de: contextBi.de,
      categoryTags: form.categoryTags,
      level: form.level,
      media: form.media,
      creditName: form.creditName,
      trainerCredit: form.trainerCredit,
      markAsBase: form.markAsBase,
      consent: form.consent,
    } as const;

    return {
      name: escapeInline(form.creditName || defaultName),
      category: 'new-variation',
      entityType: 'technique',
      entityId: form.relatedTechniqueId || undefined,
      locale,
      summary: summary.length > 120 ? `${summary.slice(0, 117)}…` : summary,
      detailsMd,
      diffJson: fillMissing(flattened),
      media: summarizeMedia(form.media),
      clientVersion,
      honeypot: '',
    };
  }

  if (selectedType === 'improveTechnique') {
    const { improveTechnique } = draft;
    const label = findTechniqueName(improveTechnique.techniqueId);
    const summary = `Improvement for ${label}`;
    const detailsParts = improveTechnique.sections.map((section) => {
      if (section === 'steps') {
        return `### Steps\n${improveTechnique.steps
          .map((step, index) => `  ${index + 1}. ${step.text || '-'}`)
          .join('\n')}`;
      }
      const text = improveTechnique.textBySection[section as ImproveTextSection] || '';
      return `### ${section}\n${text || '-'}`;
    });
    const detailsMd = detailsParts.join('\n\n');
    return {
      name: escapeInline(defaultName),
      category: 'edit',
      entityType: 'technique',
      entityId: improveTechnique.techniqueId || undefined,
      locale,
      summary,
      detailsMd,
      diffJson: improveTechnique,
      media: summarizeMedia(improveTechnique.media),
      clientVersion,
      honeypot: '',
    };
  }

  if (selectedType === 'bugReport') {
    const bug = draft.bugReport;
    const fallback = bug.details.split('\n')[0]?.trim() || 'Bug report';
    const baseTitle = (bug.title ?? '').trim() || fallback;
    const withLocation = bug.location?.trim() ? `${baseTitle} — ${bug.location.trim()}` : baseTitle;
    const summary = withLocation.length > 120 ? `${withLocation.slice(0, 117)}…` : withLocation;
    const detailsMd = `### What happened\n${bug.details}\n\n### Steps to reproduce\n${bug.reproduction}`;
    return {
      name: escapeInline(defaultName),
      category: 'bug',
      entityType: 'other',
      summary,
      detailsMd,
      diffJson: bug,
      clientVersion,
      // userAgent intentionally omitted per privacy settings
      honeypot: '',
    };
  }

  if (selectedType === 'appFeedback') {
    const feedback = draft.appFeedback;
    const fallback = feedback.feedback.split('\n')[0]?.trim() || 'App feedback';
    const baseTitle = (feedback.title ?? '').trim() || fallback;
    const withArea = feedback.area ? `${baseTitle} — ${feedback.area}` : baseTitle;
    const summary = withArea.length > 120 ? `${withArea.slice(0, 117)}…` : withArea;
    const detailsMd = feedback.feedback;
    return {
      name: escapeInline(defaultName),
      category: 'suggestion',
      entityType: 'guide',
      summary,
      detailsMd,
      diffJson: feedback,
      media: summarizeMedia(
        feedback.screenshotUrl
          ? [
              {
                id: createId(),
                type: 'link',
                url: feedback.screenshotUrl,
                title: 'Screenshot',
              },
            ]
          : [],
      ),
      clientVersion,
      honeypot: '',
    };
  }

  return null;
};

const defaultNewTechniqueForm = (): NewTechniqueForm => ({
  name: '',
  jpName: '',
  attack: null,
  category: null,
  weapon: null,
  entries: '',
  hanmi: null,
  summary: '',
  levelHint: '',
  steps: [{ id: createId(), text: '' }],
  ukeRole: '',
  ukeNotes: ['', '', ''],
  keyPoints: ['', '', ''],
  commonMistakes: ['', '', ''],
  media: [],
  sources: '',
  creditName: '',
  trainerCredit: '',
  markAsBase: true,
  consent: false,
});

const defaultImproveTechniqueForm = (): ImproveTechniqueForm => ({
  techniqueId: null,
  sections: [],
  steps: [{ id: createId(), text: '' }],
  textBySection: {},
  media: [],
  source: '',
  credit: '',
  consent: false,
});

const defaultVariationForm = (): VariationForm => ({
  relatedTechniqueId: null,
  direction: '',
  stance: null,
  trainer: '',
  summary: '',
  categoryTags: [],
  level: null,
  steps: [{ id: createId(), text: '' }],
  keyPoints: ['', '', ''],
  commonMistakes: ['', '', ''],
  ukeInstructions: '',
  media: [],
  context: '',
  creditName: '',
  trainerCredit: '',
  markAsBase: false,
  consent: false,
});

const defaultAppFeedbackForm = (): AppFeedbackForm => ({
  area: null,
  title: '',
  feedback: '',
  screenshotUrl: '',
});

const defaultBugReportForm = (): BugReportForm => ({
  title: '',
  location: '',
  details: '',
  reproduction: '',
});

const defaultDraft = (): FeedbackDraft => ({
  selectedType: null,
  improveTechnique: defaultImproveTechniqueForm(),
  addVariation: defaultVariationForm(),
  appFeedback: defaultAppFeedbackForm(),
  bugReport: defaultBugReportForm(),
  newTechnique: defaultNewTechniqueForm(),
});

const isBrowser = typeof window !== 'undefined';

const detectMedia = (rawUrl: string): MediaEntry | null => {
  const url = rawUrl.trim();
  if (!url) return null;

  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return {
      id: createId(),
      url,
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    };
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      id: createId(),
      url,
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  if (/\.(jpe?g|png|gif|webp|avif)$/i.test(url)) {
    return {
      id: createId(),
      url,
      type: 'image',
    };
  }

  return {
    id: createId(),
    url,
    type: 'link',
  };
};

const loadDraft = (): FeedbackDraft => {
  if (!isBrowser) return defaultDraft();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultDraft();

    // Parse as any to support legacy draft shapes (backwards compatibility)
    // and avoid strict property checks during migration.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed: any = JSON.parse(stored);

    const selectedType = feedbackTypeOrder.includes(parsed.selectedType as FeedbackType)
      ? (parsed.selectedType as FeedbackType)
      : null;

    const improveTechnique = parsed.improveTechnique ?? defaultImproveTechniqueForm();
    const addVariation = parsed.addVariation ?? defaultVariationForm();
    const appFeedback = parsed.appFeedback ?? defaultAppFeedbackForm();
    const bugReport = parsed.bugReport ?? defaultBugReportForm();
    const newTechnique = parsed.newTechnique ?? defaultNewTechniqueForm();

    return {
      selectedType,
      improveTechnique: {
        ...defaultImproveTechniqueForm(),
        ...improveTechnique,
        steps: (improveTechnique.steps ?? defaultImproveTechniqueForm().steps).map((step: any) => ({
          id: step.id || createId(),
          text: step.text || '',
        })),
        media: (improveTechnique.media ?? []).map((item: any) => ({
          id: item.id || createId(),
          url: item.url,
          type: item.type,
          embedUrl: item.embedUrl,
        })),
        consent: Boolean(improveTechnique.consent),
      },
      addVariation: {
        ...defaultVariationForm(),
        relatedTechniqueId: addVariation.relatedTechniqueId ?? null,
        direction: isVariationDirection(addVariation.direction)
          ? addVariation.direction
          : isVariationDirection(addVariation?.variationName)
          ? (addVariation.variationName as VariationForm['direction'])
          : '',
        stance: sanitizeHanmi(addVariation.stance),
        trainer: ensureString(addVariation.trainer ?? addVariation.credit),
        summary: ensureString(addVariation.summary ?? addVariation.description ?? ''),
        categoryTags: Array.isArray(addVariation.categoryTags)
          ? addVariation.categoryTags.filter(isCategoryTag)
          : [],
        level: addVariation.level && gradeOrder.includes(addVariation.level) ? addVariation.level : null,
        steps: ensureStepList(addVariation.steps),
        keyPoints: ensureStringList(addVariation.keyPoints, 3),
        commonMistakes: ensureStringList(addVariation.commonMistakes, 3),
        ukeInstructions: ensureString(addVariation.ukeInstructions),
        media: (addVariation.media ?? []).map((item: any) => ({
          id: item?.id || createId(),
          url: item?.url || '',
          type: item?.type || 'link',
          embedUrl: item?.embedUrl,
          title: item?.title ?? '',
        })).filter((item: any) => item.url),
        context: ensureString(addVariation.context),
        creditName: ensureString(addVariation.creditName ?? addVariation.credit ?? ''),
        trainerCredit: ensureString(addVariation.trainerCredit ?? ''),
        markAsBase: Boolean(addVariation.markAsBase),
        consent: Boolean(addVariation.consent),
      },
      appFeedback: {
        ...defaultAppFeedbackForm(),
        ...appFeedback,
        area: isAppArea(appFeedback.area) ? appFeedback.area : null,
      },
      bugReport: {
        ...defaultBugReportForm(),
        ...bugReport,
      },
      newTechnique: {
        ...defaultNewTechniqueForm(),
        name: ensureString(newTechnique.name),
        jpName: ensureString(newTechnique.jpName ?? newTechnique.jp?.kanji ?? ''),
        attack: typeof newTechnique.attack === 'string' ? newTechnique.attack : null,
        category: typeof newTechnique.category === 'string' ? newTechnique.category : null,
        weapon: typeof newTechnique.weapon === 'string' ? newTechnique.weapon : null,
        entries: sanitizeEntries(newTechnique.entries),
        hanmi: sanitizeHanmi(newTechnique.hanmi),
        summary: ensureString(newTechnique.summary),
        levelHint: ensureString(newTechnique.levelHint),
        steps: ensureStepList(newTechnique.steps),
        ukeRole: ensureString(newTechnique.ukeRole),
        ukeNotes: ensureStringList(newTechnique.ukeNotes, 3),
        keyPoints: ensureStringList(newTechnique.keyPoints, 3),
        commonMistakes: ensureStringList(newTechnique.commonMistakes, 3),
        media: (newTechnique.media ?? []).map((item: any) => ({
          id: item?.id || createId(),
          url: item?.url || '',
          type: item?.type || 'link',
          embedUrl: item?.embedUrl,
          title: item?.title ?? '',
        })).filter((item: any) => item.url),
        sources: ensureString(newTechnique.sources),
        creditName: ensureString(newTechnique.creditName ?? newTechnique.contributor?.name ?? ''),
        trainerCredit: ensureString(newTechnique.trainerCredit ?? newTechnique.lineage?.dojoOrTrainer ?? ''),
        markAsBase: newTechnique.markAsBase ?? newTechnique.lineage?.markAsBase ?? true,
        consent: Boolean(newTechnique.consent),
      },
    } satisfies FeedbackDraft;
  } catch (error) {
    console.warn('Failed to load feedback draft', error);
    return defaultDraft();
  }
};

type StepBuilderProps = {
  steps: StepItem[];
  onChange: (steps: StepItem[]) => void;
  label?: string;
  placeholderForIndex: (index: number) => string;
  helperText: string;
  addButtonLabel: string;
  removeButtonAria: (index: number) => string;
};

const StepBuilder = ({
  steps,
  onChange,
  label,
  placeholderForIndex,
  helperText,
  addButtonLabel,
  removeButtonAria,
}: StepBuilderProps): ReactElement => {
  const { prefersReducedMotion } = useMotionPreferences();
  const stepTransition = prefersReducedMotion ? { duration: 0.05 } : { duration: 0.18, ease: defaultEase };

  const handleStepChange = (id: string, text: string) => {
    onChange(steps.map((step) => (step.id === id ? { ...step, text } : step)));
  };

  const handleAddStep = () => {
    onChange([...steps, { id: createId(), text: '' }]);
  };

  const handleRemoveStep = (id: string) => {
    if (steps.length === 1) {
      onChange([{ id: createId(), text: '' }]);
      return;
    }
    onChange(steps.filter((step) => step.id !== id));
  };

  return (
    <div className="space-y-3">
      {label && <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>}
      <div className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              layout="position"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={stepTransition}
              className="grid grid-cols-[auto,1fr,auto] items-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-3 py-2 transition-soft focus-within:border-[var(--focus-halo-color)] focus-within:ring-2 focus-within:ring-[var(--focus-halo-color)] focus-within:ring-offset-0"
            >
              <span className="text-xs font-semibold text-subtle w-6 text-center">{index + 1}</span>
              <input
                type="text"
                value={step.text}
                onChange={(event) => handleStepChange(step.id, event.target.value)}
                placeholder={placeholderForIndex(index)}
                className="w-full bg-transparent text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveStep(step.id)}
                aria-label={removeButtonAria(index)}
                className="text-xs text-subtle hover:text-[var(--color-text)] transition-soft"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {helperText && <p className="text-xs text-subtle">{helperText}</p>}
      <button
        type="button"
        onClick={handleAddStep}
        className="text-sm text-[var(--color-accent, var(--color-text))] hover:underline"
      >
        + {addButtonLabel}
      </button>
    </div>
  );
};

type MediaManagerProps = {
  media: MediaEntry[];
  onChange: (media: MediaEntry[]) => void;
  placeholder: string;
  triggerLabel: string;
  addLabel: string;
  cancelLabel: string;
  removeLabel: string;
  allowedKinds?: MediaKind[];
  disallowMessage?: string;
};

const getMediaIcon = (type: MediaKind): ReactElement => {
  switch (type) {
    case 'youtube':
    case 'vimeo':
      return <span aria-hidden className="text-lg">▶</span>;
    case 'image':
      return <span aria-hidden className="text-lg">🖼️</span>;
    default:
      return <LinkIcon className="w-5 h-5" />;
  }
};

const normalizeUrl = (url: string): string => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
};

const MediaManager = ({
  media,
  onChange,
  placeholder,
  triggerLabel,
  addLabel,
  cancelLabel,
  removeLabel,
  allowedKinds,
  // title editing removed; media entries keep optional title metadata but UI no longer allows editing
  disallowMessage,
}: MediaManagerProps): ReactElement => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { prefersReducedMotion } = useMotionPreferences();
  const mediaTransition = prefersReducedMotion ? { duration: 0.05 } : { duration: 0.2, ease: defaultEase };

  const handleAdd = () => {
    const entry = detectMedia(inputValue);
    if (!entry) return;
    if (allowedKinds && !allowedKinds.includes(entry.type)) {
      setError(disallowMessage ?? 'Unsupported media type.');
      return;
    }
    // Do not add editable title field from UI; keep media entry as detected
    onChange([...media, { ...entry }]);
    setInputValue('');
    setError(null);
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(media.filter((item) => item.id !== id));
  };

  // title editing removed

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {media.map((item) => (
            <motion.div
              key={item.id}
              layout="position"
              initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={mediaTransition}
              className="flex flex-col gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-3 py-2 text-sm transition-soft"
            >
              <div className="flex items-start gap-3">
                {getMediaIcon(item.type)}
                <div className="min-w-0 flex-1">
                  <a
                    className="block truncate underline-offset-4 hover:underline"
                    href={normalizeUrl(item.url)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {item.url}
                  </a>
                  {/* Title editing removed per design; media entries keep optional title metadata but it's not editable in the form */}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="ml-auto text-xs text-subtle hover:text-[var(--color-text)] transition-soft"
                >
                  {removeLabel}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {isAdding ? (
          <motion.div
            layout="position"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
            transition={mediaTransition}
            className="flex flex-wrap gap-2"
          >
            <input
              type="url"
              value={inputValue}
              onChange={(event) => {
                setError(null);
                setInputValue(event.target.value);
              }}
              placeholder={placeholder}
              className="w-full sm:w-96 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm focus-halo focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-xl bg-[var(--color-text)] px-3 py-2 text-sm text-[var(--color-bg)]"
              >
                {addLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setError(null);
                  setInputValue('');
                }}
                className="rounded-xl border surface-border px-3 py-2 text-sm"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded-xl border border-dashed surface-border px-3 py-2 text-sm text-subtle hover:text-[var(--color-text)]"
          >
            + {triggerLabel}
          </button>
        )}
      </AnimatePresence>
      {error && <p className="text-xs text-[var(--color-error, #b91c1c)]">{error}</p>}
    </div>
  );
};

const hasContent = (value: string | null | undefined): boolean => Boolean(value && value.trim().length > 0);

const useAutosave = (draft: FeedbackDraft): void => {
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isBrowser) {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || !isBrowser) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.warn('Failed to persist feedback draft', error);
    }
  }, [draft, isHydrated]);
};

type FeedbackPageProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  onBack?: () => void;
  initialType?: FeedbackType | null;
  onConsumeInitialType?: () => void;
};

export const FeedbackPage = ({ copy, locale, techniques, onBack, initialType, onConsumeInitialType }: FeedbackPageProps): ReactElement => {
  const t: FeedbackPageCopy = copy.feedbackPage;
  const { prefersReducedMotion } = useMotionPreferences();
  const formTransition = prefersReducedMotion ? { duration: 0.05 } : { duration: 0.24, ease: defaultEase };
  const itemTransition = prefersReducedMotion ? { duration: 0.05 } : { duration: 0.18, ease: defaultEase };
  const [draft, setDraft] = useState<FeedbackDraft>(() => loadDraft());
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'success' | 'error' | 'submitting'>('idle');
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; issueNumber?: number; message?: string; requestId?: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [softWarningShown, setSoftWarningShown] = useState(false);

  const techniqueOptions = useMemo(() =>
    techniques
      .map((technique) => ({ value: technique.slug, label: technique.name[locale] || technique.name.en }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  [techniques, locale]);

  const attackOptions = useMemo<SelectOption<string>[]>(
    () =>
      getOrderedTaxonomyValues('attack').map((value) => ({
        value,
        label: getTaxonomyLabel(locale, 'attack', value),
      })),
  [locale],
  );

  const categoryOptions = useMemo<SelectOption<string>[]>(
    () =>
      getOrderedTaxonomyValues('category').map((value) => ({
        value,
        label: getTaxonomyLabel(locale, 'category', value),
      })),
    [locale],
  );

  const weaponOptions = useMemo<SelectOption<string>[]>(
    () =>
      getOrderedTaxonomyValues('weapon').map((value) => ({
        value,
        label: getTaxonomyLabel(locale, 'weapon', value),
      })),
    [locale],
  );

  const selectedCard = draft.selectedType;

  const levelOptions = useMemo<SelectOption<string>[]>(
    () => [
      { value: 'none', label: t.options.notSpecified },
      ...gradeOrder.map((grade) => ({ value: grade, label: getLevelLabel(locale, grade) })),
    ],
    [locale, t.options.notSpecified],
  );

  const cardContent = useMemo<Record<FeedbackType, { icon: ReactElement; title: string; description: string }>>(
    () => ({
      improveTechnique: {
        icon: <RocketIcon className="w-5 h-5" aria-hidden />,
        title: t.cards.improve.title,
        description: t.cards.improve.description,
      },
      addVariation: {
        icon: <BadgePlusIcon className="w-5 h-5" aria-hidden />,
        title: t.cards.variation.title,
        description: t.cards.variation.description,
      },
      newTechnique: {
        icon: <PencilLineIcon className="w-5 h-5" aria-hidden />,
        title: t.cards.newTechnique.title,
        description: t.cards.newTechnique.description,
      },
      appFeedback: {
        icon: <LightbulbIcon className="w-5 h-5" aria-hidden />,
        title: t.cards.app.title,
        description: t.cards.app.description,
      },
      bugReport: {
        icon: <BugIcon className="w-5 h-5" aria-hidden />,
        title: t.cards.bug.title,
        description: t.cards.bug.description,
      },
    }),
    [t.cards],
  );

  useEffect(() => {
    if (!initialType) return;
    setDraft((current) => {
      if (current.selectedType === initialType) return current;
      return {
        ...current,
        selectedType: initialType,
      };
    });
    onConsumeInitialType?.();
  }, [initialType, onConsumeInitialType]);

  useEffect(() => {
    setSubmissionState('idle');
    setSubmitResult(null);
    setSubmitError(null);
  }, [selectedCard]);

  const categoryTagLabels = t.categoryTags as Record<CategoryTag, string>;
  const areaLabels = t.appAreas as Record<AppArea, string>;
  const improveSectionLabels = t.improve.sections as Record<ImproveSection, string>;

  useAutosave(draft);

  const slugPreview = useMemo(
  () => buildNewTechniqueSlug(draft.newTechnique.name),
  [draft.newTechnique.name],
  );

  const duplicateMatches = useMemo(
    () => computeDuplicateMatches(draft.newTechnique, techniques),
    [draft.newTechnique, techniques],
  );

  const unusualCombo = useMemo(
    () => isUnusualAttackWeapon(draft.newTechnique.attack, draft.newTechnique.weapon),
    [draft.newTechnique.attack, draft.newTechnique.weapon],
  );

  const summaryLength = draft.newTechnique.summary.trim().length;
  const summaryExceeded = summaryLength > SUMMARY_MAX;
  const summaryRemaining = SUMMARY_MAX - summaryLength;
  const summaryEmpty = summaryLength === 0;

  useEffect(() => {
    if (!isBrowser) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setShowJsonPreview((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(defaultDraft());
    setSubmissionState('idle');
    setSubmitResult(null);
    setSubmitError(null);
  }, []);

  // Clear only the active form fields but keep the selected card.
  const clearCurrentForm = useCallback((type?: FeedbackType) => {
    setDraft((current) => {
      const sel = type ?? current.selectedType;
      if (!sel) return current;
      switch (sel) {
        case 'improveTechnique':
          return { ...current, improveTechnique: defaultImproveTechniqueForm() };
        case 'addVariation':
          return { ...current, addVariation: defaultVariationForm() };
        case 'newTechnique':
          return { ...current, newTechnique: defaultNewTechniqueForm() };
        case 'appFeedback':
          return { ...current, appFeedback: defaultAppFeedbackForm() };
        case 'bugReport':
          return { ...current, bugReport: defaultBugReportForm() };
        default:
          return current;
      }
    });
    setSoftWarningShown(false);
  }, []);

  const handleTypeChange = (feedbackType: FeedbackType) => {
    setSubmissionState('idle');
    setSubmitError(null);
    setSubmitResult(null);
    setDraft((current) => {
      if (current.selectedType === feedbackType) return current;
      return { ...current, selectedType: feedbackType };
    });
  };

  const updateImprove = <K extends keyof ImproveTechniqueForm>(key: K, value: ImproveTechniqueForm[K]) => {
    setDraft((current) => ({
      ...current,
      improveTechnique: {
        ...current.improveTechnique,
        [key]: value,
      },
    }));
  };

  const updateVariation = <K extends keyof VariationForm>(key: K, value: VariationForm[K]) => {
    setDraft((current) => ({
      ...current,
      addVariation: {
        ...current.addVariation,
        [key]: value,
      },
    }));
  };

  const updateAppFeedback = <K extends keyof AppFeedbackForm>(key: K, value: AppFeedbackForm[K]) => {
    setDraft((current) => ({
      ...current,
      appFeedback: {
        ...current.appFeedback,
        [key]: value,
      },
    }));
  };

  const updateBugReport = <K extends keyof BugReportForm>(key: K, value: BugReportForm[K]) => {
    setDraft((current) => ({
      ...current,
      bugReport: {
        ...current.bugReport,
        [key]: value,
      },
    }));
  };

  const setNewTechnique = (updater: (form: NewTechniqueForm) => NewTechniqueForm) => {
    setDraft((current) => ({
      ...current,
      newTechnique: updater(current.newTechnique),
    }));
  };

  const updateNewTechnique = <K extends keyof NewTechniqueForm>(key: K, value: NewTechniqueForm[K]) => {
    setNewTechnique((form) => ({
      ...form,
      [key]: value,
    }));
  };

  const techniquePlaceholder =
    techniqueOptions.length > 0 ? t.options.searchTechniques : t.options.techniquesLoading;

  const isImproveReady = useMemo(() => {
    const { techniqueId, sections, steps, textBySection } = draft.improveTechnique;
    if (!hasContent(techniqueId)) return false;
    if (sections.length === 0) return false;

    const requiresSteps = sections.includes('steps');
    const hasStepContent = steps.some((step) => hasContent(step.text));
    if (requiresSteps && !hasStepContent) {
      return false;
    }

    const selectedTextSections = sections.filter((section): section is ImproveTextSection => section !== 'steps');
    if (selectedTextSections.length > 0) {
      const hasTextContent = selectedTextSections.some((section) => hasContent(textBySection[section]));
      if (!hasTextContent) return false;
    }

    return draft.improveTechnique.consent;
  }, [draft.improveTechnique]);

  const isVariationReady = useMemo(() => {
    const {
      relatedTechniqueId,
      direction,
      stance,
      trainer,
      summary,
      steps,
      keyPoints,
      commonMistakes,
      ukeInstructions,
      consent,
    } = draft.addVariation;
    const hasSteps = steps.some((step) => hasContent(step.text));
    const keyPointsComplete = keyPoints.every((item) => hasContent(item));
    const mistakesComplete = commonMistakes.every((item) => hasContent(item));
    return (
      hasContent(relatedTechniqueId) &&
      isVariationDirection(direction) &&
      Boolean(stance) &&
      hasContent(trainer) &&
      hasContent(summary) &&
      hasSteps &&
      keyPointsComplete &&
      mistakesComplete &&
      hasContent(ukeInstructions) &&
      consent
    );
  }, [draft.addVariation]);

  const isAppFeedbackReady = useMemo(() => {
    return Boolean(draft.appFeedback.area) && hasContent(draft.appFeedback.feedback);
  }, [draft.appFeedback]);

  const isBugReportReady = useMemo(() => {
    return (
      hasContent(draft.bugReport.location) &&
      hasContent(draft.bugReport.details) &&
      hasContent(draft.bugReport.reproduction)
    );
  }, [draft.bugReport]);

  const isNewTechniqueReady = (() => {
    const form = draft.newTechnique;
    const taxonomyComplete = hasContent(form.attack) && hasContent(form.category) && hasContent(form.weapon);
  const entriesComplete = Boolean(form.entries);
    const hanmiComplete = Boolean(form.hanmi);
    const stepsComplete = form.steps.some((step) => hasContent(step.text));
    const ukeListComplete = form.ukeNotes.every((item) => hasContent(item));
    const keyPointsComplete = form.keyPoints.every((item) => hasContent(item));
    const mistakesComplete = form.commonMistakes.every((item) => hasContent(item));

    return (
      hasContent(form.name) &&
      taxonomyComplete &&
      entriesComplete &&
      hanmiComplete &&
      hasContent(form.summary) &&
      !summaryExceeded &&
      stepsComplete &&
      hasContent(form.ukeRole) &&
      ukeListComplete &&
      keyPointsComplete &&
      mistakesComplete &&
      form.consent
    );
  })();

  const isSubmitEnabled =
    selectedCard === 'improveTechnique'
      ? isImproveReady
      : selectedCard === 'addVariation'
      ? isVariationReady
      : selectedCard === 'newTechnique'
      ? isNewTechniqueReady
      : selectedCard === 'appFeedback'
      ? isAppFeedbackReady
      : selectedCard === 'bugReport'
      ? isBugReportReady
      : false;
  // Prevent submitting while already submitting or after a successful submit.
  const canSubmit = isSubmitEnabled && submissionState !== 'submitting' && submissionState !== 'success';

  const formatCount = (count: number, forms: { one: string; many: string }): string =>
    (count === 1 ? forms.one : forms.many).replace('{count}', String(count));

  const findTechniqueName = useCallback(
    (slug: string | null) => {
      if (!slug) return '—';
      const technique = techniques.find((item) => item.slug === slug);
      if (!technique) return '—';
      return technique.name[locale] || technique.name.en;
    },
    [locale, techniques],
  );

  const summaryEntries = useMemo(() => {
    if (!selectedCard) {
      return [
        { label: t.summary.labels.status, value: t.summary.emptyStatus },
      ];
    }

    if (selectedCard === 'improveTechnique') {
      const { techniqueId, sections, steps, textBySection, media, source, credit } = draft.improveTechnique;
      const populatedSections = sections.map((section) => improveSectionLabels[section]).join(', ');
      const stepCount = steps.filter((step) => hasContent(step.text)).length;
      const textCount = sections
        .filter((section): section is ImproveTextSection => section !== 'steps')
        .map((section) => textBySection[section])
        .filter((value) => hasContent(value)).length;

      return [
        { label: t.summary.labels.type, value: cardContent[selectedCard].title },
        { label: t.summary.labels.technique, value: findTechniqueName(techniqueId) },
        { label: t.summary.labels.sections, value: populatedSections || '—' },
        {
          label: t.summary.labels.steps,
          value: stepCount > 0 ? formatCount(stepCount, t.summary.counts.stepsUpdated) : '—',
        },
        {
          label: t.summary.labels.textUpdates,
          value: textCount > 0 ? formatCount(textCount, t.summary.counts.textSections) : '—',
        },
        {
          label: t.summary.labels.media,
          value: media.length > 0 ? formatCount(media.length, t.summary.counts.media) : '—',
        },
        { label: t.summary.labels.source, value: hasContent(source) ? source : '—' },
        { label: t.summary.labels.credit, value: hasContent(credit) ? credit : '—' },
        {
          label: t.summary.labels.consent,
          value: draft.improveTechnique.consent ? t.summary.boolean.yes : t.summary.boolean.no,
        },
      ];
    }

    if (selectedCard === 'addVariation') {
      const form = draft.addVariation;
      const stepCount = form.steps.filter((step) => hasContent(step.text)).length;
      const tagLabels = form.categoryTags.map((tag) => categoryTagLabels[tag]);
      const directionLabel = isVariationDirection(form.direction)
        ? t.forms.variation.directionOptions[form.direction as VariationDirection]
        : t.summary.notSpecified;
      const stanceLabel = form.stance ? t.newTechnique.hanmiOptions[form.stance] : t.summary.notSpecified;
      const summaryPreview = hasContent(form.summary)
        ? form.summary.length > 90
          ? `${form.summary.slice(0, 87)}…`
          : form.summary
        : '—';

      return [
        { label: t.summary.labels.type, value: cardContent[selectedCard].title },
        { label: t.summary.labels.technique, value: findTechniqueName(form.relatedTechniqueId) },
        { label: t.summary.labels.direction, value: directionLabel },
        { label: t.summary.labels.hanmi, value: stanceLabel },
        { label: t.summary.labels.trainer, value: hasContent(form.trainer) ? form.trainer : '—' },
        { label: t.summary.labels.summary, value: summaryPreview },
        { label: t.summary.labels.tags, value: tagLabels.length > 0 ? tagLabels.join(', ') : '—' },
        {
          label: t.summary.labels.level,
          value: form.level ? getLevelLabel(locale, form.level) : t.summary.notSpecified,
        },
        {
          label: t.summary.labels.steps,
          value: stepCount > 0 ? formatCount(stepCount, t.summary.counts.documentedSteps) : '—',
        },
        { label: t.summary.labels.credit, value: hasContent(form.creditName) ? form.creditName : '—' },
        {
          label: t.summary.labels.markAsBase,
          value: form.markAsBase ? t.summary.boolean.yes : t.summary.boolean.no,
        },
        {
          label: t.summary.labels.consent,
          value: form.consent ? t.summary.boolean.yes : t.summary.boolean.no,
        },
      ];
    }

    if (selectedCard === 'newTechnique') {
      const form = draft.newTechnique;
      const entriesLabel = form.entries
        ? (t.newTechnique.entryLabels as any)[form.entries] ?? String(form.entries)
        : t.summary.notSpecified;
      const hanmiLabel = form.hanmi ? t.newTechnique.hanmiOptions[form.hanmi] : t.summary.notSpecified;
      const attackLabel = form.attack ? getTaxonomyLabel(locale, 'attack', form.attack) : t.summary.notSpecified;
      const categoryLabel = form.category ? getTaxonomyLabel(locale, 'category', form.category) : t.summary.notSpecified;
      const weaponLabel = form.weapon ? getTaxonomyLabel(locale, 'weapon', form.weapon) : t.summary.notSpecified;
      const duplicateLabel = duplicateMatches.length
        ? formatCount(duplicateMatches.length, t.summary.counts.duplicates)
        : t.newTechnique.duplicates.none;

      return [
        { label: t.summary.labels.type, value: cardContent[selectedCard].title },
        { label: t.summary.labels.name, value: form.name || '—' },
        { label: t.summary.labels.jpName, value: form.jpName || '—' },
        { label: t.summary.labels.attack, value: attackLabel },
        { label: t.summary.labels.category, value: categoryLabel },
        { label: t.summary.labels.weapon, value: weaponLabel },
        { label: t.summary.labels.entries, value: entriesLabel },
        { label: t.summary.labels.hanmi, value: hanmiLabel },
        { label: t.summary.labels.levelHint, value: form.levelHint || '—' },
        { label: t.summary.labels.slug, value: slugPreview || '—' },
        { label: t.summary.labels.summary, value: `${summaryLength}/${SUMMARY_MAX}` },
        { label: t.summary.labels.credit, value: form.creditName || '—' },
        { label: t.summary.labels.trainerCredit, value: form.trainerCredit || '—' },
        {
          label: t.summary.labels.markAsBase,
          value: form.markAsBase ? t.summary.boolean.yes : t.summary.boolean.no,
        },
        {
          label: t.summary.labels.consent,
          value: form.consent ? t.summary.boolean.yes : t.summary.boolean.no,
        },
        {
          label: t.summary.labels.duplicates,
          value: duplicateLabel,
        },
      ];
    }

    if (selectedCard === 'appFeedback') {
      const { area, feedback, screenshotUrl } = draft.appFeedback;
      return [
        { label: t.summary.labels.type, value: cardContent[selectedCard].title },
        { label: t.summary.labels.area, value: area ? areaLabels[area] : t.summary.notSpecified },
        {
          label: t.summary.labels.feedback,
          value: hasContent(feedback) ? formatCount(feedback.length, t.summary.counts.characters) : '—',
        },
        { label: t.summary.labels.link, value: hasContent(screenshotUrl) ? screenshotUrl : '—' },
      ];
    }

  const { location, details, reproduction } = draft.bugReport;
    const reproductionLines = reproduction
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return [
      { label: t.summary.labels.type, value: cardContent[selectedCard].title },
      { label: t.summary.labels.location, value: hasContent(location) ? location : '—' },
      {
        label: t.summary.labels.details,
        value: hasContent(details) ? formatCount(details.length, t.summary.counts.characters) : '—',
      },
      {
        label: t.summary.labels.reproduction,
        value: reproductionLines.length > 0
          ? formatCount(reproductionLines.length, t.summary.counts.reproduction)
          : '—',
      },
      // includeSystemInfo removed from summary per privacy change
    ];
  }, [
    areaLabels,
    cardContent,
    categoryTagLabels,
    draft,
    duplicateMatches,
    findTechniqueName,
    improveSectionLabels,
    locale,
    selectedCard,
    slugPreview,
    summaryLength,
    t.forms,
    t.newTechnique,
    t.summary,
  ]);

  const consentChecked =
    selectedCard === 'improveTechnique'
      ? draft.improveTechnique.consent
      : selectedCard === 'addVariation'
      ? draft.addVariation.consent
      : selectedCard === 'newTechnique'
      ? draft.newTechnique.consent
      : null;

  const consentWarningText =
    selectedCard === 'newTechnique'
      ? t.newTechnique.warnings.consentMissing
      : t.shared.validation?.consentMissing ?? t.newTechnique.warnings.consentMissing;

  const handleConsentChange = (checked: boolean) => {
    if (selectedCard === 'improveTechnique') {
      updateImprove('consent', checked);
    } else if (selectedCard === 'addVariation') {
      updateVariation('consent', checked);
    } else if (selectedCard === 'newTechnique') {
      updateNewTechnique('consent', checked);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    let payload: unknown | null = null;
    if (selectedCard === 'newTechnique') {
      const { payload: newTechniquePayload, allTextEmpty, stepsEmpty } = buildNewTechniqueSubmission(
        draft.newTechnique,
        { locale, entityId: slugPreview || undefined },
      );
      if (allTextEmpty && stepsEmpty && !softWarningShown) {
        setSubmitError('Please add at least one step or a short summary. Click Submit again to proceed.');
        setSoftWarningShown(true);
        setSubmissionState('idle');
        return;
      }
      payload = newTechniquePayload;
    } else {
      payload = buildFeedbackPayload(selectedCard, draft, {
        slugPreview,
        duplicateMatches,
        locale,
        findTechniqueName,
      });
    }

    if (!payload) {
      setSubmitError(t.newTechnique.errors.generic);
      setSubmissionState('error');
      return;
    }

    // details length rule removed — allow shorter submissions

    setSubmissionState('submitting');
    setSubmitError(null);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({ ok: false }));

      if (response.ok && result?.ok) {
        setSubmitResult(result);
        setSubmissionState('success');
        // Clear only the active form fields so inputs become empty, but keep the selected card visible.
        clearCurrentForm(selectedCard ?? undefined);
      } else {
        const message = result?.message || 'Feedback submission failed.';
        setSubmitError(message);
        setSubmitResult(result);
        setSubmissionState('error');
      }
    } catch (error) {
      console.error('[feedback-submit]', error);
      setSubmitError('Network error while sending feedback.');
      setSubmissionState('error');
    }
  };

  const buildDownloadPayload = () => {
    if (selectedCard === 'newTechnique') {
      const { payload } = buildNewTechniqueSubmission(draft.newTechnique, {
        locale,
        entityId: slugPreview || undefined,
      });
      return payload;
    }

    const payload = buildFeedbackPayload(selectedCard, draft, {
      slugPreview,
      duplicateMatches,
      locale,
      findTechniqueName,
    });
    if (!payload) return null;
    return payload;
  };

  const handleDownloadJson = () => {
    const payload = buildDownloadPayload();
    if (!payload) return;
    const typeLabel = selectedCard === 'newTechnique' ? 'new-technique-v1' : selectedCard === 'addVariation' ? 'variation' : selectedCard === 'improveTechnique' ? 'improve' : selectedCard === 'bugReport' ? 'bug' : selectedCard === 'appFeedback' ? 'app' : 'unknown';
    const ts = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(
      ts.getMinutes(),
    )}${pad(ts.getSeconds())}`;
    const filename = `enso-feedback-${typeLabel}-${timestamp}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const stepPlaceholder = (index: number) => t.placeholders.step.replace('{index}', String(index + 1));
  const removeStepAria = (index: number) => t.builder.removeStepAria.replace('{index}', String(index + 1));

  const renderImproveForm = (): ReactElement => {
    const { techniqueId, sections, textBySection, source, credit, steps, media } = draft.improveTechnique;

    const toggleSection = (section: ImproveSection) => {
      const isSelected = sections.includes(section);
      const nextSections = isSelected
        ? sections.filter((item) => item !== section)
        : [...sections, section];
      updateImprove('sections', nextSections);
    };

    const handleTextChange = (section: ImproveTextSection, value: string) => {
      updateImprove('textBySection', {
        ...textBySection,
        [section]: value,
      });
    };

    return (
      <motion.div
        key="improve"
        layout="position"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
        transition={formTransition}
        className="space-y-6"
      >
        <section className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text)]">
            {t.forms.improve.techniqueLabel}
          </label>
          <Select
            options={techniqueOptions}
            value={techniqueId ?? ''}
            onChange={(value) => updateImprove('techniqueId', value)}
            searchable
            placeholder={techniquePlaceholder}
            className="w-full"
          />
        </section>

        <section className="space-y-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">{t.forms.improve.sectionsLabel}</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(improveSectionLabels).map((section) => {
              const typedSection = section as ImproveSection;
              const isActive = sections.includes(typedSection);
              return (
                <label key={section} className="cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleSection(typedSection)}
                    className="sr-only"
                  />
                  <Chip
                    label={improveSectionLabels[typedSection]}
                    active={isActive}
                    onClick={() => toggleSection(typedSection)}
                    aria-pressed={isActive}
                  />
                </label>
              );
            })}
          </div>
        </section>

        <AnimatePresence initial={false} mode="popLayout">
          {sections.includes('steps') && (
            <motion.section
              key="steps"
              layout="position"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={itemTransition}
              className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-4"
            >
              <StepBuilder
                label={t.forms.improve.stepsLabel}
                steps={steps}
                onChange={(nextSteps) => updateImprove('steps', nextSteps)}
                placeholderForIndex={stepPlaceholder}
                helperText={t.hints.stepHelper}
                addButtonLabel={t.buttons.addStep}
                removeButtonAria={removeStepAria}
              />
            </motion.section>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="popLayout">
          {sections
            .filter((section): section is ImproveTextSection => section !== 'steps')
            .map((section) => (
              <motion.section
                key={section}
                layout="position"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={itemTransition}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-[var(--color-text)]">
                  {improveSectionLabels[section]}
                </label>
                <textarea
                  rows={4}
                  value={textBySection[section] ?? ''}
                  onChange={(event) => handleTextChange(section, event.target.value)}
                  placeholder={t.forms.improve.textPlaceholder}
                  className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none"
                />
              </motion.section>
            ))}
        </AnimatePresence>

        <section className="space-y-3">
          <span className="text-sm font-semibold text-[var(--color-text)]">{t.forms.improve.mediaLabel}</span>
          <MediaManager
            media={media}
            onChange={(items) => updateImprove('media', items)}
            placeholder={t.placeholders.mediaUrl}
            triggerLabel={t.buttons.addMediaTrigger}
            addLabel={t.buttons.addAction}
            cancelLabel={t.buttons.cancel}
            removeLabel={t.buttons.remove}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.improve.sourceLabel}</label>
            <input
              type="text"
              value={source}
              onChange={(event) => updateImprove('source', event.target.value)}
              placeholder={t.placeholders.source}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
            />
          </div>
          <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.improve.creditLabel}</label>
            <input
              type="text"
              value={credit}
              onChange={(event) => updateImprove('credit', event.target.value)}
              placeholder={t.placeholders.credit}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
            />
          </div>
        </section>
      </motion.div>
    );
  };

  const renderVariationForm = (): ReactElement => {
    const {
      relatedTechniqueId,
      direction,
      stance,
      trainer,
      summary,
      categoryTags,
      level,
      steps,
      keyPoints,
      commonMistakes,
      ukeInstructions,
      media,
      context,
      creditName,
      trainerCredit,
      markAsBase,
    } = draft.addVariation;

    const directionOptions: SelectOption<string>[] = [
      { value: 'none', label: t.options.selectDirection },
      { value: 'irimi', label: t.forms.variation.directionOptions.irimi },
      { value: 'tenkan', label: t.forms.variation.directionOptions.tenkan },
      { value: 'omote', label: t.forms.variation.directionOptions.omote },
      { value: 'ura', label: t.forms.variation.directionOptions.ura },
    ];

    const stanceOptions: SelectOption<string>[] = [
      { value: 'none', label: t.options.selectHanmi },
      { value: 'ai-hanmi', label: t.newTechnique.hanmiOptions['ai-hanmi'] },
      { value: 'gyaku-hanmi', label: t.newTechnique.hanmiOptions['gyaku-hanmi'] },
    ];

    const toggleTag = (tag: CategoryTag) => {
      const isActive = categoryTags.includes(tag);
      const nextTags = isActive ? categoryTags.filter((item) => item !== tag) : [...categoryTags, tag];
      updateVariation('categoryTags', nextTags);
    };

    const handleDirectionChange = (value: string) => {
      updateVariation('direction', value === 'none' ? '' : (value as VariationForm['direction']));
    };

    const handleStanceChange = (value: string) => {
      updateVariation('stance', value === 'none' ? null : (value as Hanmi));
    };

    const handleListItemChange = (field: 'keyPoints' | 'commonMistakes', index: number, value: string) => {
      const source = field === 'keyPoints' ? keyPoints : commonMistakes;
      const next = [...source];
      next[index] = value;
      updateVariation(field, next);
    };

    const renderBulletList = (field: 'keyPoints' | 'commonMistakes', label: string, placeholder: string) => {
      const items = field === 'keyPoints' ? keyPoints : commonMistakes;
      return (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
          <div className="space-y-2">
            {items.map((value, index) => (
              <div key={`${field}-${index}`} className="flex items-center gap-3">
                <span className="w-6 text-center text-sm text-subtle">{index + 1}.</span>
                <input
                  value={value}
                  onChange={(event) => handleListItemChange(field, index, event.target.value)}
                  placeholder={placeholder}
                  className="flex-1 rounded-xl border surface-border bg-[var(--color-surface)] px-3 py-2 text-sm focus-halo focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      );
    };

    const markAsBaseHelp = t.shared.help?.markAsBase;

    return (
      <motion.div
        key="variation"
        layout="position"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
        transition={formTransition}
        className="space-y-8"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.forms.variation.sections.details}</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.relatedTechniqueLabel}</label>
            <Select
              options={techniqueOptions}
              value={relatedTechniqueId ?? ''}
              onChange={(value) => updateVariation('relatedTechniqueId', value)}
              searchable
              placeholder={techniquePlaceholder}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.directionLabel}</label>
              <Select options={directionOptions} value={direction || 'none'} onChange={handleDirectionChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.stanceLabel}</label>
              <Select options={stanceOptions} value={stance ?? 'none'} onChange={handleStanceChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.levelLabel}</label>
              <Select
                options={levelOptions}
                value={level ?? 'none'}
                onChange={(value) => updateVariation('level', value === 'none' ? null : (value as Grade))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.trainerLabel}</label>
            <input
              type="text"
              value={trainer}
              onChange={(event) => updateVariation('trainer', event.target.value)}
              placeholder={t.placeholders.variationTrainer}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.forms.variation.sections.summary}</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.summaryLabel}</label>
            <textarea
              rows={4}
              value={summary}
              onChange={(event) => updateVariation('summary', event.target.value)}
              placeholder={t.placeholders.variationSummary}
              className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none"
            />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.categoryTagsLabel}</h3>
            <div className="flex flex-wrap gap-2">
              {categoryTagOrder.map((tag) => {
                const isActive = categoryTags.includes(tag);
                return (
                  <label key={tag} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleTag(tag)}
                      className="sr-only"
                    />
                    <Chip
                      label={categoryTagLabels[tag]}
                      active={isActive}
                      onClick={() => toggleTag(tag)}
                      aria-pressed={isActive}
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.forms.variation.sections.steps}</h2>
          <div className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-4">
            <StepBuilder
              label={t.forms.variation.stepsLabel}
              steps={steps}
              onChange={(nextSteps) => updateVariation('steps', nextSteps)}
              placeholderForIndex={stepPlaceholder}
              helperText={t.hints.stepHelper}
              addButtonLabel={t.buttons.addStep}
              removeButtonAria={removeStepAria}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.forms.variation.sections.insights}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {renderBulletList('keyPoints', t.forms.variation.keyPointsLabel, t.placeholders.variationKeyPoint)}
            {renderBulletList('commonMistakes', t.forms.variation.commonMistakesLabel, t.placeholders.variationMistake)}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.forms.variation.sections.uke}</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.ukeLabel}</label>
            <textarea
              rows={3}
              value={ukeInstructions}
              onChange={(event) => updateVariation('ukeInstructions', event.target.value)}
              placeholder={t.placeholders.variationUke}
              className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.variation.contextLabel}</label>
            <textarea
              rows={3}
              value={context}
              onChange={(event) => updateVariation('context', event.target.value)}
              placeholder={t.placeholders.variationContext}
              className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.shared.sections.media}</h2>
          <MediaManager
            media={media}
            onChange={(items) => updateVariation('media', items)}
            placeholder={t.placeholders.mediaUrl}
            triggerLabel={t.buttons.addMediaTrigger}
            addLabel={t.buttons.addAction}
            cancelLabel={t.buttons.cancel}
            removeLabel={t.buttons.remove}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.shared.sections.contributor}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.shared.labels.contributorName}</label>
              <input
                type="text"
                value={creditName}
                onChange={(event) => updateVariation('creditName', event.target.value)}
                placeholder={t.placeholders.contributorName}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.shared.labels.trainerCredit}</label>
              <input
                type="text"
                value={trainerCredit}
                onChange={(event) => updateVariation('trainerCredit', event.target.value)}
                placeholder={t.placeholders.variationTrainerCredit}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={markAsBase}
              onChange={(event) => updateVariation('markAsBase', event.target.checked)}
              className="h-4 w-4 rounded border surface-border"
            />
            {t.shared.labels.markAsBase}
          </label>
          {markAsBaseHelp && <p className="text-xs text-subtle">{markAsBaseHelp}</p>}
        </section>
      </motion.div>
    );
  };


  const renderNewTechniqueForm = (): ReactElement => {
    const form = draft.newTechnique;

    const hanmiOptions: SelectOption<string>[] = [
      { value: 'ai-hanmi', label: t.newTechnique.hanmiOptions['ai-hanmi'] },
      { value: 'gyaku-hanmi', label: t.newTechnique.hanmiOptions['gyaku-hanmi'] },
    ];

    const entrySelectOptions: SelectOption<string>[] = [
        { value: '', label: t.options.notSpecified },
        { value: 'irimi', label: t.newTechnique.entryLabels.irimi },
        { value: 'tenkan', label: t.newTechnique.entryLabels.tenkan },
        { value: 'omote', label: 'Omote' },
        { value: 'ura', label: 'Ura' },
      ];

    const handleListItemChange = (field: 'ukeNotes' | 'keyPoints' | 'commonMistakes', index: number, value: string) => {
      const next = [...form[field]];
      if (index >= 0 && index < next.length) {
        next[index] = value;
        updateNewTechnique(field, next);
      }
    };

    const renderList = (field: 'ukeNotes' | 'keyPoints' | 'commonMistakes', label: string, placeholder: string) => {
      const items = form[field];
      return (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{label}</h3>
          <div className="space-y-2">
            {items.map((value, index) => (
              <div key={`${field}-${index}`} className="flex items-center gap-3">
                <span className="text-sm text-subtle w-6 text-center">{index + 1}.</span>
                <input
                  value={value}
                  onChange={(event) => handleListItemChange(field, index, event.target.value)}
                  placeholder={placeholder}
                  className="flex-1 rounded-xl border surface-border bg-[var(--color-surface)] px-3 py-2 text-sm focus-halo focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      );
    };

    const summaryLabel = summaryExceeded
      ? t.newTechnique.hints.summaryExceeded.replace('{remaining}', String(Math.abs(summaryRemaining)))
      : t.newTechnique.hints.summaryRemaining.replace('{remaining}', String(summaryRemaining));

    return (
      <motion.div
        key="newTechnique"
        layout="position"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
        transition={formTransition}
        className="space-y-8"
      >
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.details}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]" htmlFor="nt-name">{t.newTechnique.fields.nameSingle}</label>
              <input
                id="nt-name"
                value={form.name}
                onChange={(event) => updateNewTechnique('name', event.target.value)}
                placeholder={t.placeholders.newTechniqueName}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
              />
              {/* Inline duplicates notice under name */}
              <div
                className={classNames(
                  'mt-2 rounded-xl border px-3 py-2 text-xs',
                  'surface-border bg-[var(--color-surface)]',
                )}
              >
                {duplicateMatches.length === 0 ? (
                  <span className="text-subtle">{t.newTechnique.duplicates.noneHint}</span>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[var(--color-text)]">{t.newTechnique.duplicates.possibleMatches}</p>
                    <ul className="space-y-1">
                      {duplicateMatches.slice(0, 3).map((tech) => (
                        <li key={`dup-inline-${tech.id}`} className="text-[var(--color-text)]">
                          <span className="font-medium">{tech.name[locale] || tech.name.en}</span>
                          <span className="text-subtle"> — {tech.slug}</span>
                        </li>
                      ))}
                    </ul>
                    {duplicateMatches.length > 3 && (
                      <p className="text-subtle">+{duplicateMatches.length - 3} more…</p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTypeChange('addVariation')}
                      className="text-[var(--color-accent, var(--color-text))] hover:underline"
                    >
                      {t.newTechnique.duplicates.switch}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]" htmlFor="nt-jp-name">{t.newTechnique.fields.jpName}</label>
              <input
                id="nt-jp-name"
                value={form.jpName}
                onChange={(event) => updateNewTechnique('jpName', event.target.value)}
                placeholder={t.placeholders.newTechniqueKanji}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.taxonomy}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.newTechnique.fields.attack}</label>
              <Select
                options={attackOptions}
                value={form.attack ?? ''}
                onChange={(value) => updateNewTechnique('attack', value || null)}
                placeholder={t.placeholders.newTechniqueAttack}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.newTechnique.fields.category}</label>
              <Select
                options={categoryOptions}
                value={form.category ?? ''}
                onChange={(value) => updateNewTechnique('category', value || null)}
                placeholder={t.placeholders.newTechniqueCategory}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.newTechnique.fields.weapon}</label>
              <Select
                options={weaponOptions}
                value={form.weapon ?? ''}
                onChange={(value) => updateNewTechnique('weapon', value || null)}
                placeholder={t.placeholders.newTechniqueWeapon}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.newTechnique.fields.hanmi}</label>
              <Select
                options={hanmiOptions}
                value={form.hanmi ?? ''}
                onChange={(value) => updateNewTechnique('hanmi', value === 'ai-hanmi' || value === 'gyaku-hanmi' ? (value as Hanmi) : null)}
                placeholder={t.placeholders.newTechniqueHanmi}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.newTechnique.fields.entries}</label>
              <Select
                options={entrySelectOptions}
                value={form.entries ?? ''}
                onChange={(value) => updateNewTechnique('entries', (value as Entry) || '')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.newTechnique.fields.levelHint}</label>
              <input
                value={form.levelHint}
                onChange={(event) => updateNewTechnique('levelHint', event.target.value)}
                placeholder={t.placeholders.newTechniqueLevel}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
              />
            </div>
          </div>
          {slugPreview && (
            <p className="text-xs text-subtle">
              {t.newTechnique.fields.slugPreview}: <span className="font-mono">{slugPreview}</span>
            </p>
          )}
          {unusualCombo && (
            <div className="rounded-lg border border-dashed surface-border px-3 py-2 text-xs text-subtle">
              {t.newTechnique.hints.unusualCombo}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text)]" htmlFor="nt-summary">
            {t.newTechnique.fields.summarySingle}
          </label>
              <textarea
                id="nt-summary"
                rows={4}
                value={form.summary}
                onChange={(event) => updateNewTechnique('summary', event.target.value)}
                placeholder={t.placeholders.newTechniqueSummary}
                className={classNames(
              'w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none',
              summaryExceeded && 'border-[var(--color-error, #b91c1c)]',
            )}
              />
          <div className="flex justify-between text-xs">
            <span className={classNames(summaryExceeded ? 'text-[var(--color-error, #b91c1c)]' : 'text-subtle')}>
              {summaryLabel}
            </span>
            <span className={classNames(summaryExceeded ? 'text-[var(--color-error, #b91c1c)]' : 'text-subtle')}>
              {summaryLength}/{SUMMARY_MAX}
            </span>
          </div>
          {summaryEmpty && (
            <p className="text-xs text-[var(--color-error, #b91c1c)]">{t.newTechnique.warnings.summaryMissingSingle}</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.steps}</h2>
          <StepBuilder
            steps={form.steps}
            onChange={(nextSteps) => updateNewTechnique('steps', nextSteps)}
            placeholderForIndex={stepPlaceholder}
            helperText={t.hints.stepHelper}
            addButtonLabel={t.buttons.addStep}
            removeButtonAria={removeStepAria}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.uke}</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text)]">{t.newTechnique.fields.ukeRoleSingle}</label>
            <input
              value={form.ukeRole}
              onChange={(event) => updateNewTechnique('ukeRole', event.target.value)}
              placeholder={t.placeholders.newTechniqueUkeRole}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
            />
          </div>
          {renderList('ukeNotes', t.newTechnique.fields.ukeNotesSingle, t.placeholders.newTechniqueUkeNote)}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.insights}</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {renderList('keyPoints', t.newTechnique.fields.keyPointsSingle, t.placeholders.newTechniqueKeyPoint)}
            {renderList('commonMistakes', t.newTechnique.fields.commonMistakesSingle, t.placeholders.newTechniqueMistake)}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.media}</h2>
          <MediaManager
            media={form.media}
            onChange={(items) => updateNewTechnique('media', items)}
            placeholder={t.placeholders.mediaUrl}
            triggerLabel={t.buttons.addMediaTrigger}
            addLabel={t.buttons.addAction}
            cancelLabel={t.buttons.cancel}
            removeLabel={t.buttons.remove}
          />
        </section>

        <section className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.summary.labels.source}</label>
          <input
            value={form.sources}
            onChange={(event) => updateNewTechnique('sources', event.target.value)}
            placeholder={t.placeholders.newTechniqueSources}
            className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.contributor}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.shared.labels.contributorName}</label>
              <input
                value={form.creditName}
                onChange={(event) => updateNewTechnique('creditName', event.target.value)}
                placeholder={t.placeholders.contributorName}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text)]">{t.shared.labels.trainerCredit}</label>
              <input
                value={form.trainerCredit}
                onChange={(event) => updateNewTechnique('trainerCredit', event.target.value)}
                placeholder={t.placeholders.newTechniqueLineage}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={form.markAsBase}
              onChange={(event) => updateNewTechnique('markAsBase', event.target.checked)}
              className="h-4 w-4 rounded border surface-border"
            />
            {t.shared.labels.markAsBase}
          </label>
          {t.shared.help?.markAsBase && <p className="text-xs text-subtle">{t.shared.help.markAsBase}</p>}
        </section>

        {/* Removed bottom duplicates block; now shown inline under name and in Summary */}
      </motion.div>
    );
  };

  const renderAppFeedbackForm = (): ReactElement => {
    const { area, title, feedback } = draft.appFeedback;
    const areaOptions = (Object.keys(areaLabels) as AppArea[]).map((value) => ({
      value,
      label: areaLabels[value],
    }));

    return (
      <motion.div
        key="app"
        layout="position"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
        transition={formTransition}
        className="space-y-6"
      >
        <section className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.app.titleLabel}</label>
          <input
            type="text"
            value={title ?? ''}
            onChange={(event) => updateAppFeedback('title', event.target.value)}
            placeholder={t.placeholders.appTitle}
            className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
          />
        </section>
        <section className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.app.areaLabel}</label>
          <Select
            options={areaOptions}
            value={area ?? ''}
            onChange={(value) => updateAppFeedback('area', value as AppArea)}
            placeholder={t.options.selectArea}
          />
        </section>

        <section className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.app.feedbackLabel}</label>
          <textarea
            rows={5}
            value={feedback}
            onChange={(event) => updateAppFeedback('feedback', event.target.value)}
            placeholder={t.placeholders.appFeedback}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none"
          />
        </section>

        {/* Screenshot/link input removed as requested */}
      </motion.div>
    );
  };

  const renderBugReportForm = (): ReactElement => {
    const { title, location, details, reproduction } = draft.bugReport;
    return (
      <motion.div
        key="bug"
        layout="position"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -16 }}
        transition={formTransition}
        className="space-y-6"
      >
        <section className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.bug.titleLabel}</label>
          <input
            type="text"
            value={title ?? ''}
            onChange={(event) => updateBugReport('title', event.target.value)}
            placeholder={t.placeholders.bugTitle}
            className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
          />
        </section>
        <section className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.bug.locationLabel}</label>
          <input
            type="text"
            value={location}
            onChange={(event) => updateBugReport('location', event.target.value)}
            placeholder={t.placeholders.bugLocation}
            className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus-halo focus:outline-none"
          />
        </section>

        <section className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.bug.detailsLabel}</label>
          <textarea
            rows={4}
            value={details}
            onChange={(event) => updateBugReport('details', event.target.value)}
            placeholder={t.placeholders.bugDetails}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none"
          />
        </section>

        <section className="space-y-3">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.forms.bug.reproductionLabel}</label>
          <textarea
            rows={4}
            value={reproduction}
            onChange={(event) => updateBugReport('reproduction', event.target.value)}
            placeholder={t.placeholders.bugReproduction}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none"
          />
        </section>

        {/* includeSystemInfo toggle removed per privacy change */}
      </motion.div>
    );
  };





  const renderForm = () => {
    if (!selectedCard) return null;
    switch (selectedCard) {
      case 'improveTechnique':
        return renderImproveForm();
      case 'addVariation':
        return renderVariationForm();
      case 'newTechnique':
        return renderNewTechniqueForm();
      case 'appFeedback':
        return renderAppFeedbackForm();
      case 'bugReport':
        return renderBugReportForm();
      default:
        return null;
    }
  };

  return (
    <>
      <main className="py-12 px-5 md:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-muted hover:text-current transition-soft"
            >
              <span aria-hidden>‹</span>
              {copy.backToLibrary}
            </button>
          )}

          <header className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold flex items-center gap-3">
                <HeartPulseIcon className="w-7 h-7 text-[var(--color-text)]" aria-hidden />
                <span>{copy.feedbackTitle}</span>
              </h1>
              <p className="max-w-2xl text-sm text-muted">{t.heroSubtitle}</p>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-surface-border to-transparent" />
          </header>

          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{t.headings.type}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {feedbackTypeOrder.map((value) => {
                const content = cardContent[value];
                const isActive = value === selectedCard;
                return (
                  <motion.button
                    key={value}
                    type="button"
                    layout="position"
                    initial={false}
                    animate={{
                      backgroundColor: isActive ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                      borderColor: isActive ? 'var(--color-text)' : 'var(--color-border)',
                    }}
                    whileHover={prefersReducedMotion ? undefined : { backgroundColor: 'var(--color-surface-hover)' }}
                    transition={itemTransition}
                    onClick={() => handleTypeChange(value)}
                    aria-pressed={isActive}
                    className={classNames(
                      // Make bug report card visually centered and wider on md screens
                      value === 'bugReport' ? 'md:col-span-2' : '',
                      'rounded-2xl border surface surface-border px-4 py-4 transition-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                      isActive ? 'shadow-md' : 'shadow-sm surface-hover',
                    )}
                  >
                    <div className={classNames(
                      // Center the overall block for the bug card, but keep text left-aligned
                      value === 'bugReport' ? 'flex items-center justify-center gap-3' : 'flex items-center gap-3',
                    )}>
                      <span className="text-subtle" aria-hidden>
                        {content.icon}
                      </span>
                      <div className="space-y-1 text-left">
                        <p className="font-medium text-[var(--color-text)]">{content.title}</p>
                        <p className="text-sm text-subtle">{content.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence initial={false} mode="popLayout">
              {selectedCard && (
                <motion.div
                  key="selector-divider"
                  layout="position"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={itemTransition}
                  className="h-px w-full bg-gradient-to-r from-transparent via-surface-border to-transparent"
                />
              )}
            </AnimatePresence>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{t.headings.dynamic}</h2>
            <AnimatePresence initial={false} mode="wait">
              {selectedCard ? (
                renderForm()
              ) : (
                <motion.div
                  key="placeholder"
                  layout="position"
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={itemTransition}
                  className="rounded-2xl border border-dashed surface-border bg-[var(--color-surface)] px-4 py-6 text-sm text-subtle"
                >
                  {t.prompts.chooseType}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{t.headings.summary}</h2>
            <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">{t.summary.title}</h3>
                <p className="text-xs text-subtle">{t.summary.subtitle}</p>
              </div>
              {/* Duplicates banner at top of summary */}
              {selectedCard === 'newTechnique' && (
                <div className={classNames('rounded-xl border px-4 py-3 text-sm', 'surface-border bg-[var(--color-surface)]')}>
                  {duplicateMatches.length === 0 ? (
                    <span className="text-subtle">{t.newTechnique.duplicates.noneHint}</span>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-medium text-[var(--color-text)]">{t.newTechnique.duplicates.possibleMatches}</p>
                      <ul className="space-y-1">
                        {duplicateMatches.map((tech) => (
                          <li key={`dup-summary-${tech.id}`} className="flex items-center justify-between gap-2">
                            <span className="text-[var(--color-text)]">{tech.name[locale] || tech.name.en}</span>
                            <span className="text-xs text-subtle">{tech.slug}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => handleTypeChange('addVariation')}
                        className="text-xs text-[var(--color-accent, var(--color-text))] hover:underline"
                      >
                        {t.newTechnique.duplicates.switch}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <dl className="grid gap-3 sm:grid-cols-2">
                {summaryEntries.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <dt className="text-xs font-medium text-subtle">{item.label}</dt>
                    <dd className="text-sm text-[var(--color-text)]">{item.value}</dd>
                  </div>
                ))}
              </dl>
              {submissionState === 'success' && submitResult?.ok ? (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={itemTransition}
                  className="rounded-xl border border-transparent bg-[var(--color-surface)] px-4 py-3 text-sm shadow-sm space-y-1"
                >
                  <p className="font-medium">{t.hints.successTitle}</p>
                  {submitResult?.requestId && (
                    <p className="text-xs text-subtle">{t.newTechnique.requestIdLabel} {submitResult.requestId}</p>
                  )}
                </motion.div>
              ) : submissionState === 'error' ? (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={itemTransition}
                  className="rounded-xl border border-[var(--color-error, #b91c1c)] bg-[var(--color-surface)] px-4 py-3 text-xs text-[var(--color-error, #b91c1c)]"
                >
                  {submitError || t.newTechnique.errors.generic}
                  {submitResult?.requestId && ` · ${t.newTechnique.requestIdLabel} ${submitResult.requestId}`}
                </motion.div>
              ) : submissionState === 'submitting' ? (
                <p className="text-xs text-subtle">{t.newTechnique.sending}</p>
              ) : (
                <p className="text-xs text-subtle">{t.hints.summaryHint}</p>
              )}

              {consentChecked !== null && (
                <div className="space-y-1">
                  <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(event) => handleConsentChange(event.target.checked)}
                      className="h-4 w-4 rounded border surface-border"
                    />
                    {t.globalConsent}
                  </label>
                  <p
                    className={classNames(
                      'text-xs transition-soft',
                      consentChecked ? 'text-subtle' : 'text-[var(--color-error, #b91c1c)]',
                    )}
                  >
                    {consentWarningText}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={classNames(
                    'rounded-xl px-4 py-2.5 text-sm font-medium transition-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                    canSubmit
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                      : 'border surface-border bg-[var(--color-surface)] text-subtle cursor-not-allowed',
                  )}
                >
                  {submissionState === 'submitting' ? t.newTechnique.sendingButton : t.buttons.submit}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm"
                >
                  {t.buttons.downloadJson}
                </button>
                <button
                  type="button"
                  onClick={() => clearCurrentForm(selectedCard ?? undefined)}
                  disabled={!selectedCard}
                  className="rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t.buttons.clearForm}
                </button>
                {/* Edit again button removed per request */}
                {submissionState === 'success' && (
                  <button
                    type="button"
                    onClick={resetDraft}
                    className="rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm"
                  >
                    {t.buttons.restart}
                  </button>
                )}
              </div>
            </div>
          </section>

          {showJsonPreview && (
            <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.headings.jsonPreview}</h2>
              <pre className="max-h-64 overflow-auto rounded-2xl border surface-border bg-[var(--color-surface)] p-4 text-xs">
                {JSON.stringify(draft, null, 2)}
              </pre>
            </section>
          )}
        </div>
      </main>
    </>
  );
};
