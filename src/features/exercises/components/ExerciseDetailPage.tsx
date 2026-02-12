import { useEffect, useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type {
  Collection,
  Exercise,
  ExerciseBookmarkCollection,
  ExerciseProgress,
  Locale,
  PracticeEquipment,
  StudyStatus,
} from '@shared/types';
import { loadExerciseBySlug } from '../loader';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { MediaPanel } from '@features/technique/components/MediaPanel';
import { StepsList } from '@features/technique/components/StepsList';
import BreathingDot from '@shared/components/ui/BreathingDot';
import { getExerciseCategoryLabel, getExerciseCategoryStyle } from '@shared/styles/exercises';
import { getCategoryStyle } from '@shared/styles/terms';
import { AddToCollectionMenu } from '@features/bookmarks/components/AddToCollectionMenu';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { classNames } from '@shared/utils/classNames';
import { NameModal } from '@shared/components/ui/modals/NameModal';
import type { ExerciseFilters } from './ExercisesPage';
import { addRecent } from '@shared/services/recentsService';
import { StudyStatusButton } from '@shared/components/ui/StudyStatusButton';

type ExerciseDetailPageProps = {
  slug: string;
  copy: Copy;
  locale: Locale;
  collections: Collection[];
  exerciseProgress: ExerciseProgress[];
  exerciseBookmarkCollections: ExerciseBookmarkCollection[];
  studyStatus: StudyStatus;
  onToggleStudyStatus: () => void;
  onToggleBookmark: (exerciseId: string, nextBookmarked: boolean) => void;
  onAssignToCollection: (exerciseId: string, collectionId: string) => void;
  onRemoveFromCollection: (exerciseId: string, collectionId: string) => void;
  onCreateCollection: (name: string) => string | null;
  onBack: () => void;
  backLabel?: string;
  onNavigateToExercisesWithFilter?: (filters: ExerciseFilters) => void;
};

const getEquipmentLabel = (equipment: PracticeEquipment, copy: Copy): string => {
  const labels: Record<PracticeEquipment, string> = {
    none: copy.practiceEquipmentNone,
    mat: copy.practiceEquipmentMat,
    'resistance-band': copy.practiceEquipmentResistanceBand,
  };
  return labels[equipment];
};

export const ExerciseDetailPage = ({
  slug,
  copy,
  locale,
  collections,
  exerciseProgress,
  exerciseBookmarkCollections,
  studyStatus,
  onToggleStudyStatus,
  onToggleBookmark,
  onAssignToCollection,
  onRemoveFromCollection,
  onCreateCollection,
  onBack,
  backLabel,
  onNavigateToExercisesWithFilter,
}: ExerciseDetailPageProps): ReactElement => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { pageMotion } = useMotionPreferences();

  useEffect(() => {
    const loadExercise = async () => {
      setLoading(true);
      setError(null);

      try {
        const loaded = await loadExerciseBySlug(slug);
        if (loaded) {
          addRecent({ type: 'exercise', slug: loaded.slug });
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
      <div className="max-w-5xl mx-auto px-6 pt-0 pb-10 space-y-4 text-center">
        <p className="text-lg font-semibold">Exercise not found.</p>
        <button type="button" onClick={onBack} className="text-sm underline">
          {backLabel ?? copy.backToPractice}
        </button>
      </div>
    );
  }

  const categoryLabel = getExerciseCategoryLabel(exercise.category, copy);
  const categoryStyle = getExerciseCategoryStyle(exercise.category);
  const metadataTagStyle = getCategoryStyle('other');
  const name = exercise.name[locale] || exercise.name.en;
  const summary = exercise.summary[locale] || exercise.summary.en;
  const howTo = exercise.howTo?.[locale] || exercise.howTo?.en;
  const safetyNotes = exercise.safetyNotes?.[locale] || exercise.safetyNotes?.en;
  const aikidoContext = exercise.aikidoContext?.[locale] || exercise.aikidoContext?.en;
  const progressEntry = exerciseProgress.find((entry) => entry.exerciseId === exercise.id) ?? null;
  const isBookmarked = Boolean(progressEntry?.bookmarked);
  const exerciseCollectionIds = new Set(
    exerciseBookmarkCollections
      .filter((entry) => entry.exerciseId === exercise.id)
      .map((entry) => entry.collectionId),
  );
  const collectionOptions = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    icon: collection.icon ?? null,
    checked: exerciseCollectionIds.has(collection.id),
  }));
  const openCreateDialog = () => setCreateOpen(true);
  const closeCreateDialog = () => setCreateOpen(false);
  const handleCreate = (name: string) => {
    const newId = onCreateCollection(name);
    closeCreateDialog();
    if (newId) {
      onAssignToCollection(exercise.id, newId);
    }
  };
  const studyLabel =
    studyStatus === 'none'
      ? copy.studyMarkPractice
      : studyStatus === 'practice'
        ? copy.studyMarkStable
        : copy.studyClearStatus;

  return (
    <motion.main
      className="mx-auto max-w-4xl px-4 sm:px-6 pt-0 pb-6 space-y-6"
      variants={pageMotion.variants}
      initial="initial"
      animate="animate"
      transition={pageMotion.transition}
    >
      <header className="z-10 border-b surface-border pb-4 bg-transparent space-y-4">
        <a
          href="/exercises"
          aria-label={backLabel ?? copy.backToPractice}
          onClick={(event) => {
            event.preventDefault();
            onBack();
          }}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
        >
          <span aria-hidden>←</span>
          <span>{backLabel ?? copy.backToPractice}</span>
        </a>
        <div className="space-y-3">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2 sm:col-start-1 sm:row-start-1">
              <h1 className="text-3xl font-semibold leading-tight">{name}</h1>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToExercisesWithFilter?.({
                      categories: [exercise.category],
                      equipment: [],
                    })
                  }
                  aria-label={`Show ${categoryLabel} in exercises`}
                  className="glossary-tag glossary-tag--interactive rounded-lg px-2 py-1 text-xs uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  style={{
                    backgroundColor: categoryStyle.backgroundColor,
                    color: categoryStyle.color,
                  }}
                >
                  {categoryLabel}
                </button>
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:col-start-2 sm:row-start-1 sm:w-auto sm:justify-end sm:self-start">
              <StudyStatusButton
                status={studyStatus}
                label={studyLabel}
                onClick={onToggleStudyStatus}
                popupTrigger="click"
                popupTextByStatus={{
                  none: copy.toastStudyCleared,
                  practice: copy.toastStudyPractice,
                  stable: copy.toastStudyStable,
                }}
              />
              <AddToCollectionMenu
                copy={copy}
                collections={collectionOptions}
                onToggle={(collectionId, nextChecked) => {
                  if (nextChecked) {
                    onAssignToCollection(exercise.id, collectionId);
                  } else {
                    onRemoveFromCollection(exercise.id, collectionId);
                  }
                }}
                onCreate={openCreateDialog}
                size="header"
              />
              <div className="inline-flex rounded-lg border surface-border overflow-hidden">
                <motion.button
                  type="button"
                  onClick={() => onToggleBookmark(exercise.id, !isBookmarked)}
                  aria-pressed={isBookmarked}
                  aria-label={copy.bookmark}
                  transition={pageMotion.transition}
                  className={classNames(
                    'px-3 py-2 text-sm inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-colors duration-150',
                    isBookmarked
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  <motion.span
                    aria-hidden
                    className="w-5 h-5 flex items-center justify-center md:h-4 md:w-4"
                    animate={
                      isBookmarked ? { scale: 1, opacity: 1 } : { scale: 0.86, opacity: 0.85 }
                    }
                    transition={pageMotion.transition}
                  >
                    {isBookmarked ? (
                      <BookmarkCheck className="w-5 h-5 md:h-4 md:w-4" />
                    ) : (
                      <Bookmark className="w-5 h-5 md:h-4 md:w-4" />
                    )}
                  </motion.span>
                </motion.button>
              </div>
            </div>
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

          {exercise.equipment && exercise.equipment.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-subtle">
                {copy.practiceEquipment}
              </h2>
              <div className="flex flex-wrap gap-2">
                {exercise.equipment.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      onNavigateToExercisesWithFilter?.({
                        categories: [],
                        equipment: [item],
                      })
                    }
                    className="glossary-tag glossary-tag--interactive rounded-lg px-2 py-1 text-xs uppercase tracking-wide focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                    style={{
                      backgroundColor: metadataTagStyle.backgroundColor,
                      color: metadataTagStyle.color,
                    }}
                  >
                    {getEquipmentLabel(item, copy)}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {createOpen && (
        <NameModal
          key="exercises-collection-create"
          strings={{
            title: copy.collectionsNew,
            nameLabel: copy.collectionsNameLabel,
            confirmLabel: copy.collectionsCreateAction,
            cancelLabel: copy.collectionsCancel,
          }}
          onCancel={closeCreateDialog}
          onConfirm={handleCreate}
        />
      )}
    </motion.main>
  );
};
