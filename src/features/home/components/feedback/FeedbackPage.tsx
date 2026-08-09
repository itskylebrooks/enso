import { Select, type SelectOption } from '@shared/components/ui/Select';
import { getLevelLabel, getOrderedTaxonomyValues, getTaxonomyLabel } from '@shared/i18n/taxonomy';
import type { Copy } from '@shared/constants/i18n';
import type {
  Exercise,
  GlossaryTerm,
  Grade,
  LibraryRoutine,
  Locale,
  Technique,
} from '@shared/types';
import type {
  FeedbackContentMode,
  FeedbackContentType,
  FeedbackInitialContext,
  FeedbackType,
} from '@shared/types/feedback';
import { classNames } from '@shared/utils/classNames';
import { gradeOrder } from '@shared/utils/grades';
import {
  ArrowLeft,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  FilePenLine,
  Lightbulb,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { getFeedbackCopy } from './feedbackCopy';
import { routineCollections } from '../home/routinesData';
import {
  applyInitialContext,
  buildFeedbackSubmission,
  createFeedbackDraft,
  FEEDBACK_DRAFT_KEY,
  LEGACY_FEEDBACK_DRAFT_KEY,
  parseFeedbackDraft,
  type ContentDraft,
  type FeedbackDraftV2,
} from './feedbackModel';

export type { FeedbackType, FeedbackInitialContext } from '@shared/types/feedback';

type FeedbackPageProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  exercises?: Exercise[];
  glossaryTerms?: GlossaryTerm[];
  onBack?: () => void;
  initialContext?: FeedbackInitialContext | null;
  onConsumeInitialContext?: () => void;
};

type FieldProps = {
  label: string;
  children: ReactNode;
  error?: boolean;
};

const Field = ({ label, children, error = false }: FieldProps): ReactElement => (
  <div className="space-y-2">
    <label className={classNames('text-sm font-medium', error && 'text-red-500')}>{label}</label>
    {children}
  </div>
);

const inputClass = (error = false): string =>
  classNames(
    'w-full rounded-xl border bg-[var(--color-surface)] px-4 py-3 text-sm focus-halo focus:outline-none',
    error ? 'border-red-500' : 'surface-border',
  );

type ListEditorProps = {
  label: string;
  addLabel: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
};

const ListEditor = ({
  label,
  addLabel,
  values,
  placeholder,
  onChange,
}: ListEditorProps): ReactElement => (
  <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-medium">{label}</h3>
      <button
        type="button"
        onClick={() => onChange([...values, ''])}
        className="inline-flex items-center gap-1.5 rounded-lg border surface-border px-2.5 py-1.5 text-xs surface-hover"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {addLabel}
      </button>
    </div>
    {values.length > 0 && (
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex items-center gap-2">
            <span className="w-5 text-right text-xs text-subtle">{index + 1}.</span>
            <input
              value={value}
              onChange={(event) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className={inputClass()}
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
              className="rounded-lg p-2 text-subtle surface-hover"
              aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

const isValidOptionalUrl = (value: string): boolean => {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const contentTypes: FeedbackContentType[] = [
  'technique',
  'exercise',
  'routine',
  'form',
  'glossary',
  'exam',
  'other',
];

const flowIcons: Record<FeedbackType, typeof FilePenLine> = {
  content: FilePenLine,
  idea: Lightbulb,
  bug: Bug,
};

const renderFlowIcon = (flow: FeedbackType): ReactElement => {
  const Icon = flowIcons[flow];
  return <Icon className="h-5 w-5" aria-hidden />;
};

export const FeedbackPage = ({
  copy,
  locale,
  techniques,
  exercises = [],
  glossaryTerms = [],
  onBack,
  initialContext,
  onConsumeInitialContext,
}: FeedbackPageProps): ReactElement => {
  const t = getFeedbackCopy(locale);
  const [draft, setDraft] = useState<FeedbackDraftV2>(createFeedbackDraft);
  const [hydrated, setHydrated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submissionState, setSubmissionState] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    try {
      const current = window.localStorage.getItem(FEEDBACK_DRAFT_KEY);
      const legacy = window.localStorage.getItem(LEGACY_FEEDBACK_DRAFT_KEY);
      const stored = current ?? legacy;
      if (stored) setDraft(parseFeedbackDraft(JSON.parse(stored)));
      if (!current && legacy) window.localStorage.removeItem(LEGACY_FEEDBACK_DRAFT_KEY);
    } catch {
      setDraft(createFeedbackDraft());
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !initialContext) return;
    setDraft((current) => applyInitialContext(current, initialContext));
    onConsumeInitialContext?.();
  }, [hydrated, initialContext, onConsumeInitialContext]);

  useEffect(() => {
    if (!hydrated || submissionState === 'success') return;
    window.localStorage.setItem(FEEDBACK_DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated, submissionState]);

  const updateContent = useCallback(
    <K extends keyof ContentDraft>(key: K, value: ContentDraft[K]): void => {
      setDraft((current) => ({
        ...current,
        content: { ...current.content, [key]: value },
      }));
      setShowErrors(false);
    },
    [],
  );

  const techniqueOptions = useMemo<SelectOption<string>[]>(
    () =>
      techniques
        .map((technique) => ({
          value: technique.slug,
          label: technique.name[locale] || technique.name.en,
        }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label))),
    [locale, techniques],
  );

  const exerciseOptions = useMemo<SelectOption<string>[]>(
    () =>
      exercises
        .map((exercise) => ({
          value: exercise.slug,
          label: exercise.name[locale] || exercise.name.en,
        }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label))),
    [exercises, locale],
  );

  const glossaryOptions = useMemo<SelectOption<string>[]>(
    () =>
      glossaryTerms
        .map((term) => ({ value: term.slug, label: term.romaji }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label))),
    [glossaryTerms],
  );

  const routineOptions = useMemo<SelectOption<string>[]>(
    () =>
      Object.entries(routineCollections).flatMap(([category, collection]) =>
        collection.presets.map((preset) => ({
          value: `${category}/${preset.id}`,
          label: preset.title[locale] || preset.title.en,
          group:
            copy.examsPage.routines.find((item) => item.id === category)?.title ?? category,
        })),
      ),
    [copy.examsPage.routines, locale],
  );

  const formOptions = useMemo<SelectOption<string>[]>(
    () =>
      copy.formsPage.items.map((item) => ({
        value: item.id,
        label: item.title,
      })),
    [copy.formsPage.items],
  );

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
  const levelOptions = useMemo<SelectOption<string>[]>(
    () => gradeOrder.map((value) => ({ value, label: getLevelLabel(locale, value) })),
    [locale],
  );

  const selectedTargetLabel = useMemo(() => {
    const { contentType, entityId } = draft.content;
    if (!entityId) return '';
    if (contentType === 'technique') {
      const technique = techniques.find((item) => item.slug === entityId);
      return technique?.name[locale] || technique?.name.en || entityId;
    }
    if (contentType === 'exercise') {
      const exercise = exercises.find((item) => item.slug === entityId);
      return exercise?.name[locale] || exercise?.name.en || entityId;
    }
    if (contentType === 'glossary') {
      return glossaryTerms.find((item) => item.slug === entityId)?.romaji || entityId;
    }
    if (contentType === 'routine') {
      return String(routineOptions.find((item) => item.value === entityId)?.label ?? entityId);
    }
    if (contentType === 'form') {
      return String(formOptions.find((item) => item.value === entityId)?.label ?? entityId);
    }
    return entityId;
  }, [draft.content, exercises, formOptions, glossaryTerms, locale, routineOptions, techniques]);

  const validation = useMemo(() => {
    if (draft.flow === 'content') {
      return {
        target:
          draft.content.mode === 'edit'
            ? Boolean(draft.content.entityId.trim())
            : Boolean(draft.content.contentName.trim()),
        details: Boolean(draft.content.details.trim()),
        consent: draft.content.consent,
        url: isValidOptionalUrl(draft.content.mediaUrl),
      };
    }
    if (draft.flow === 'idea') {
      return {
        target: true,
        details: Boolean(draft.idea.details.trim()),
        consent: true,
        url: isValidOptionalUrl(draft.idea.mediaUrl),
      };
    }
    if (draft.flow === 'bug') {
      return {
        target: true,
        details: Boolean(draft.bug.details.trim()),
        consent: true,
        url: isValidOptionalUrl(draft.bug.mediaUrl),
      };
    }
    return { target: false, details: false, consent: false, url: true };
  }, [draft]);

  const canReview = Object.values(validation).every(Boolean);

  const chooseFlow = (flow: FeedbackType): void => {
    setDraft((current) => ({ ...current, flow }));
    setSubmissionState('idle');
    setShowErrors(false);
  };

  const handleReview = (): void => {
    if (!canReview) {
      setShowErrors(true);
      return;
    }
    setReviewOpen(true);
  };

  const handleSubmit = async (): Promise<void> => {
    const payload = buildFeedbackSubmission(draft, locale);
    if (!payload) {
      setReviewOpen(false);
      setShowErrors(true);
      return;
    }

    setSubmissionState('submitting');
    setSubmitError('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;
      if (!response.ok || !result?.ok) throw new Error(result?.message || t.submitError);
      window.localStorage.removeItem(FEEDBACK_DRAFT_KEY);
      setReviewOpen(false);
      setSubmissionState('success');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t.submitError);
      setSubmissionState('error');
    }
  };

  const restart = (): void => {
    setDraft(createFeedbackDraft());
    setSubmissionState('idle');
    setShowErrors(false);
    setSubmitError('');
  };

  const renderTargetField = (): ReactElement => {
    const { contentType, entityId } = draft.content;
    const placeholder = t.content.existingPlaceholders[contentType];
    if (
      contentType === 'technique' ||
      contentType === 'exercise' ||
      contentType === 'routine' ||
      contentType === 'form' ||
      contentType === 'glossary'
    ) {
      const options =
        contentType === 'technique'
          ? techniqueOptions
          : contentType === 'exercise'
            ? exerciseOptions
            : contentType === 'routine'
              ? routineOptions
              : contentType === 'form'
                ? formOptions
                : glossaryOptions;
      return (
        <Select
          options={options}
          value={entityId}
          onChange={(value) => updateContent('entityId', value)}
          placeholder={placeholder}
          searchable
          aria-label={t.content.existingLabel}
        />
      );
    }
    return (
      <input
        value={entityId}
        onChange={(event) => updateContent('entityId', event.target.value)}
        placeholder={placeholder}
        className={inputClass(showErrors && !validation.target)}
      />
    );
  };

  const renderVariantFields = (): ReactElement => {
    const key = draft.content.variantKey;
    const setVariant = (patch: Partial<typeof key>): void =>
      updateContent('variantKey', { ...key, ...patch });
    return (
      <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4 space-y-4">
        <h3 className="text-sm font-semibold">{t.content.variantTitle}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.content.hanmi}>
            <Select
              value={key.hanmi}
              onChange={(value) => setVariant({ hanmi: value as typeof key.hanmi })}
              options={[
                { value: 'ai-hanmi', label: 'Ai-hanmi' },
                { value: 'gyaku-hanmi', label: 'Gyaku-hanmi' },
              ]}
            />
          </Field>
          <Field label={t.content.direction}>
            <Select
              value={key.direction}
              onChange={(value) => setVariant({ direction: value as typeof key.direction })}
              options={[
                { value: 'irimi', label: 'Irimi' },
                { value: 'tenkan', label: 'Tenkan' },
                { value: 'omote', label: 'Omote' },
                { value: 'ura', label: 'Ura' },
              ]}
            />
          </Field>
          <Field label={t.content.weapon}>
            <Select
              value={key.weapon}
              onChange={(value) => setVariant({ weapon: value as typeof key.weapon })}
              options={[
                { value: 'empty', label: getTaxonomyLabel(locale, 'weapon', 'empty-hand') },
                { value: 'bokken', label: 'Bokken' },
                { value: 'jo', label: 'Jō' },
                { value: 'tanto', label: 'Tantō' },
              ]}
            />
          </Field>
          <Field label={t.content.version}>
            <input
              value={key.versionId ?? ''}
              onChange={(event) => setVariant({ versionId: event.target.value || null })}
              className={inputClass()}
            />
          </Field>
        </div>
      </div>
    );
  };

  const renderStructuredContent = (): ReactElement => (
    <details className="group rounded-2xl border surface-border bg-[var(--color-surface)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 sm:p-5">
        <span>
          <span className="block text-sm font-semibold">{t.content.moreTitle}</span>
          <span className="mt-1 block text-xs text-subtle">{t.content.moreDescription}</span>
        </span>
        <ChevronDown className="h-5 w-5 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t surface-border p-4 sm:p-5 space-y-6">
        {draft.content.contentType === 'technique' && draft.content.mode === 'new' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t.content.taxonomyTitle}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.content.attack}>
                <Select
                  options={attackOptions}
                  value={draft.content.attack}
                  onChange={(value) => updateContent('attack', value)}
                  placeholder="—"
                />
              </Field>
              <Field label={t.content.category}>
                <Select
                  options={categoryOptions}
                  value={draft.content.category}
                  onChange={(value) => updateContent('category', value)}
                  placeholder="—"
                />
              </Field>
              <Field label={t.content.level}>
                <Select
                  options={levelOptions}
                  value={draft.content.level}
                  onChange={(value) => updateContent('level', value as Grade)}
                  placeholder="—"
                />
              </Field>
            </div>
          </div>
        )}
        {draft.content.contentType === 'routine' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.content.routineCategory}>
                <Select
                  value={draft.content.routineCategory}
                  onChange={(value) => updateContent('routineCategory', value)}
                  placeholder="—"
                  options={(Object.keys(routineCollections) as LibraryRoutine[]).map((value) => ({
                    value,
                    label:
                      copy.examsPage.routines.find((item) => item.id === value)?.title ?? value,
                  }))}
                />
              </Field>
              <Field label={t.content.estimatedMinutes}>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={draft.content.estimatedMinutes}
                  onChange={(event) => updateContent('estimatedMinutes', event.target.value)}
                  className={inputClass()}
                />
              </Field>
            </div>
            <ListEditor
              label={t.content.routineExercises}
              addLabel={t.content.addItem}
              values={draft.content.routineExercises}
              placeholder={t.content.routineExercisePlaceholder}
              onChange={(values) => updateContent('routineExercises', values)}
            />
          </div>
        ) : (
          <ListEditor
            label={t.content.steps}
            addLabel={t.content.addStep}
            values={draft.content.steps}
            placeholder={t.content.steps}
            onChange={(values) => updateContent('steps', values)}
          />
        )}
        {draft.content.contentType === 'technique' && (
          <Field label={t.content.uke}>
            <textarea
              rows={3}
              value={draft.content.uke}
              onChange={(event) => updateContent('uke', event.target.value)}
              className={inputClass()}
            />
          </Field>
        )}
        {(draft.content.contentType === 'technique' ||
          draft.content.contentType === 'exercise' ||
          draft.content.contentType === 'form') && (
          <div className="grid gap-6 md:grid-cols-2">
            <ListEditor
              label={t.content.keyPoints}
              addLabel={t.content.addItem}
              values={draft.content.keyPoints}
              placeholder={t.content.keyPoints}
              onChange={(values) => updateContent('keyPoints', values)}
            />
            <ListEditor
              label={t.content.mistakes}
              addLabel={t.content.addItem}
              values={draft.content.commonMistakes}
              placeholder={t.content.mistakes}
              onChange={(values) => updateContent('commonMistakes', values)}
            />
          </div>
        )}
        <Field label={t.content.context}>
          <textarea
            rows={3}
            value={draft.content.context}
            onChange={(event) => updateContent('context', event.target.value)}
            className={inputClass()}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t.content.attribution}>
            <input
              value={draft.content.attribution}
              onChange={(event) => updateContent('attribution', event.target.value)}
              className={inputClass()}
            />
          </Field>
          <Field label={t.content.media} error={showErrors && !validation.url}>
            <input
              type="url"
              value={draft.content.mediaUrl}
              onChange={(event) => updateContent('mediaUrl', event.target.value)}
              placeholder="https://"
              className={inputClass(showErrors && !validation.url)}
            />
            {showErrors && !validation.url && <p className="text-xs text-red-500">{t.invalidUrl}</p>}
          </Field>
        </div>
        <Field label={t.content.contributor}>
          <input
            value={draft.content.contributorName}
            onChange={(event) => updateContent('contributorName', event.target.value)}
            className={inputClass()}
          />
        </Field>
      </div>
    </details>
  );

  const renderContentFlow = (): ReactElement => (
    <div className="space-y-6">
      <Field label={t.content.typeLabel}>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((contentType) => {
            const selected = draft.content.contentType === contentType;
            return (
              <button
                key={contentType}
                type="button"
                onClick={() => {
                  setDraft((current) => ({
                    ...current,
                    content: {
                      ...current.content,
                      contentType,
                      entityId: '',
                      includeVariant: false,
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
                    },
                  }));
                  setShowErrors(false);
                }}
                aria-pressed={selected}
                className={classNames(
                  'rounded-full border px-3 py-2 text-sm transition-soft',
                  selected
                    ? 'border-[var(--color-text)] bg-[var(--color-surface-hover)]'
                    : 'surface-border bg-[var(--color-surface)] surface-hover',
                )}
              >
                {t.content.types[contentType]}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={t.content.modeLabel}>
        <div className="grid grid-cols-2 rounded-xl border surface-border bg-[var(--color-surface)] p-1">
          {(['edit', 'new'] as FeedbackContentMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateContent('mode', mode)}
              aria-pressed={draft.content.mode === mode}
              className={classNames(
                'rounded-lg px-3 py-2 text-sm transition-soft',
                draft.content.mode === mode
                  ? 'bg-[var(--color-surface-hover)] font-medium shadow-sm'
                  : 'text-subtle',
              )}
            >
              {t.content.modes[mode]}
            </button>
          ))}
        </div>
      </Field>

      {draft.content.mode === 'edit' ? (
        <Field label={t.content.existingLabel} error={showErrors && !validation.target}>
          {renderTargetField()}
        </Field>
      ) : (
        <Field label={t.content.nameLabel} error={showErrors && !validation.target}>
          <input
            value={draft.content.contentName}
            onChange={(event) => updateContent('contentName', event.target.value)}
            placeholder={t.content.namePlaceholder}
            className={inputClass(showErrors && !validation.target)}
          />
        </Field>
      )}

      {draft.content.contentType === 'technique' && draft.content.mode === 'edit' && (
        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.content.includeVariant}
              onChange={(event) => updateContent('includeVariant', event.target.checked)}
              className="h-4 w-4 rounded border surface-border"
            />
            {t.content.variantToggle}
          </label>
          {draft.content.includeVariant && renderVariantFields()}
        </div>
      )}

      <Field
        label={
          draft.content.mode === 'new' ? t.content.detailsNewLabel : t.content.detailsLabel
        }
        error={showErrors && !validation.details}
      >
        <textarea
          rows={6}
          value={draft.content.details}
          onChange={(event) => updateContent('details', event.target.value)}
          placeholder={t.content.detailsPlaceholder}
          className={inputClass(showErrors && !validation.details)}
        />
      </Field>

      {renderStructuredContent()}

      <label
        className={classNames(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm',
          showErrors && !validation.consent ? 'border-red-500' : 'surface-border',
        )}
      >
        <input
          type="checkbox"
          checked={draft.content.consent}
          onChange={(event) => updateContent('consent', event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border surface-border"
        />
        {t.content.consent}
      </label>
    </div>
  );

  const renderIdeaFlow = (): ReactElement => (
    <div className="space-y-6">
      <Field label={t.idea.area}>
        <input
          value={draft.idea.area}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              idea: { ...current.idea, area: event.target.value },
            }))
          }
          placeholder={t.idea.areaPlaceholder}
          className={inputClass()}
        />
      </Field>
      <Field label={t.idea.details} error={showErrors && !validation.details}>
        <textarea
          rows={7}
          value={draft.idea.details}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              idea: { ...current.idea, details: event.target.value },
            }));
            setShowErrors(false);
          }}
          placeholder={t.idea.detailsPlaceholder}
          className={inputClass(showErrors && !validation.details)}
        />
      </Field>
      <Field label={t.idea.media} error={showErrors && !validation.url}>
        <input
          type="url"
          value={draft.idea.mediaUrl}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              idea: { ...current.idea, mediaUrl: event.target.value },
            }))
          }
          placeholder="https://"
          className={inputClass(showErrors && !validation.url)}
        />
        {showErrors && !validation.url && <p className="text-xs text-red-500">{t.invalidUrl}</p>}
      </Field>
    </div>
  );

  const renderBugFlow = (): ReactElement => (
    <div className="space-y-6">
      <Field label={t.bug.location}>
        <input
          value={draft.bug.location}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              bug: { ...current.bug, location: event.target.value },
            }))
          }
          placeholder={t.bug.locationPlaceholder}
          className={inputClass()}
        />
      </Field>
      <Field label={t.bug.details} error={showErrors && !validation.details}>
        <textarea
          rows={6}
          value={draft.bug.details}
          onChange={(event) => {
            setDraft((current) => ({
              ...current,
              bug: { ...current.bug, details: event.target.value },
            }));
            setShowErrors(false);
          }}
          placeholder={t.bug.detailsPlaceholder}
          className={inputClass(showErrors && !validation.details)}
        />
      </Field>
      <Field label={t.bug.reproduction}>
        <textarea
          rows={4}
          value={draft.bug.reproduction}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              bug: { ...current.bug, reproduction: event.target.value },
            }))
          }
          placeholder={t.bug.reproductionPlaceholder}
          className={inputClass()}
        />
      </Field>
      <Field label={t.bug.media} error={showErrors && !validation.url}>
        <input
          type="url"
          value={draft.bug.mediaUrl}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              bug: { ...current.bug, mediaUrl: event.target.value },
            }))
          }
          placeholder="https://"
          className={inputClass(showErrors && !validation.url)}
        />
        {showErrors && !validation.url && <p className="text-xs text-red-500">{t.invalidUrl}</p>}
      </Field>
    </div>
  );

  const flowCopy = draft.flow ? t.flows[draft.flow] : null;
  const reviewDescription =
    draft.flow === 'content'
      ? draft.content.details
      : draft.flow === 'idea'
        ? draft.idea.details
        : draft.flow === 'bug'
          ? draft.bug.details
          : '';

  return (
    <main className="pb-44 pt-0 sm:pb-12">
      <div className="container mx-auto max-w-3xl space-y-8 px-4 md:px-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-muted surface-hover"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.back || copy.backToLibrary}
          </button>
        )}

        <header className="space-y-3">
          <h1 className="text-3xl font-semibold sm:text-4xl">{t.title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">{t.subtitle}</p>
        </header>

        {submissionState === 'success' ? (
          <section className="rounded-2xl border surface-border bg-[var(--color-surface)] p-6 sm:p-8 space-y-5">
            <CheckCircle2 className="h-9 w-9" aria-hidden />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">{t.successTitle}</h2>
              <p className="text-sm text-muted">{t.successBody}</p>
            </div>
            <button
              type="button"
              onClick={restart}
              className="rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)]"
            >
              {t.another}
            </button>
          </section>
        ) : !draft.flow ? (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold">{t.choose}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['content', 'idea', 'bug'] as FeedbackType[]).map((flow) => (
                <button
                  key={flow}
                  type="button"
                  onClick={() => chooseFlow(flow)}
                  className="rounded-2xl border surface-border bg-[var(--color-surface)] p-5 text-left surface-hover transition-soft"
                >
                  <span className="mb-5 block text-subtle">{renderFlowIcon(flow)}</span>
                  <span className="block text-sm font-semibold">{t.flows[flow].title}</span>
                  <span className="mt-2 block text-xs leading-5 text-subtle">
                    {t.flows[flow].description}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-sm text-subtle">
              {t.email}{' '}
              <a href="mailto:enso@kylebrooks.me" className="underline underline-offset-4">
                enso@kylebrooks.me
              </a>
            </p>
          </section>
        ) : (
          <>
            <section className="flex items-center justify-between gap-4 rounded-2xl border surface-border bg-[var(--color-surface)] p-4">
              <div className="flex items-center gap-3">
                <span className="text-subtle">{renderFlowIcon(draft.flow)}</span>
                <div>
                  <h2 className="text-sm font-semibold">{flowCopy?.title}</h2>
                  <p className="hidden text-xs text-subtle sm:block">{flowCopy?.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraft((current) => ({ ...current, flow: null }))}
                className="text-sm text-subtle underline underline-offset-4"
              >
                {t.changeFlow}
              </button>
            </section>

            <section>
              {draft.flow === 'content'
                ? renderContentFlow()
                : draft.flow === 'idea'
                  ? renderIdeaFlow()
                  : renderBugFlow()}
            </section>

            {showErrors && !canReview && (
              <p role="alert" className="rounded-xl border border-red-500 px-4 py-3 text-sm text-red-500">
                {t.required}
              </p>
            )}
            {submissionState === 'error' && (
              <p role="alert" className="rounded-xl border border-red-500 px-4 py-3 text-sm text-red-500">
                {submitError || t.submitError}
              </p>
            )}

            <div className="fixed inset-x-0 bottom-24 z-30 border-y surface-border bg-[var(--color-bg)]/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
              <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                <span className="hidden items-center gap-1.5 text-xs text-subtle sm:flex">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  {t.saved}
                </span>
                <button
                  type="button"
                  onClick={handleReview}
                  className="ml-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-text)] px-5 py-3 text-sm font-medium text-[var(--color-bg)] sm:w-auto"
                >
                  {t.review}
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-review-title"
            className="w-full max-w-lg rounded-t-3xl border surface-border bg-[var(--color-bg)] p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="feedback-review-title" className="text-xl font-semibold">
                    {t.reviewTitle}
                  </h2>
                  <p className="mt-1 text-sm text-subtle">{t.reviewHint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="rounded-lg p-2 surface-hover"
                  aria-label={t.edit}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <dl className="grid gap-4 rounded-2xl border surface-border bg-[var(--color-surface)] p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-subtle">{t.choose}</dt>
                  <dd className="mt-1 text-sm font-medium">{flowCopy?.title}</dd>
                </div>
                {draft.flow === 'content' && (
                  <div>
                    <dt className="text-xs text-subtle">{t.content.typeLabel}</dt>
                    <dd className="mt-1 text-sm font-medium">
                      {draft.content.mode === 'new'
                        ? draft.content.contentName
                        : selectedTargetLabel}
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-xs text-subtle">
                    {draft.flow === 'bug'
                      ? t.bug.details
                      : draft.flow === 'idea'
                        ? t.idea.details
                        : t.content.detailsLabel}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {reviewDescription}
                  </dd>
                </div>
              </dl>
              {submissionState === 'error' && (
                <p role="alert" className="text-sm text-red-500">
                  {submitError || t.submitError}
                </p>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="rounded-xl border surface-border px-4 py-2.5 text-sm"
                >
                  {t.edit}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submissionState === 'submitting'}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-text)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] disabled:opacity-60"
                >
                  {submissionState === 'submitting' ? t.sending : t.submit}
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
