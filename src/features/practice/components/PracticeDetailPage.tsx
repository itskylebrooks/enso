import { useEffect, useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { Exercise, Locale, PracticeEquipment, PracticeWhen } from '@shared/types';
import { loadExerciseBySlug } from '../loader';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { MediaPanel } from '@features/technique/components/MediaPanel';
import { StepsList } from '@features/technique/components/StepsList';
import BreathingDot from '@shared/components/ui/BreathingDot';
import { getPracticeCategoryLabel, getPracticeCategoryStyle } from '@shared/styles/practice';
import { getCategoryStyle } from '@shared/styles/glossary';

type PracticeDetailPageProps = {
  slug: string;
  copy: Copy;
  locale: Locale;
  onBack: () => void;
};

const getWhenLabel = (whenToUse: PracticeWhen, copy: Copy): string => {
  const labels: Record<PracticeWhen, string> = {
    'before-training': copy.practiceWhenBeforeTraining,
    'after-training': copy.practiceWhenAfterTraining,
    'rest-day': copy.practiceWhenRestDay,
    anytime: copy.practiceWhenAnytime,
  };
  return labels[whenToUse];
};

const getEquipmentLabel = (equipment: PracticeEquipment, copy: Copy): string => {
  const labels: Record<PracticeEquipment, string> = {
    none: copy.practiceEquipmentNone,
    mat: copy.practiceEquipmentMat,
    'resistance-band': copy.practiceEquipmentResistanceBand,
  };
  return labels[equipment];
};

export const PracticeDetailPage = ({
  slug,
  copy,
  locale,
  onBack,
}: PracticeDetailPageProps): ReactElement => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pageMotion } = useMotionPreferences();

  useEffect(() => {
    const loadExercise = async () => {
      setLoading(true);
      setError(null);

      try {
        const loaded = await loadExerciseBySlug(slug);
        if (loaded) {
          setExercise(loaded);
        } else {
          setError('Exercise not found');
        }
      } catch (err) {
        console.error('Error loading exercise:', err);
        setError('Failed to load exercise');
      } finally {
        setLoading(false);
      }
    };

    loadExercise();
  }, [slug]);

  if (loading) {
    return (
      <div className="loader-center-viewport">
        <BreathingDot label={copy.loading} size={96} />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-4 text-center">
        <p className="text-lg font-semibold">Exercise not found.</p>
        <button type="button" onClick={onBack} className="text-sm underline">
          {copy.backToPractice}
        </button>
      </div>
    );
  }

  const categoryLabel = getPracticeCategoryLabel(exercise.category, copy);
  const categoryStyle = getPracticeCategoryStyle(exercise.category);
  const metadataTagStyle = getCategoryStyle('other');
  const name = exercise.name[locale] || exercise.name.en;
  const summary = exercise.summary[locale] || exercise.summary.en;
  const howTo = exercise.howTo?.[locale] || exercise.howTo?.en;
  const safetyNotes = exercise.safetyNotes?.[locale] || exercise.safetyNotes?.en;
  const aikidoContext = exercise.aikidoContext?.[locale] || exercise.aikidoContext?.en;

  return (
    <motion.main
      className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6"
      variants={pageMotion.variants}
      initial="initial"
      animate="animate"
      transition={pageMotion.transition}
    >
      <header className="z-10 border-b surface-border pb-4 bg-transparent space-y-4">
        <a
          href="/practice"
          aria-label={copy.backToPractice}
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          <span>{copy.backToPractice}</span>
        </a>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold leading-tight">{name}</h1>
          <div className="flex flex-wrap gap-2">
            <span
              className="glossary-tag rounded-lg px-2 py-1 text-xs uppercase tracking-wide"
              style={{
                backgroundColor: categoryStyle.backgroundColor,
                color: categoryStyle.color,
              }}
            >
              {categoryLabel}
            </span>
          </div>
          <p className="text-sm text-muted leading-relaxed">{summary}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-8">
          {aikidoContext && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">
                {copy.practiceAikidoContext}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{aikidoContext}</p>
            </section>
          )}

          {howTo && howTo.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">
                {copy.practiceHowTo}
              </h2>
              <StepsList steps={howTo} ariaLabel={`${name} steps`} />
            </section>
          )}

          {safetyNotes && safetyNotes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">
                {copy.practiceSafetyNotes}
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-muted">
                {safetyNotes.map((note, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-subtle shrink-0">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        <div className="space-y-8">
          {exercise.media && exercise.media.length > 0 && (
            <MediaPanel media={exercise.media} copy={copy} locale={locale} />
          )}

          {exercise.whenToUse && exercise.whenToUse.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">
                {copy.practiceWhenToUse}
              </h2>
              <div className="flex flex-wrap gap-2">
                {exercise.whenToUse.map((item) => (
                  <span
                    key={item}
                    className="glossary-tag rounded-lg px-2 py-1 text-xs uppercase tracking-wide"
                    style={{
                      backgroundColor: metadataTagStyle.backgroundColor,
                      color: metadataTagStyle.color,
                    }}
                  >
                    {getWhenLabel(item, copy)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {exercise.equipment && exercise.equipment.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">
                {copy.practiceEquipment}
              </h2>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.map((item) => (
                  <span
                    key={item}
                    className="glossary-tag rounded-lg px-2 py-1 text-xs uppercase tracking-wide"
                    style={{
                      backgroundColor: metadataTagStyle.backgroundColor,
                      color: metadataTagStyle.color,
                    }}
                  >
                    {getEquipmentLabel(item, copy)}
                  </span>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </motion.main>
  );
};
