import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Select, type SelectOption } from '@shared/components/ui/Select';
import { Chip } from '@shared/components/ui/Chip';
import { Segmented } from '@shared/components/ui/Segmented';
import { useMotionPreferences } from '@shared/components/ui/motion';
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
  SproutIcon,
} from '@shared/components/ui/icons';
import type { Copy, FeedbackPageCopy } from '@shared/constants/i18n';
import type { Grade, Hanmi, Locale, Technique, Localized } from '@shared/types';

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
};

type VariationForm = {
  relatedTechniqueId: string | null;
  variationName: string;
  categoryTags: CategoryTag[];
  level: Grade | null;
  description: string;
  steps: StepItem[];
  ukeInstructions: string;
  media: MediaEntry[];
  context: string;
  credit: string;
};

type AppFeedbackForm = {
  area: AppArea | null;
  feedback: string;
  screenshotUrl: string;
};

type BugReportForm = {
  location: string;
  details: string;
  reproduction: string;
  includeSystemInfo: boolean;
};

type NewTechniqueForm = {
  precheckConfirmed: boolean;
  name: Localized<string>;
  jp: {
    kanji: string;
    romaji: string;
  };
  attack: string | null;
  category: string | null;
  weapon: string | null;
  entries: Array<'irimi' | 'tenkan'>;
  hanmi: Hanmi | null;
  levelHint: string;
  summary: Localized<string>;
  steps: Localized<StepItem[]>;
  ukeRole: Localized<string>;
  ukeNotes: Localized<string[]>;
  keyPoints: Localized<string[]>;
  commonMistakes: Localized<string[]>;
  media: MediaEntry[];
  sources: string;
  contributor: {
    name: string;
    contact: string;
  };
  lineage: {
    dojoOrTrainer: string;
    markAsBase: boolean;
  };
  consent: boolean;
  precheckSearch: string;
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

const defaultLocalizedSteps = (): Localized<StepItem[]> => ({
  en: createStepList(),
  de: createStepList(),
});

const SUMMARY_MAX = 230;

const defaultLocalizedString = (): Localized<string> => ({ en: '', de: '' });

const defaultLocalizedList = (): Localized<string[]> => ({ en: [''], de: [''] });

const sanitizeLocalizedString = (value?: Localized<string>): Localized<string> => ({
  en: value?.en ?? '',
  de: value?.de ?? '',
});

const sanitizeLocalizedList = (value?: Localized<string[]>): Localized<string[]> => {
  const sanitize = (list?: string[]): string[] => {
    if (!Array.isArray(list)) return [''];
    const cleaned = list.map((item) => item ?? '');
    return cleaned.length > 0 ? cleaned : [''];
  };
  return {
    en: sanitize(value?.en),
    de: sanitize(value?.de),
  };
};

const sanitizeLocalizedSteps = (value?: Localized<StepItem[]>): Localized<StepItem[]> => ({
  en: (value?.en && value.en.length > 0 ? value.en : createStepList()).map((step) => ({
    id: step?.id || createId(),
    text: step?.text || '',
  })),
  de: (value?.de && value.de.length > 0 ? value.de : createStepList()).map((step) => ({
    id: step?.id || createId(),
    text: step?.text || '',
  })),
});

const sanitizeEntries = (entries?: string[]): Array<'irimi' | 'tenkan'> => {
  if (!Array.isArray(entries)) return [];
  const allowed: Array<'irimi' | 'tenkan'> = [];
  for (const entry of entries) {
    if (entry === 'irimi' || entry === 'tenkan') {
      if (!allowed.includes(entry)) allowed.push(entry);
    }
  }
  return allowed;
};

const slugify = (value: string): string =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const buildNewTechniqueSlug = (
  attack: string | null,
  name: Localized<string>,
  entries: Array<'irimi' | 'tenkan'>,
): string => {
  const attackSegment = attack ? slugify(attack) : '';
  const baseName = name.en.trim() || name.de.trim();
  const nameSegment = baseName ? slugify(baseName) : '';
  const entriesSegment = entries.length > 0 ? entries.join('-') : '';
  return [attackSegment, nameSegment, entriesSegment].filter(Boolean).join('-');
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
  const slugPreview = buildNewTechniqueSlug(form.attack, form.name, form.entries);
  const normalizedSlug = slugPreview ? toSearchable(slugPreview) : '';
  const nameEn = toSearchable(form.name.en);
  const nameDe = toSearchable(form.name.de);
  const attack = form.attack;
  const weapon = form.weapon ?? 'empty-hand';

  if (!nameEn && !nameDe && !normalizedSlug) return [];

  return techniques.filter((tech) => {
    const techNameEn = toSearchable(tech.name.en || '');
    const techNameDe = toSearchable(tech.name.de || '');
    const techSlug = toSearchable(tech.slug || '');
    const techAttack = tech.attack;
    const techWeapon = tech.weapon ?? 'empty-hand';

    const slugMatch = normalizedSlug && techSlug === normalizedSlug;
    const nameMatch =
      (nameEn && techNameEn === nameEn) ||
      (nameDe && techNameDe === nameDe);
    const taxonomyMatch = (!attack || techAttack === attack) && techWeapon === weapon;

    return slugMatch || (nameMatch && taxonomyMatch);
  }).slice(0, 5);
};

const computePrecheckMatches = (query: string, techniques: Technique[]): Technique[] => {
  const normalized = toSearchable(query.trim());
  if (normalized.length < 2) return [];
  return techniques
    .filter((tech) => {
      const nameEn = toSearchable(tech.name.en || '');
      const nameDe = toSearchable(tech.name.de || '');
      const slug = toSearchable(tech.slug || '');
      return nameEn.includes(normalized) || nameDe.includes(normalized) || slug.includes(normalized);
    })
    .slice(0, 6);
};

const defaultNewTechniqueForm = (): NewTechniqueForm => ({
  precheckConfirmed: false,
  name: defaultLocalizedString(),
  jp: {
    kanji: '',
    romaji: '',
  },
  attack: null,
  category: null,
  weapon: null,
  entries: [],
  hanmi: null,
  levelHint: '',
  summary: defaultLocalizedString(),
  steps: defaultLocalizedSteps(),
  ukeRole: defaultLocalizedString(),
  ukeNotes: defaultLocalizedList(),
  keyPoints: defaultLocalizedList(),
  commonMistakes: defaultLocalizedList(),
  media: [],
  sources: '',
  contributor: {
    name: '',
    contact: '',
  },
  lineage: {
    dojoOrTrainer: '',
    markAsBase: true,
  },
  consent: false,
  precheckSearch: '',
});

const defaultImproveTechniqueForm = (): ImproveTechniqueForm => ({
  techniqueId: null,
  sections: [],
  steps: [{ id: createId(), text: '' }],
  textBySection: {},
  media: [],
  source: '',
  credit: '',
});

const defaultVariationForm = (): VariationForm => ({
  relatedTechniqueId: null,
  variationName: '',
  categoryTags: [],
  level: null,
  description: '',
  steps: [{ id: createId(), text: '' }],
  ukeInstructions: '',
  media: [],
  context: '',
  credit: '',
});

const defaultAppFeedbackForm = (): AppFeedbackForm => ({
  area: null,
  feedback: '',
  screenshotUrl: '',
});

const defaultBugReportForm = (): BugReportForm => ({
  location: '',
  details: '',
  reproduction: '',
  includeSystemInfo: true,
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

    const parsed = JSON.parse(stored) as Partial<FeedbackDraft>;

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
        steps: (improveTechnique.steps ?? defaultImproveTechniqueForm().steps).map((step) => ({
          id: step.id || createId(),
          text: step.text || '',
        })),
        media: (improveTechnique.media ?? []).map((item) => ({
          id: item.id || createId(),
          url: item.url,
          type: item.type,
          embedUrl: item.embedUrl,
        })),
      },
      addVariation: {
        ...defaultVariationForm(),
        ...addVariation,
        level: addVariation.level && gradeOrder.includes(addVariation.level) ? addVariation.level : null,
        categoryTags: Array.isArray(addVariation.categoryTags)
          ? addVariation.categoryTags.filter(isCategoryTag)
          : [],
        steps: (addVariation.steps ?? defaultVariationForm().steps).map((step) => ({
          id: step.id || createId(),
          text: step.text || '',
        })),
        media: (addVariation.media ?? []).map((item) => ({
          id: item.id || createId(),
          url: item.url,
          type: item.type,
          embedUrl: item.embedUrl,
        })),
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
        ...newTechnique,
        precheckConfirmed: Boolean(newTechnique.precheckConfirmed),
        name: sanitizeLocalizedString(newTechnique.name),
        jp: {
          kanji: newTechnique.jp?.kanji ?? '',
          romaji: newTechnique.jp?.romaji ?? '',
        },
        attack: newTechnique.attack ?? null,
        category: newTechnique.category ?? null,
        weapon: newTechnique.weapon ?? null,
        entries: sanitizeEntries(newTechnique.entries),
        hanmi: newTechnique.hanmi === 'ai-hanmi' || newTechnique.hanmi === 'gyaku-hanmi' ? newTechnique.hanmi : null,
        levelHint: newTechnique.levelHint ?? '',
        summary: sanitizeLocalizedString(newTechnique.summary),
        steps: sanitizeLocalizedSteps(newTechnique.steps),
        ukeRole: sanitizeLocalizedString(newTechnique.ukeRole),
        ukeNotes: sanitizeLocalizedList(newTechnique.ukeNotes),
        keyPoints: sanitizeLocalizedList(newTechnique.keyPoints),
        commonMistakes: sanitizeLocalizedList(newTechnique.commonMistakes),
        media: (newTechnique.media ?? []).map((item) => ({
          id: item?.id || createId(),
          url: item?.url || '',
          type: item?.type || 'link',
          embedUrl: item?.embedUrl,
          title: item?.title ?? '',
        })).filter((item) => item.url),
        sources: newTechnique.sources ?? '',
        contributor: {
          name: newTechnique.contributor?.name ?? '',
          contact: newTechnique.contributor?.contact ?? '',
        },
        lineage: {
          dojoOrTrainer: newTechnique.lineage?.dojoOrTrainer ?? '',
          markAsBase: newTechnique.lineage?.markAsBase ?? true,
        },
        consent: Boolean(newTechnique.consent),
        precheckSearch: newTechnique.precheckSearch ?? '',
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
      {label && <h3 className="text-xs uppercase tracking-[0.3em] text-subtle">{label}</h3>}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            layout
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-3 py-2"
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
  allowTitle?: boolean;
  titleLabel?: string;
  titlePlaceholder?: string;
  disallowMessage?: string;
};

const getMediaIcon = (type: MediaKind): string => {
  switch (type) {
    case 'youtube':
    case 'vimeo':
      return '▶';
    case 'image':
      return '🖼️';
    default:
      return '🔗';
  }
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
  allowTitle = false,
  titleLabel,
  titlePlaceholder,
  disallowMessage,
}: MediaManagerProps): ReactElement => {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const entry = detectMedia(inputValue);
    if (!entry) return;
    if (allowedKinds && !allowedKinds.includes(entry.type)) {
      setError(disallowMessage ?? 'Unsupported media type.');
      return;
    }
    onChange([...media, { ...entry, title: allowTitle ? '' : entry.title }]);
    setInputValue('');
    setError(null);
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(media.filter((item) => item.id !== id));
  };

  const updateTitle = (id: string, title: string) => {
    onChange(
      media.map((item) =>
        item.id === id
          ? {
              ...item,
              title,
            }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3">
        {media.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-3 py-2 text-sm"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-lg">
                {getMediaIcon(item.type)}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  className="block truncate underline-offset-4 hover:underline"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.url}
                </a>
                {allowTitle && (
                  <input
                    value={item.title ?? ''}
                    onChange={(event) => updateTitle(item.id, event.target.value)}
                    placeholder={titlePlaceholder}
                    aria-label={titleLabel}
                    className="mt-2 w-full rounded-lg border surface-border bg-[var(--color-surface)] px-3 py-1.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-auto text-xs text-subtle hover:text-[var(--color-text)]"
              >
                {removeLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
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
              className="w-full sm:w-96 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
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
  const [draft, setDraft] = useState<FeedbackDraft>(() => loadDraft());
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [submissionState, setSubmissionState] = useState<'idle' | 'success'>('idle');
  const [activeLocaleTab, setActiveLocaleTab] = useState<Locale>('en');
  const [isPrecheckOpen, setIsPrecheckOpen] = useState(false);
  const [precheckAcknowledged, setPrecheckAcknowledged] = useState(false);

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
        icon: <SproutIcon className="w-5 h-5" aria-hidden />,
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
      if (initialType === 'newTechnique' && !current.newTechnique.precheckConfirmed) {
        setIsPrecheckOpen(true);
        setPrecheckAcknowledged(false);
        return current;
      }
      if (current.selectedType === initialType) return current;
      return {
        ...current,
        selectedType: initialType,
      };
    });
    onConsumeInitialType?.();
  }, [initialType, onConsumeInitialType]);

  const categoryTagLabels = t.categoryTags as Record<CategoryTag, string>;
  const areaLabels = t.appAreas as Record<AppArea, string>;
  const improveSectionLabels = t.improve.sections as Record<ImproveSection, string>;

  useAutosave(draft);

  const slugPreview = useMemo(
    () => buildNewTechniqueSlug(draft.newTechnique.attack, draft.newTechnique.name, draft.newTechnique.entries),
    [draft.newTechnique.attack, draft.newTechnique.name, draft.newTechnique.entries],
  );

  const duplicateMatches = useMemo(
    () => computeDuplicateMatches(draft.newTechnique, techniques),
    [draft.newTechnique, techniques],
  );

  const unusualCombo = useMemo(
    () => isUnusualAttackWeapon(draft.newTechnique.attack, draft.newTechnique.weapon),
    [draft.newTechnique.attack, draft.newTechnique.weapon],
  );

  const summaryLengths = useMemo(() => ({
    en: draft.newTechnique.summary.en.trim().length,
    de: draft.newTechnique.summary.de.trim().length,
  }), [draft.newTechnique.summary]);

  const summariesEmpty = useMemo(
    () => !draft.newTechnique.summary.en.trim() && !draft.newTechnique.summary.de.trim(),
    [draft.newTechnique.summary],
  );

  const { en: summaryLengthEn, de: summaryLengthDe } = summaryLengths;

  const summaryExceeded = useMemo(
    () => ({
      en: summaryLengthEn > SUMMARY_MAX,
      de: summaryLengthDe > SUMMARY_MAX,
    }),
    [summaryLengthEn, summaryLengthDe],
  );

  const precheckMatches = useMemo(
    () => computePrecheckMatches(draft.newTechnique.precheckSearch, techniques),
    [draft.newTechnique.precheckSearch, techniques],
  );

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
  }, []);

  const handleTypeChange = (feedbackType: FeedbackType) => {
    setSubmissionState('idle');
    setDraft((current) => {
      if (feedbackType === 'newTechnique' && !current.newTechnique.precheckConfirmed) {
        setIsPrecheckOpen(true);
        setPrecheckAcknowledged(false);
        return current;
      }
      if (current.selectedType === feedbackType) return current;
      return {
        ...current,
        selectedType: feedbackType,
      };
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

  const updateTechniqueName = (localeKey: Locale, value: string) => {
    setNewTechnique((form) => ({
      ...form,
      name: {
        ...form.name,
        [localeKey]: value,
      },
    }));
  };

  const updateTechniqueSummary = (localeKey: Locale, value: string) => {
    setNewTechnique((form) => ({
      ...form,
      summary: {
        ...form.summary,
        [localeKey]: value,
      },
    }));
  };

  const updateUkeRole = (localeKey: Locale, value: string) => {
    setNewTechnique((form) => ({
      ...form,
      ukeRole: {
        ...form.ukeRole,
        [localeKey]: value,
      },
    }));
  };

  const updateLocalizedListField = (
    field: 'ukeNotes' | 'keyPoints' | 'commonMistakes',
    localeKey: Locale,
    index: number,
    value: string,
  ) => {
    setNewTechnique((form) => {
      const currentList = [...(form[field][localeKey] ?? [])];
      if (index >= 0 && index < currentList.length) {
        currentList[index] = value;
      }
      return {
        ...form,
        [field]: {
          ...form[field],
          [localeKey]: currentList,
        },
      };
    });
  };

  const addLocalizedListItem = (field: 'ukeNotes' | 'keyPoints' | 'commonMistakes', localeKey: Locale) => {
    setNewTechnique((form) => {
      const currentList = [...(form[field][localeKey] ?? [])];
      currentList.push('');
      return {
        ...form,
        [field]: {
          ...form[field],
          [localeKey]: currentList,
        },
      };
    });
  };

  const removeLocalizedListItem = (field: 'ukeNotes' | 'keyPoints' | 'commonMistakes', localeKey: Locale, index: number) => {
    setNewTechnique((form) => {
      const currentList = [...(form[field][localeKey] ?? [])];
      if (index >= 0 && index < currentList.length) {
        currentList.splice(index, 1);
      }
      if (currentList.length === 0) {
        currentList.push('');
      }
      return {
        ...form,
        [field]: {
          ...form[field],
          [localeKey]: currentList,
        },
      };
    });
  };

  const updateLocalizedSteps = (localeKey: Locale, steps: StepItem[]) => {
    setNewTechnique((form) => ({
      ...form,
      steps: {
        ...form.steps,
        [localeKey]: steps,
      },
    }));
  };

  const selectedCard = draft.selectedType;

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

    return true;
  }, [draft.improveTechnique]);

  const isVariationReady = useMemo(() => {
    const { relatedTechniqueId, variationName, description, steps } = draft.addVariation;
    const hasSteps = steps.some((step) => hasContent(step.text));
    return hasContent(relatedTechniqueId) && hasContent(variationName) && hasContent(description) && hasSteps;
  }, [draft.addVariation]);

  const isAppFeedbackReady = useMemo(() => {
    return Boolean(draft.appFeedback.area) && hasContent(draft.appFeedback.feedback);
  }, [draft.appFeedback]);

  const isBugReportReady = useMemo(() => {
    return hasContent(draft.bugReport.location) && hasContent(draft.bugReport.details);
  }, [draft.bugReport]);

  const isNewTechniqueReady = (() => {
    const form = draft.newTechnique;
    const nameComplete = hasContent(form.name.en) && hasContent(form.name.de);
    const summaryComplete =
      hasContent(form.summary.en) &&
      hasContent(form.summary.de) &&
      !summaryExceeded.en &&
      !summaryExceeded.de;
    const taxonomyComplete = hasContent(form.attack) && hasContent(form.category) && hasContent(form.weapon);
    const entriesComplete = form.entries.length >= 1;
    const hanmiComplete = Boolean(form.hanmi);
    const contributorComplete = hasContent(form.contributor.name) && hasContent(form.contributor.contact);
    return (
      form.precheckConfirmed &&
      nameComplete &&
      summaryComplete &&
      taxonomyComplete &&
      entriesComplete &&
      hanmiComplete &&
      hasContent(form.levelHint) &&
      contributorComplete &&
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
      ];
    }

    if (selectedCard === 'addVariation') {
      const { relatedTechniqueId, variationName, steps, media, categoryTags, level, credit } = draft.addVariation;
      const stepCount = steps.filter((step) => hasContent(step.text)).length;
      const tagLabels = categoryTags.map((tag) => categoryTagLabels[tag]);
      return [
        { label: t.summary.labels.type, value: cardContent[selectedCard].title },
        { label: t.summary.labels.technique, value: findTechniqueName(relatedTechniqueId) },
        { label: t.summary.labels.variation, value: hasContent(variationName) ? variationName : '—' },
        { label: t.summary.labels.tags, value: tagLabels.length > 0 ? tagLabels.join(', ') : '—' },
        { label: t.summary.labels.level, value: level ? getLevelLabel(locale, level) : t.summary.notSpecified },
        {
          label: t.summary.labels.steps,
          value: stepCount > 0 ? formatCount(stepCount, t.summary.counts.documentedSteps) : '—',
        },
        {
          label: t.summary.labels.media,
          value: media.length > 0 ? formatCount(media.length, t.summary.counts.media) : '—',
        },
        { label: t.summary.labels.credit, value: hasContent(credit) ? credit : '—' },
      ];
    }

    if (selectedCard === 'newTechnique') {
      const form = draft.newTechnique;
      const entriesLabel = form.entries.length
        ? form.entries.map((entry) => t.newTechnique.entryLabels[entry]).join(', ')
        : '—';
      const hanmiLabel = form.hanmi ? t.newTechnique.hanmiOptions[form.hanmi] : t.summary.notSpecified;
      const attackLabel = form.attack ? getTaxonomyLabel(locale, 'attack', form.attack) : t.summary.notSpecified;
      const categoryLabel = form.category ? getTaxonomyLabel(locale, 'category', form.category) : t.summary.notSpecified;
      const weaponLabel = form.weapon ? getTaxonomyLabel(locale, 'weapon', form.weapon) : t.summary.notSpecified;
      const duplicateLabel = duplicateMatches.length
        ? formatCount(duplicateMatches.length, t.summary.counts.duplicates)
        : t.newTechnique.duplicates.none;

      return [
        { label: t.summary.labels.type, value: cardContent[selectedCard].title },
        { label: t.summary.labels.name, value: form.name.en || form.name.de || '—' },
        { label: t.summary.labels.attack, value: attackLabel },
        { label: t.summary.labels.category, value: categoryLabel },
        { label: t.summary.labels.weapon, value: weaponLabel },
        { label: t.summary.labels.entries, value: entriesLabel },
        { label: t.summary.labels.hanmi, value: hanmiLabel },
        { label: t.summary.labels.slug, value: slugPreview || '—' },
        {
          label: t.summary.labels.summary,
          value: `${summaryLengths.en}/${SUMMARY_MAX} · ${summaryLengths.de}/${SUMMARY_MAX}`,
        },
        {
          label: t.summary.labels.contributor,
          value: form.contributor.name || '—',
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

    const { location, details, reproduction, includeSystemInfo } = draft.bugReport;
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
      {
        label: t.summary.labels.includeSystemInfo,
        value: includeSystemInfo ? t.summary.boolean.yes : t.summary.boolean.no,
      },
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
    summaryLengths,
    t.newTechnique,
    t.summary,
  ]);

  const handleSubmit = () => {
    if (!isSubmitEnabled) return;
    setSubmissionState('success');
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
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="space-y-6"
      >
        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">
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
          <span className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.improve.sectionsLabel}</span>
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
                  <Chip label={improveSectionLabels[typedSection]} active={isActive} />
                </label>
              );
            })}
          </div>
        </section>

        <AnimatePresence initial={false}>
          {sections.includes('steps') && (
            <motion.section
              key="steps"
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
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

        {sections
          .filter((section): section is ImproveTextSection => section !== 'steps')
          .map((section) => (
            <section key={section} className="space-y-3">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {improveSectionLabels[section]}
              </label>
              <textarea
                rows={4}
                value={textBySection[section] ?? ''}
                onChange={(event) => handleTextChange(section, event.target.value)}
                placeholder={t.forms.improve.textPlaceholder}
                className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </section>
          ))}

        <section className="space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.improve.mediaLabel}</span>
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
            <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.improve.sourceLabel}</label>
            <input
              type="text"
              value={source}
              onChange={(event) => updateImprove('source', event.target.value)}
              placeholder={t.placeholders.source}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.improve.creditLabel}</label>
            <input
              type="text"
              value={credit}
              onChange={(event) => updateImprove('credit', event.target.value)}
              placeholder={t.placeholders.credit}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            />
          </div>
        </section>
      </motion.div>
    );
  };

  const renderVariationForm = (): ReactElement => {
    const {
      relatedTechniqueId,
      variationName,
      categoryTags,
      level,
      description,
      steps,
      ukeInstructions,
      media,
      context,
      credit,
    } = draft.addVariation;

    const toggleTag = (tag: CategoryTag) => {
      const isActive = categoryTags.includes(tag);
      const nextTags = isActive ? categoryTags.filter((item) => item !== tag) : [...categoryTags, tag];
      updateVariation('categoryTags', nextTags);
    };

    return (
      <motion.div
        key="variation"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="space-y-6"
      >
        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">
            {t.forms.variation.relatedTechniqueLabel}
          </label>
          <Select
            options={techniqueOptions}
            value={relatedTechniqueId ?? ''}
            onChange={(value) => updateVariation('relatedTechniqueId', value)}
            searchable
            placeholder={techniquePlaceholder}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.variationNameLabel}</label>
            <input
              type="text"
              value={variationName}
              onChange={(event) => updateVariation('variationName', event.target.value)}
              placeholder={t.placeholders.variationName}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.levelLabel}</label>
            <Select
              options={levelOptions}
              value={level ?? 'none'}
              onChange={(value) => updateVariation('level', value === 'none' ? null : (value as Grade))}
              placeholder={t.options.selectLevel}
            />
          </div>
        </section>

        <section className="space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.categoryTagsLabel}</span>
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
                  <Chip label={categoryTagLabels[tag]} active={isActive} />
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.descriptionLabel}</label>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => updateVariation('description', event.target.value)}
            placeholder={t.placeholders.variationDescription}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>

        <section className="rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-4">
          <StepBuilder
            label={t.forms.variation.stepsLabel}
            steps={steps}
            onChange={(nextSteps) => updateVariation('steps', nextSteps)}
            placeholderForIndex={stepPlaceholder}
            helperText={t.hints.stepHelper}
            addButtonLabel={t.buttons.addStep}
            removeButtonAria={removeStepAria}
          />
        </section>

        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.ukeLabel}</label>
          <textarea
            rows={3}
            value={ukeInstructions}
            onChange={(event) => updateVariation('ukeInstructions', event.target.value)}
            placeholder={t.placeholders.variationUke}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>

        <section className="space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.mediaLabel}</span>
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

        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.contextLabel}</label>
          <textarea
            rows={3}
            value={context}
            onChange={(event) => updateVariation('context', event.target.value)}
            placeholder={t.placeholders.variationContext}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>

        <section className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.variation.creditLabel}</label>
          <input
            type="text"
            value={credit}
            onChange={(event) => updateVariation('credit', event.target.value)}
            placeholder={t.placeholders.variationCredit}
            className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>
      </motion.div>
    );
  };

  const renderAppFeedbackForm = (): ReactElement => {
    const { area, feedback, screenshotUrl } = draft.appFeedback;
    const areaOptions = (Object.keys(areaLabels) as AppArea[]).map((value) => ({
      value,
      label: areaLabels[value],
    }));

    return (
      <motion.div
        key="app"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="space-y-6"
      >
        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.app.areaLabel}</label>
          <Select
            options={areaOptions}
            value={area ?? ''}
            onChange={(value) => updateAppFeedback('area', value as AppArea)}
            placeholder={t.options.selectArea}
          />
        </section>

        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.app.feedbackLabel}</label>
          <textarea
            rows={5}
            value={feedback}
            onChange={(event) => updateAppFeedback('feedback', event.target.value)}
            placeholder={t.placeholders.appFeedback}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>

        <section className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.app.screenshotLabel}</label>
          <input
            type="url"
            value={screenshotUrl}
            onChange={(event) => updateAppFeedback('screenshotUrl', event.target.value)}
            placeholder={t.placeholders.screenshotUrl}
            className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>
      </motion.div>
    );
  };

  const renderBugReportForm = (): ReactElement => {
    const { location, details, reproduction, includeSystemInfo } = draft.bugReport;
    return (
      <motion.div
        key="bug"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="space-y-6"
      >
        <section className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.bug.locationLabel}</label>
          <input
            type="text"
            value={location}
            onChange={(event) => updateBugReport('location', event.target.value)}
            placeholder={t.placeholders.bugLocation}
            className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>

        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.bug.detailsLabel}</label>
          <textarea
            rows={4}
            value={details}
            onChange={(event) => updateBugReport('details', event.target.value)}
            placeholder={t.placeholders.bugDetails}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>

        <section className="space-y-3">
          <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.forms.bug.reproductionLabel}</label>
          <textarea
            rows={4}
            value={reproduction}
            onChange={(event) => updateBugReport('reproduction', event.target.value)}
            placeholder={t.placeholders.bugReproduction}
            className="w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          />
        </section>

        <label className="flex items-center gap-3 text-sm text-subtle">
          <input
            type="checkbox"
            checked={includeSystemInfo}
            onChange={(event) => updateBugReport('includeSystemInfo', event.target.checked)}
            className="h-4 w-4 rounded border surface-border"
          />
          {t.forms.bug.includeSystemInfoLabel}
        </label>
      </motion.div>
    );
  };

  const renderNewTechniqueForm = (): ReactElement => {
    const form = draft.newTechnique;
    const activeLocale = activeLocaleTab;
    const summaryLimit = SUMMARY_MAX;

    const hanmiOptions: SelectOption<string>[] = [
      { value: 'ai-hanmi', label: t.newTechnique.hanmiOptions['ai-hanmi'] },
      { value: 'gyaku-hanmi', label: t.newTechnique.hanmiOptions['gyaku-hanmi'] },
    ];

    const entryOptions: Array<'irimi' | 'tenkan'> = ['irimi', 'tenkan'];

    const handleEntryToggle = (entry: 'irimi' | 'tenkan') => {
      setNewTechnique((current) => {
        const entries = current.entries.includes(entry)
          ? current.entries.filter((value) => value !== entry)
          : [...current.entries, entry];
        return { ...current, entries };
      });
    };

    const handleHanmiChange = (value: string) => {
      updateNewTechnique('hanmi', value === 'ai-hanmi' || value === 'gyaku-hanmi' ? (value as Hanmi) : null);
    };

    const summaryFeedback = (localeKey: Locale): string => {
      const remaining = summaryLimit - summaryLengths[localeKey];
      if (summaryExceeded[localeKey]) {
        return t.newTechnique.hints.summaryExceeded.replace('{remaining}', String(Math.abs(remaining)));
      }
      return t.newTechnique.hints.summaryRemaining.replace('{remaining}', String(remaining));
    };

    const localizedLists = {
      ukeNotes: form.ukeNotes[activeLocale],
      keyPoints: form.keyPoints[activeLocale],
      commonMistakes: form.commonMistakes[activeLocale],
    } as Record<'ukeNotes' | 'keyPoints' | 'commonMistakes', string[]>;

    const renderListEditor = (
      field: 'ukeNotes' | 'keyPoints' | 'commonMistakes',
      label: string,
      addLabel: string,
      placeholder: string,
    ) => {
      const items = localizedLists[field];
      return (
        <section className="space-y-3">
          <span className="text-xs uppercase tracking-[0.3em] text-subtle">{label}</span>
          <div className="space-y-2">
            {items.map((value, index) => (
              <div key={`${field}-${activeLocale}-${index}`} className="flex items-center gap-2">
                <input
                  value={value}
                  onChange={(event) => updateLocalizedListField(field, activeLocale, index, event.target.value)}
                  placeholder={placeholder}
                  className="flex-1 rounded-xl border surface-border bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                />
                <button
                  type="button"
                  onClick={() => removeLocalizedListItem(field, activeLocale, index)}
                  className="text-xs text-subtle hover:text-[var(--color-text)]"
                  disabled={items.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {items.length < 3 && (
            <button
              type="button"
              onClick={() => addLocalizedListItem(field, activeLocale)}
              className="text-sm text-[var(--color-accent, var(--color-text))] hover:underline"
            >
              + {addLabel}
            </button>
          )}
        </section>
      );
    };

    const duplicatesHeadline = duplicateMatches.length > 0 ? t.newTechnique.duplicates.possibleMatches : t.newTechnique.duplicates.none;

    return (
      <motion.div
        key="newTechnique"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="space-y-8"
      >
        {!form.precheckConfirmed && (
          <div className="rounded-xl border border-dashed surface-border bg-[var(--color-surface)] px-4 py-3 text-sm text-subtle">
            {t.newTechnique.precheckReminder}
          </div>
        )}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.details}</h2>
              <p className="text-xs text-subtle">{t.newTechnique.languageInstruction}</p>
            </div>
            <Segmented
              value={activeLocale}
              onChange={(value) => setActiveLocaleTab(value as Locale)}
              options={[
                { value: 'en', label: t.newTechnique.languageOptions.en },
                { value: 'de', label: t.newTechnique.languageOptions.de },
              ]}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle" htmlFor="nt-name-en">
                {t.newTechnique.fields.name.en}
              </label>
              <input
                id="nt-name-en"
                value={form.name.en}
                onChange={(event) => updateTechniqueName('en', event.target.value)}
                placeholder={t.placeholders.newTechniqueNameEn}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle" htmlFor="nt-name-de">
                {t.newTechnique.fields.name.de}
              </label>
              <input
                id="nt-name-de"
                value={form.name.de}
                onChange={(event) => updateTechniqueName('de', event.target.value)}
                placeholder={t.placeholders.newTechniqueNameDe}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle" htmlFor="nt-jp-kanji">
                {t.newTechnique.fields.jpKanji}
              </label>
              <input
                id="nt-jp-kanji"
                value={form.jp.kanji}
                onChange={(event) => updateNewTechnique('jp', { ...form.jp, kanji: event.target.value })}
                placeholder={t.placeholders.newTechniqueKanji}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle" htmlFor="nt-jp-romaji">
                {t.newTechnique.fields.romaji}
              </label>
              <input
                id="nt-jp-romaji"
                value={form.jp.romaji}
                onChange={(event) => updateNewTechnique('jp', { ...form.jp, romaji: event.target.value })}
                placeholder={t.placeholders.newTechniqueRomaji}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.taxonomy}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.attack}
              </label>
              <Select
                options={attackOptions}
                value={form.attack ?? ''}
                onChange={(value) => updateNewTechnique('attack', value || null)}
                placeholder={t.placeholders.newTechniqueAttack}
                searchable
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.category}
              </label>
              <Select
                options={categoryOptions}
                value={form.category ?? ''}
                onChange={(value) => updateNewTechnique('category', value || null)}
                placeholder={t.placeholders.newTechniqueCategory}
                searchable
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.weapon}
              </label>
              <Select
                options={weaponOptions}
                value={form.weapon ?? ''}
                onChange={(value) => updateNewTechnique('weapon', value || null)}
                placeholder={t.placeholders.newTechniqueWeapon}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.levelHint}
              </label>
              <input
                value={form.levelHint}
                onChange={(event) => updateNewTechnique('levelHint', event.target.value)}
                placeholder={t.placeholders.newTechniqueLevel}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-subtle">{t.newTechnique.fields.entries}</span>
              <div className="flex flex-wrap gap-2">
                {entryOptions.map((entry) => {
                  const active = form.entries.includes(entry);
                  return (
                    <label key={entry} className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => handleEntryToggle(entry)}
                        className="sr-only"
                      />
                      <Chip label={t.newTechnique.entryLabels[entry]} active={active} />
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.hanmi}
              </label>
              <Select
                options={hanmiOptions}
                value={form.hanmi ?? ''}
                onChange={handleHanmiChange}
                placeholder={t.placeholders.newTechniqueHanmi}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-subtle">{t.newTechnique.fields.slugPreview}</label>
            <div className="rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm font-mono">
              {slugPreview || '—'}
            </div>
            <p className="text-xs text-subtle">{t.newTechnique.hints.slugPreview}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text)]">{duplicatesHeadline}</p>
            {duplicateMatches.length > 0 && (
              <ul className="space-y-1 text-xs text-subtle">
                {duplicateMatches.map((match) => (
                  <li key={match.id}>
                    {match.name.en || match.name.de} · {getTaxonomyLabel(locale, 'attack', match.attack || '')}
                  </li>
                ))}
              </ul>
            )}
            {duplicateMatches.length > 0 && (
              <button
                type="button"
                onClick={() => handleTypeChange('addVariation')}
                className="text-xs text-[var(--color-accent, var(--color-text))] hover:underline"
              >
                {t.newTechnique.duplicates.switch}
              </button>
            )}
          </div>

          {unusualCombo && (
            <div className="rounded-lg border border-dashed surface-border px-3 py-2 text-xs text-subtle">
              {t.newTechnique.hints.unusualCombo}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.summary}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle" htmlFor="nt-summary-en">
                {t.newTechnique.fields.summary.en}
              </label>
              <textarea
                id="nt-summary-en"
                rows={4}
                value={form.summary.en}
                onChange={(event) => updateTechniqueSummary('en', event.target.value)}
                placeholder={t.placeholders.newTechniqueSummaryEn}
                className={classNames(
                  'w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                  summaryExceeded.en && 'border-[var(--color-error, #b91c1c)]',
                )}
              />
              <p
                className={classNames(
                  'text-xs',
                  summaryExceeded.en ? 'text-[var(--color-error, #b91c1c)]' : 'text-subtle',
                )}
              >
                {summaryFeedback('en')}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle" htmlFor="nt-summary-de">
                {t.newTechnique.fields.summary.de}
              </label>
              <textarea
                id="nt-summary-de"
                rows={4}
                value={form.summary.de}
                onChange={(event) => updateTechniqueSummary('de', event.target.value)}
                placeholder={t.placeholders.newTechniqueSummaryDe}
                className={classNames(
                  'w-full rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                  summaryExceeded.de && 'border-[var(--color-error, #b91c1c)]',
                )}
              />
              <p
                className={classNames(
                  'text-xs',
                  summaryExceeded.de ? 'text-[var(--color-error, #b91c1c)]' : 'text-subtle',
                )}
              >
                {summaryFeedback('de')}
              </p>
            </div>
          </div>
          {summariesEmpty && (
            <p className="text-xs text-[var(--color-error, #b91c1c)]">{t.newTechnique.warnings.summaryMissing}</p>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.steps}</h2>
          <p className="text-xs text-subtle">{t.newTechnique.hints.stepsLocalized}</p>
          <StepBuilder
            label={t.forms.improve.stepsLabel}
            steps={form.steps[activeLocale]}
            onChange={(steps) => updateLocalizedSteps(activeLocale, steps)}
            placeholderForIndex={stepPlaceholder}
            helperText={t.hints.stepHelper}
            addButtonLabel={t.buttons.addStep}
            removeButtonAria={removeStepAria}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.uke}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.ukeRole[activeLocale]}
              </label>
              <input
                value={form.ukeRole[activeLocale]}
                onChange={(event) => updateUkeRole(activeLocale, event.target.value)}
                placeholder={t.placeholders.newTechniqueUkeRole}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.hanmi}
              </label>
              <Select
                options={hanmiOptions}
                value={form.hanmi ?? ''}
                onChange={handleHanmiChange}
                placeholder={t.placeholders.newTechniqueHanmi}
              />
            </div>
          </div>
          {renderListEditor('ukeNotes', t.newTechnique.fields.ukeNotes[activeLocale], t.buttons.addUkeNote, t.placeholders.newTechniqueUkeNote)}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.insights}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {renderListEditor('keyPoints', t.newTechnique.fields.keyPoints[activeLocale], t.buttons.addKeyPoint, t.placeholders.newTechniqueKeyPoint)}
            {renderListEditor('commonMistakes', t.newTechnique.fields.commonMistakes[activeLocale], t.buttons.addMistake, t.placeholders.newTechniqueMistake)}
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
            allowedKinds={['youtube', 'image']}
            allowTitle
            titleLabel={t.newTechnique.fields.mediaTitle}
            titlePlaceholder={t.placeholders.newTechniqueMediaTitle}
            disallowMessage={t.newTechnique.mediaRestrictions}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">{t.newTechnique.sections.contributor}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.contributorName}
              </label>
              <input
                value={form.contributor.name}
                onChange={(event) => updateNewTechnique('contributor', { ...form.contributor, name: event.target.value })}
                placeholder={t.placeholders.contributorName}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.3em] text-subtle">
                {t.newTechnique.fields.contributorContact}
              </label>
              <input
                value={form.contributor.contact}
                onChange={(event) => updateNewTechnique('contributor', { ...form.contributor, contact: event.target.value })}
                placeholder={t.placeholders.contributorContact}
                className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-subtle">
              {t.newTechnique.fields.source}
            </label>
            <input
              value={form.sources}
              onChange={(event) => updateNewTechnique('sources', event.target.value)}
              placeholder={t.placeholders.newTechniqueSources}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.3em] text-subtle">
              {t.newTechnique.fields.lineage}
            </label>
            <input
              value={form.lineage.dojoOrTrainer}
              onChange={(event) => updateNewTechnique('lineage', { ...form.lineage, dojoOrTrainer: event.target.value })}
              placeholder={t.placeholders.newTechniqueLineage}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            />
            <label className="flex items-center gap-2 text-xs text-subtle">
              <input
                type="checkbox"
                checked={form.lineage.markAsBase}
                onChange={(event) => updateNewTechnique('lineage', { ...form.lineage, markAsBase: event.target.checked })}
                className="h-4 w-4 rounded border surface-border"
              />
              {t.newTechnique.lineageToggle}
            </label>
            <p className="text-xs text-subtle">{t.newTechnique.lineageHelp}</p>
          </div>
        </section>

        <section className="space-y-2">
          <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => updateNewTechnique('consent', event.target.checked)}
              className="h-4 w-4 rounded border surface-border"
            />
            {t.newTechnique.consentLabel}
          </label>
          {!form.consent && (
            <p className="text-xs text-[var(--color-error, #b91c1c)]">{t.newTechnique.warnings.consentMissing}</p>
          )}
        </section>
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

  const renderPrecheckModal = (): ReactElement => (
    <AnimatePresence>
      {isPrecheckOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            setIsPrecheckOpen(false);
          }}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl border surface border-surface-border bg-[var(--color-surface)] p-6 shadow-xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.precheck.title}</h2>
              <p className="text-sm text-subtle">{t.precheck.description}</p>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-subtle" htmlFor="precheck-search">
                  {t.precheck.searchLabel}
                </label>
                <input
                  id="precheck-search"
                  value={draft.newTechnique.precheckSearch}
                  onChange={(event) => updateNewTechnique('precheckSearch', event.target.value)}
                  placeholder={t.precheck.searchPlaceholder}
                  className="w-full rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--color-text)]">{t.precheck.matchesTitle}</p>
                {precheckMatches.length === 0 ? (
                  <p className="text-xs text-subtle">{t.precheck.noMatches}</p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto text-xs text-subtle">
                    {precheckMatches.map((tech) => (
                      <li key={`precheck-${tech.id}`} className="rounded-lg border surface-border px-3 py-2">
                        <p className="font-medium text-[var(--color-text)]">{tech.name[locale] || tech.name.en}</p>
                        <p>
                          {tech.attack
                            ? getTaxonomyLabel(locale, 'attack', tech.attack)
                            : t.summary.notSpecified}
                        </p>
                        <button
                          type="button"
                          className="mt-1 text-[var(--color-accent, var(--color-text))] hover:underline"
                          onClick={() => {
                            handleTypeChange('addVariation');
                            setIsPrecheckOpen(false);
                            setPrecheckAcknowledged(false);
                          }}
                        >
                          {t.precheck.switchToVariation}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="text-xs text-subtle">{t.precheck.duplicateHint}</p>
              <label className="flex items-center gap-2 text-xs text-[var(--color-text)]">
                <input
                  type="checkbox"
                  checked={precheckAcknowledged}
                  onChange={(event) => setPrecheckAcknowledged(event.target.checked)}
                  className="h-4 w-4 rounded border surface-border"
                />
                {t.precheck.checkboxLabel}
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                onClick={() => {
                  setIsPrecheckOpen(false);
                  setPrecheckAcknowledged(false);
                }}
                  className="rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm"
                >
                  {t.precheck.cancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft((current) => ({
                      ...current,
                      selectedType: 'newTechnique',
                      newTechnique: {
                        ...current.newTechnique,
                        precheckConfirmed: true,
                      },
                    }));
                    setIsPrecheckOpen(false);
                    setPrecheckAcknowledged(false);
                    setSubmissionState('idle');
                  }}
                  disabled={!precheckAcknowledged}
                  className={classNames(
                    'rounded-xl px-4 py-2 text-sm font-medium transition-soft',
                    precheckAcknowledged
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                      : 'border surface-border bg-[var(--color-surface)] text-subtle cursor-not-allowed',
                  )}
                >
                  {t.precheck.confirm}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
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
                onClick={() => handleTypeChange(value)}
                className={classNames(
                  'text-left rounded-2xl border px-4 py-4 shadow-sm transition-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                  isActive ? 'border-[var(--color-text)] bg-[var(--color-surface)]' : 'surface-border bg-[var(--color-surface)] hover-border-adaptive',
                )}
                layoutId="feedback-card"
              >
                <div className="flex items-start gap-3">
                  <span className="text-subtle" aria-hidden>
                    {content.icon}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-[var(--color-text)]">{content.title}</p>
                    <p className="text-sm text-subtle">{content.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence initial={false}>
          {selectedCard && (
            <motion.div
              key="selector-divider"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="h-px w-full bg-gradient-to-r from-transparent via-surface-border to-transparent"
            />
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{t.headings.dynamic}</h2>
        <AnimatePresence initial={false}>
          {selectedCard ? (
            renderForm()
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
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
          <dl className="grid gap-3 sm:grid-cols-2">
            {summaryEntries.map((item) => (
              <div key={item.label} className="space-y-1">
                <dt className="text-xs uppercase tracking-[0.3em] text-subtle">{item.label}</dt>
                <dd className="text-sm text-[var(--color-text)]">{item.value}</dd>
              </div>
            ))}
          </dl>
          {submissionState === 'success' ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-transparent bg-[var(--color-surface)] px-4 py-3 text-sm shadow-sm"
            >
              <p className="font-medium">{t.hints.successTitle}</p>
              <p className="text-subtle">{t.hints.successBody}</p>
            </motion.div>
          ) : (
            <p className="text-xs text-subtle">{t.hints.summaryHint}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isSubmitEnabled || submissionState === 'success'}
              className={classNames(
                'rounded-xl px-4 py-2.5 text-sm font-medium transition-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                isSubmitEnabled && submissionState !== 'success'
                  ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                  : 'border surface-border bg-[var(--color-surface)] text-subtle cursor-not-allowed',
              )}
            >
              {t.buttons.submit}
            </button>
            <button
              type="button"
              onClick={() => setSubmissionState('idle')}
              className="rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2.5 text-sm"
            >
              {t.buttons.edit}
            </button>
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
          <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">{t.headings.jsonPreview}</h2>
          <pre className="max-h-64 overflow-auto rounded-2xl border surface-border bg-[var(--color-surface)] p-4 text-xs">
            {JSON.stringify(draft, null, 2)}
          </pre>
        </section>
      )}
      </main>
      {renderPrecheckModal()}
    </>
  );
};
