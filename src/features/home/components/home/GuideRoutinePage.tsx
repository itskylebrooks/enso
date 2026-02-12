import { useEffect, useMemo, useState, type ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { Exercise, GuideRoutine, Locale } from '@shared/types';
import { loadAllExercises } from '@features/exercises';
import { getExerciseCategoryLabel, getExerciseCategoryStyle } from '@shared/styles/exercises';
import { StepsList } from '@features/technique/components/StepsList';
import { getLocalized, routineCollections } from './routinesData';

type GuideRoutinePageProps = {
  copy: Copy;
  locale: Locale;
  routine: GuideRoutine;
  activeRoutineSlug: string | null;
  onBack: () => void;
  onBackToOverview: () => void;
  onOpenRoutine: (routineSlug: string) => void;
  onOpenExercise: (exerciseSlug: string) => void;
};

export const GuideRoutinePage = ({
  copy,
  locale,
  routine,
  activeRoutineSlug,
  onBack,
  onBackToOverview,
  onOpenRoutine,
  onOpenExercise,
}: GuideRoutinePageProps): ReactElement => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercises = async () => {
      setLoading(true);
      setError(null);
      try {
        const loaded = await loadAllExercises();
        setExercises(loaded);
      } catch (err) {
        console.error('Failed to load exercises for routine page:', err);
        setError('Failed to load exercises');
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  const routineEntry = copy.guidePage.routines.find((entry) => entry.id === routine);
  const routineTitle = routineEntry?.title ?? '';
  const routineDescription = routineEntry?.description ?? '';
  const collection = routineCollections[routine];
  const exerciseBySlug = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.slug, exercise])),
    [exercises],
  );
  const selectedPreset = activeRoutineSlug
    ? collection.presets.find((preset) => preset.id === activeRoutineSlug) ?? null
    : null;

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-0 pb-10">
        <p className="text-sm text-subtle">{copy.loading}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-0 pb-10 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          <span>{copy.backToGuide}</span>
        </button>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  if (activeRoutineSlug && !selectedPreset) {
    return (
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-0 pb-10 space-y-4">
        <button
          type="button"
          onClick={onBackToOverview}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          <span>{copy.guidePage.routineBackToList}</span>
        </button>
        <p className="text-sm text-muted">{copy.guidePage.routineNotFound}</p>
      </section>
    );
  }

  if (!selectedPreset) {
    return (
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-0 pb-10 space-y-6">
        <header className="space-y-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
          >
            <span aria-hidden>←</span>
            <span>{copy.backToGuide}</span>
          </button>
          <h1 className="text-2xl font-semibold leading-tight">{routineTitle}</h1>
          <p className="text-sm text-subtle">{routineDescription}</p>
          <p className="text-sm text-subtle">{copy.guidePage.routineOverviewLead}</p>
        </header>

        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {collection.presets.map((preset) => {
            const title = getLocalized(preset.title, locale);
            const description = getLocalized(preset.description, locale);
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => onOpenRoutine(preset.id)}
                  className="w-full h-full rounded-2xl border surface-border surface p-5 text-left flex flex-col gap-4 card-hover-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold leading-tight">{title}</h2>
                    <p className="text-sm text-muted leading-relaxed">{description}</p>
                  </div>
                  <div className="mt-auto border-t surface-border pt-3 flex items-center justify-between gap-3 text-xs text-subtle">
                    <span>
                      {copy.guidePage.routineDurationLabel}: {preset.estimatedMinutes} min
                    </span>
                    <span>
                      {copy.guidePage.routineExerciseCountLabel}: {preset.exercises.length}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  const presetTitle = getLocalized(selectedPreset.title, locale);
  const presetDescription = getLocalized(selectedPreset.description, locale);

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-0 pb-10 space-y-6">
      <header className="space-y-3">
        <button
          type="button"
          onClick={onBackToOverview}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
        >
          <span aria-hidden>←</span>
          <span>{copy.guidePage.routineBackToList}</span>
        </button>
        <h1 className="text-2xl font-semibold leading-tight">{presetTitle}</h1>
        <p className="text-sm text-subtle">{presetDescription}</p>
        <div className="flex flex-wrap gap-3 text-xs text-subtle">
          <span>
            {copy.guidePage.routineDurationLabel}: {selectedPreset.estimatedMinutes} min
          </span>
          <span>
            {copy.guidePage.routineExerciseCountLabel}: {selectedPreset.exercises.length}
          </span>
        </div>
      </header>

      <div className="space-y-4">
        {selectedPreset.exercises.map((planItem, index) => {
          const exercise = exerciseBySlug.get(planItem.slug);
          const exerciseName = exercise ? exercise.name[locale] || exercise.name.en : planItem.slug;
          const exerciseSummary = exercise
            ? exercise.summary[locale] || exercise.summary.en
            : copy.guidePage.routineMissingExercise;
          const howTo = exercise?.howTo?.[locale] || exercise?.howTo?.en;
          const categoryLabel = exercise
            ? getExerciseCategoryLabel(exercise.category, copy)
            : null;
          const categoryStyle = exercise ? getExerciseCategoryStyle(exercise.category) : null;

          return (
            <article key={`${selectedPreset.id}-${planItem.slug}-${index}`} className="w-full rounded-2xl border surface-border surface p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-subtle">{index + 1}</p>
                  <h2 className="text-lg font-semibold leading-tight">{exerciseName}</h2>
                  <p className="text-sm text-muted leading-relaxed">{exerciseSummary}</p>
                </div>
                {categoryLabel && categoryStyle && (
                  <span
                    className="glossary-tag text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: categoryStyle.backgroundColor,
                      color: categoryStyle.color,
                    }}
                  >
                    {categoryLabel}
                  </span>
                )}
              </div>

              <div className="text-xs text-subtle">
                {copy.guidePage.routineDurationLabel}: {getLocalized(planItem.duration, locale)}
              </div>

              {howTo && howTo.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs uppercase tracking-[0.2em] text-subtle">
                    {copy.guidePage.routineExerciseListHeading}
                  </h3>
                  <StepsList steps={howTo} ariaLabel={`${exerciseName} routine steps`} />
                </section>
              )}

              {exercise && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenExercise(exercise.slug)}
                    className="inline-flex items-center justify-center rounded-lg border surface-border bg-[var(--color-surface)] px-3 py-2 text-sm hover-border-adaptive transition"
                  >
                    {copy.guidePage.routineOpenExerciseCta}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
