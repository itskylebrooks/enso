import { ExerciseCard } from '@features/exercises/components/ExerciseCard';
import { TechniqueCard } from '@features/technique/components/TechniqueCard';
import { ExpandableFilterBar } from '@shared/components/ui/ExpandableFilterBar';
import { MobileCollections } from '@shared/components/ui/MobileCollections';
import { ConfirmModal } from '@shared/components/ui/modals/ConfirmModal';
import { NameModal } from '@shared/components/ui/modals/NameModal';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { useIncrementalList } from '@shared/hooks/useIncrementalList';
import { createCollectionItemId, normalizeCollectionItemIds } from '@shared/utils/collectionItems';
import {
  getStudyStatusForTechniqueVariant,
  getStudyStatusForCollectionId,
  getStudyStatusForItem,
  hasTechniqueStudyStatus,
  STUDY_PRACTICE_COLLECTION_ID,
  STUDY_STABLE_COLLECTION_ID,
} from '@shared/utils/studyStatus';
import { ENTRY_MODE_ORDER } from '@shared/constants/entryModes';
import {
  fromVariantStorageKey,
  getBookmarkedVariantKeys,
  toVariantStorageKey,
} from '@shared/utils/variantKeys';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type {
  BookmarkCollection,
  Collection,
  Exercise,
  ExerciseBookmarkCollection,
  ExerciseProgress,
  GlossaryBookmarkCollection,
  GlossaryProgress,
  GlossaryTerm,
  Locale,
  Progress,
  StudyStatus,
  StudyStatusMap,
  Technique,
  TechniqueVariantKey,
} from '../../../shared/types';
import { AddToCollectionMenu } from './AddToCollectionMenu';
import { CollectionsSidebar } from './CollectionsSidebar';
import { TermBookmarkCard } from './TermBookmarkCard';

type SelectedCollectionId = 'all' | 'ungrouped' | string;

type BookmarksViewProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  exercises: Exercise[];
  glossaryTerms: GlossaryTerm[];
  progress: Progress[];
  glossaryProgress: GlossaryProgress[];
  exerciseProgress: ExerciseProgress[];
  studyStatus: StudyStatusMap;
  collections: Collection[];
  bookmarkCollections: BookmarkCollection[];
  glossaryBookmarkCollections: GlossaryBookmarkCollection[];
  exerciseBookmarkCollections: ExerciseBookmarkCollection[];
  selectedCollectionId: SelectedCollectionId;
  onSelectCollection: (id: SelectedCollectionId) => void;
  onCreateCollection: (name: string) => string | null;
  onRenameCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
  onAssign: (techniqueId: string, collectionId: string) => void;
  onUnassign: (techniqueId: string, collectionId: string) => void;
  onAssignGlossary: (termId: string, collectionId: string) => void;
  onUnassignGlossary: (termId: string, collectionId: string) => void;
  onAssignExercise: (exerciseId: string, collectionId: string) => void;
  onUnassignExercise: (exerciseId: string, collectionId: string) => void;
  onReorderCollectionItem: (
    collectionId: string,
    itemId: string,
    direction: 'backward' | 'forward',
  ) => void;
  onOpenTechnique: (slug: string, bookmarkedVariant?: TechniqueVariantKey) => void;
  onOpenGlossaryTerm: (slug: string) => void;
  onOpenExercise: (slug: string) => void;
  forceCollectionsSidebarOpen?: boolean;
};

type DialogState =
  | { type: 'create' }
  | { type: 'rename'; collection: Collection }
  | { type: 'delete'; collection: Collection }
  | null;

type VisibleBookmarkItem =
  | {
      type: 'technique';
      item: Technique;
      name: string;
      id: string;
      itemId: string;
      collectionItemId: string;
      studyStatus: StudyStatus;
      cardProgress: Progress;
    }
  | {
      type: 'glossary';
      item: GlossaryTerm;
      name: string;
      id: string;
      itemId: string;
      collectionItemId: string;
    }
  | {
      type: 'exercise';
      item: Exercise;
      name: string;
      id: string;
      itemId: string;
      collectionItemId: string;
    };

type ReorderControlsProps = {
  copy: Copy;
  disableBackward: boolean;
  disableForward: boolean;
  onMoveBackward: () => void;
  onMoveForward: () => void;
};

const ReorderControls = ({
  copy,
  disableBackward,
  disableForward,
  onMoveBackward,
  onMoveForward,
}: ReorderControlsProps): ReactElement => {
  const stopCardClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
  };

  return (
    <div className="w-full flex items-center justify-center">
      <div className="flex items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={(event) => {
            stopCardClick(event);
            onMoveBackward();
          }}
          disabled={disableBackward}
          className="p-2 rounded-lg border btn-tonal surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          aria-label={copy.collectionReorderUp}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            stopCardClick(event);
            onMoveForward();
          }}
          disabled={disableForward}
          className="p-2 rounded-lg border btn-tonal surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          aria-label={copy.collectionReorderDown}
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <button
          type="button"
          onClick={(event) => {
            stopCardClick(event);
            onMoveBackward();
          }}
          disabled={disableBackward}
          className="p-2 rounded-lg border btn-tonal surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          aria-label={copy.collectionReorderLeft}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            stopCardClick(event);
            onMoveForward();
          }}
          disabled={disableForward}
          className="p-2 rounded-lg border btn-tonal surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          aria-label={copy.collectionReorderRight}
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const getFallbackVariantForTechnique = (technique: Technique): TechniqueVariantKey => {
  const firstVersion = technique.versions[0];
  const availableDirections = ENTRY_MODE_ORDER.filter((mode) =>
    Boolean(firstVersion?.stepsByEntry?.[mode]),
  );

  return {
    hanmi: firstVersion?.hanmi ?? 'ai-hanmi',
    direction: (availableDirections[0] ?? 'irimi') as TechniqueVariantKey['direction'],
    weapon:
      technique.weapon && technique.weapon !== 'empty-hand'
        ? (technique.weapon as TechniqueVariantKey['weapon'])
        : 'empty',
    versionId: firstVersion?.id ?? null,
  };
};

export const BookmarksView = ({
  copy,
  locale,
  techniques,
  exercises,
  glossaryTerms,
  progress,
  glossaryProgress,
  exerciseProgress,
  studyStatus,
  collections,
  bookmarkCollections,
  glossaryBookmarkCollections,
  exerciseBookmarkCollections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onAssign,
  onUnassign,
  onAssignGlossary,
  onUnassignGlossary,
  onAssignExercise,
  onUnassignExercise,
  onReorderCollectionItem,
  onOpenTechnique,
  onOpenGlossaryTerm,
  onOpenExercise,
  forceCollectionsSidebarOpen = false,
}: BookmarksViewProps): ReactElement => {
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [editingByCollection, setEditingByCollection] = useState<Record<string, boolean>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement | null>());
  const pendingFocusItemId = useRef<string | null>(null);

  const progressById = useMemo(
    () => Object.fromEntries(progress.map((entry) => [entry.techniqueId, entry])),
    [progress],
  );

  const orderedCollections = useMemo(
    () =>
      [...collections].sort((a, b) =>
        a.name.localeCompare(b.name, locale, {
          sensitivity: 'accent',
          caseFirst: 'upper',
        }),
      ),
    [collections, locale],
  );

  const activeCollection = useMemo(
    () => orderedCollections.find((collection) => collection.id === selectedCollectionId) ?? null,
    [orderedCollections, selectedCollectionId],
  );

  const isUserCollectionSelected = Boolean(activeCollection);
  const isCollectionEditMode = Boolean(
    activeCollection && editingByCollection[activeCollection.id] === true,
  );

  const bookmarkedIds = useMemo(() => {
    const set = new Set<string>();
    progress.forEach((entry) => {
      if (entry.bookmarked) {
        set.add(entry.techniqueId);
      }
    });
    return set;
  }, [progress]);

  const glossaryProgressById = useMemo(
    () => Object.fromEntries(glossaryProgress.map((entry) => [entry.termId, entry])),
    [glossaryProgress],
  );

  const bookmarkedGlossaryIds = useMemo(() => {
    const set = new Set<string>();
    glossaryProgress.forEach((entry) => {
      if (entry.bookmarked) {
        set.add(entry.termId);
      }
    });
    return set;
  }, [glossaryProgress]);

  const bookmarkedExerciseIds = useMemo(() => {
    const set = new Set<string>();
    exerciseProgress.forEach((entry) => {
      if (entry.bookmarked) {
        set.add(entry.exerciseId);
      }
    });
    return set;
  }, [exerciseProgress]);

  const studyTechniqueIdsByStatus = useMemo(() => {
    const practice = new Set<string>();
    const stable = new Set<string>();

    techniques.forEach((technique) => {
      if (hasTechniqueStudyStatus(studyStatus, technique.slug, 'practice')) {
        practice.add(technique.id);
      }
      if (hasTechniqueStudyStatus(studyStatus, technique.slug, 'stable')) {
        stable.add(technique.id);
      }
    });

    return { practice, stable };
  }, [studyStatus, techniques]);

  const studyGlossaryIdsByStatus = useMemo(() => {
    const practice = new Set<string>();
    const stable = new Set<string>();

    glossaryTerms.forEach((term) => {
      const status = getStudyStatusForItem(studyStatus, 'term', term.slug);
      if (status === 'practice') {
        practice.add(term.id);
      } else if (status === 'stable') {
        stable.add(term.id);
      }
    });

    return { practice, stable };
  }, [glossaryTerms, studyStatus]);

  const studyExerciseIdsByStatus = useMemo(() => {
    const practice = new Set<string>();
    const stable = new Set<string>();

    exercises.forEach((exercise) => {
      const status = getStudyStatusForItem(studyStatus, 'exercise', exercise.slug);
      if (status === 'practice') {
        practice.add(exercise.id);
      } else if (status === 'stable') {
        stable.add(exercise.id);
      }
    });

    return { practice, stable };
  }, [exercises, studyStatus]);

  const membershipByTechnique = useMemo(() => {
    const map = new Map<string, Set<string>>();
    bookmarkCollections.forEach((entry) => {
      if (!bookmarkedIds.has(entry.techniqueId)) return;
      const set = map.get(entry.techniqueId) ?? new Set<string>();
      set.add(entry.collectionId);
      map.set(entry.techniqueId, set);
    });
    return map;
  }, [bookmarkCollections, bookmarkedIds]);

  const membershipByCollection = useMemo(() => {
    const map = new Map<string, Set<string>>();
    bookmarkCollections.forEach((entry) => {
      if (!bookmarkedIds.has(entry.techniqueId)) return;
      const set = map.get(entry.collectionId) ?? new Set<string>();
      set.add(entry.techniqueId);
      map.set(entry.collectionId, set);
    });
    return map;
  }, [bookmarkCollections, bookmarkedIds]);

  const glossaryMembershipByTerm = useMemo(() => {
    const map = new Map<string, Set<string>>();
    glossaryBookmarkCollections.forEach((entry) => {
      if (!bookmarkedGlossaryIds.has(entry.termId)) return;
      const set = map.get(entry.termId) ?? new Set<string>();
      set.add(entry.collectionId);
      map.set(entry.termId, set);
    });
    return map;
  }, [glossaryBookmarkCollections, bookmarkedGlossaryIds]);

  const glossaryMembershipByCollection = useMemo(() => {
    const map = new Map<string, Set<string>>();
    glossaryBookmarkCollections.forEach((entry) => {
      if (!bookmarkedGlossaryIds.has(entry.termId)) return;
      const set = map.get(entry.collectionId) ?? new Set<string>();
      set.add(entry.termId);
      map.set(entry.collectionId, set);
    });
    return map;
  }, [glossaryBookmarkCollections, bookmarkedGlossaryIds]);

  const membershipByExercise = useMemo(() => {
    const map = new Map<string, Set<string>>();
    exerciseBookmarkCollections.forEach((entry) => {
      if (!bookmarkedExerciseIds.has(entry.exerciseId)) return;
      const set = map.get(entry.exerciseId) ?? new Set<string>();
      set.add(entry.collectionId);
      map.set(entry.exerciseId, set);
    });
    return map;
  }, [exerciseBookmarkCollections, bookmarkedExerciseIds]);

  const exerciseMembershipByCollection = useMemo(() => {
    const map = new Map<string, Set<string>>();
    exerciseBookmarkCollections.forEach((entry) => {
      if (!bookmarkedExerciseIds.has(entry.exerciseId)) return;
      const set = map.get(entry.collectionId) ?? new Set<string>();
      set.add(entry.exerciseId);
      map.set(entry.collectionId, set);
    });
    return map;
  }, [exerciseBookmarkCollections, bookmarkedExerciseIds]);

  const ungroupedIds = useMemo(() => {
    const set = new Set<string>();
    bookmarkedIds.forEach((techniqueId) => {
      if (
        !membershipByTechnique.has(techniqueId) ||
        membershipByTechnique.get(techniqueId)?.size === 0
      ) {
        set.add(techniqueId);
      }
    });
    return set;
  }, [bookmarkedIds, membershipByTechnique]);

  const ungroupedGlossaryIds = useMemo(() => {
    const set = new Set<string>();
    bookmarkedGlossaryIds.forEach((termId) => {
      if (
        !glossaryMembershipByTerm.has(termId) ||
        glossaryMembershipByTerm.get(termId)?.size === 0
      ) {
        set.add(termId);
      }
    });
    return set;
  }, [bookmarkedGlossaryIds, glossaryMembershipByTerm]);

  const ungroupedExerciseIds = useMemo(() => {
    const set = new Set<string>();
    bookmarkedExerciseIds.forEach((exerciseId) => {
      if (
        !membershipByExercise.has(exerciseId) ||
        membershipByExercise.get(exerciseId)?.size === 0
      ) {
        set.add(exerciseId);
      }
    });
    return set;
  }, [bookmarkedExerciseIds, membershipByExercise]);

  const allBookmarkedTechniques = useMemo(
    () => techniques.filter((technique) => bookmarkedIds.has(technique.id)),
    [techniques, bookmarkedIds],
  );

  const allBookmarkedGlossaryTerms = useMemo(
    () => glossaryTerms.filter((term) => bookmarkedGlossaryIds.has(term.id)),
    [glossaryTerms, bookmarkedGlossaryIds],
  );

  const allBookmarkedExercises = useMemo(
    () => exercises.filter((exercise) => bookmarkedExerciseIds.has(exercise.id)),
    [exercises, bookmarkedExerciseIds],
  );

  const techniqueById = useMemo(
    () => new Map(techniques.map((technique) => [technique.id, technique] as const)),
    [techniques],
  );

  const getBookmarkedTechniqueVariants = useCallback((
    technique: Technique,
    entry: Progress | undefined,
  ): TechniqueVariantKey[] => {
    const parsedFromKeys = getBookmarkedVariantKeys(entry)
      .map((value) => fromVariantStorageKey(value))
      .filter((value): value is TechniqueVariantKey => value !== null);

    if (parsedFromKeys.length > 0) {
      return parsedFromKeys;
    }

    if (entry?.bookmarkedVariant) {
      return [entry.bookmarkedVariant];
    }

    if (entry?.bookmarked) {
      return [getFallbackVariantForTechnique(technique)];
    }

    return [];
  }, []);

  const getTechniqueVariantsByStudyStatus = useCallback((
    technique: Technique,
    status: Exclude<StudyStatus, 'none'>,
  ): TechniqueVariantKey[] => {
    const prefix = `technique:${technique.slug}:`;
    const variantsFromMap = Object.entries(studyStatus)
      .filter(([key, value]) => key.startsWith(prefix) && value.status === status)
      .map(([key, value]) => ({
        variant: fromVariantStorageKey(key.slice(prefix.length)),
        updatedAt: value.updatedAt,
      }))
      .filter((entry): entry is { variant: TechniqueVariantKey; updatedAt: number } =>
        Boolean(entry.variant),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((entry) => entry.variant);

    if (variantsFromMap.length > 0) {
      return variantsFromMap;
    }

    const legacy = studyStatus[`technique:${technique.slug}`];
    if (legacy?.status === status) {
      const progressEntry = progressById[technique.id];
      return [progressEntry?.bookmarkedVariant ?? getFallbackVariantForTechnique(technique)];
    }

    return [];
  }, [progressById, studyStatus]);

  const visibleTechniqueIds = useMemo(() => {
    const studyStatusSelection = getStudyStatusForCollectionId(selectedCollectionId);
    if (studyStatusSelection === 'practice') {
      return studyTechniqueIdsByStatus.practice;
    }

    if (studyStatusSelection === 'stable') {
      return studyTechniqueIdsByStatus.stable;
    }

    if (selectedCollectionId === 'all') {
      return new Set(allBookmarkedTechniques.map((technique) => technique.id));
    }

    if (selectedCollectionId === 'ungrouped') {
      return ungroupedIds;
    }

    return membershipByCollection.get(selectedCollectionId) ?? new Set<string>();
  }, [
    selectedCollectionId,
    allBookmarkedTechniques,
    ungroupedIds,
    membershipByCollection,
    studyTechniqueIdsByStatus,
  ]);

  const visibleGlossaryIds = useMemo(() => {
    const studyStatusSelection = getStudyStatusForCollectionId(selectedCollectionId);
    if (studyStatusSelection === 'practice') {
      return studyGlossaryIdsByStatus.practice;
    }

    if (studyStatusSelection === 'stable') {
      return studyGlossaryIdsByStatus.stable;
    }

    if (selectedCollectionId === 'all') {
      return new Set(allBookmarkedGlossaryTerms.map((term) => term.id));
    }

    if (selectedCollectionId === 'ungrouped') {
      return ungroupedGlossaryIds;
    }

    return glossaryMembershipByCollection.get(selectedCollectionId) ?? new Set<string>();
  }, [
    selectedCollectionId,
    allBookmarkedGlossaryTerms,
    ungroupedGlossaryIds,
    glossaryMembershipByCollection,
    studyGlossaryIdsByStatus,
  ]);

  const visibleExerciseIds = useMemo(() => {
    const studyStatusSelection = getStudyStatusForCollectionId(selectedCollectionId);
    if (studyStatusSelection === 'practice') {
      return studyExerciseIdsByStatus.practice;
    }

    if (studyStatusSelection === 'stable') {
      return studyExerciseIdsByStatus.stable;
    }

    if (selectedCollectionId === 'all') {
      return new Set(allBookmarkedExercises.map((exercise) => exercise.id));
    }

    if (selectedCollectionId === 'ungrouped') {
      return ungroupedExerciseIds;
    }

    return exerciseMembershipByCollection.get(selectedCollectionId) ?? new Set<string>();
  }, [
    selectedCollectionId,
    allBookmarkedExercises,
    ungroupedExerciseIds,
    exerciseMembershipByCollection,
    studyExerciseIdsByStatus,
  ]);

  const visibleTechniques = useMemo(
    () =>
      (getStudyStatusForCollectionId(selectedCollectionId)
        ? techniques
        : allBookmarkedTechniques
      ).filter((technique) => visibleTechniqueIds.has(technique.id)),
    [allBookmarkedTechniques, selectedCollectionId, techniques, visibleTechniqueIds],
  );

  const visibleTechniqueCards = useMemo((): VisibleBookmarkItem[] => {
    const rawStudyStatus = getStudyStatusForCollectionId(selectedCollectionId);
    const selectedStudyStatus =
      rawStudyStatus === 'practice' || rawStudyStatus === 'stable' ? rawStudyStatus : null;

    return visibleTechniques.flatMap((technique) => {
      const progressEntry = progressById[technique.id];
      const variants = selectedStudyStatus
        ? getTechniqueVariantsByStudyStatus(technique, selectedStudyStatus)
        : getBookmarkedTechniqueVariants(technique, progressEntry);

      if (variants.length === 0) {
        return [];
      }

      const variantsToRender =
        isCollectionEditMode && activeCollection ? variants.slice(0, 1) : variants;
      const dedupedKeys = new Set<string>();
      const baseCollectionItemId = createCollectionItemId('technique', technique.id);
      const bookmarkedKeys = getBookmarkedVariantKeys(progressEntry);

      return variantsToRender
        .filter((variant) => {
          const storageKey = toVariantStorageKey(variant);
          if (dedupedKeys.has(storageKey)) return false;
          dedupedKeys.add(storageKey);
          return true;
        })
        .map((variant) => {
          const storageKey = toVariantStorageKey(variant);
          const isBookmarkedVariant =
            bookmarkedKeys.length > 0
              ? bookmarkedKeys.includes(storageKey)
              : Boolean(progressEntry?.bookmarked);

          return {
            type: 'technique' as const,
            item: technique,
            name: technique.name[locale] || technique.name.en,
            id: technique.id,
            itemId: `${baseCollectionItemId}::${storageKey}`,
            collectionItemId: baseCollectionItemId,
            studyStatus:
              selectedStudyStatus ??
              getStudyStatusForTechniqueVariant(studyStatus, technique.slug, variant),
            cardProgress: {
              techniqueId: technique.id,
              bookmarked: isBookmarkedVariant,
              bookmarkedVariant: variant,
              bookmarkedVariantKeys: [storageKey],
              updatedAt: progressEntry?.updatedAt ?? 0,
            },
          };
        });
    });
  }, [
    activeCollection,
    getBookmarkedTechniqueVariants,
    getTechniqueVariantsByStudyStatus,
    isCollectionEditMode,
    locale,
    progressById,
    selectedCollectionId,
    studyStatus,
    visibleTechniques,
  ]);

  const visibleGlossaryTerms = useMemo(
    () =>
      (getStudyStatusForCollectionId(selectedCollectionId)
        ? glossaryTerms
        : allBookmarkedGlossaryTerms
      ).filter((term) => visibleGlossaryIds.has(term.id)),
    [selectedCollectionId, glossaryTerms, allBookmarkedGlossaryTerms, visibleGlossaryIds],
  );

  const visibleExercises = useMemo(
    () =>
      (getStudyStatusForCollectionId(selectedCollectionId)
        ? exercises
        : allBookmarkedExercises
      ).filter((exercise) => visibleExerciseIds.has(exercise.id)),
    [selectedCollectionId, exercises, allBookmarkedExercises, visibleExerciseIds],
  );

  const sortedVisibleItems = useMemo((): VisibleBookmarkItem[] => {
    const techniqueItems: VisibleBookmarkItem[] = visibleTechniqueCards;

    const glossaryItems: VisibleBookmarkItem[] = visibleGlossaryTerms.map((term) => ({
      type: 'glossary',
      item: term,
      name: term.romaji,
      id: term.id,
      itemId: createCollectionItemId('glossary', term.id),
      collectionItemId: createCollectionItemId('glossary', term.id),
    }));

    const exerciseItems: VisibleBookmarkItem[] = visibleExercises.map((exercise) => ({
      type: 'exercise',
      item: exercise,
      name: exercise.name[locale] || exercise.name.en,
      id: exercise.id,
      itemId: createCollectionItemId('exercise', exercise.id),
      collectionItemId: createCollectionItemId('exercise', exercise.id),
    }));

    const combined = [...techniqueItems, ...glossaryItems, ...exerciseItems];
    const alphaSorted = [...combined].sort((a, b) =>
      a.name === b.name
        ? a.itemId.localeCompare(b.itemId)
        : a.name.localeCompare(b.name, locale, {
            sensitivity: 'accent',
            caseFirst: 'upper',
          }),
    );

    if (!activeCollection) {
      return alphaSorted;
    }

    const presentCollectionIds = Array.from(
      new Set(combined.map((entry) => entry.collectionItemId)),
    );
    const normalizedIds = normalizeCollectionItemIds(
      activeCollection.itemIds,
      presentCollectionIds,
      presentCollectionIds,
    );
    const orderedFromCollection: VisibleBookmarkItem[] = [];
    const usedItemIds = new Set<string>();

    normalizedIds.forEach((collectionItemId) => {
      combined
        .filter((entry) => entry.collectionItemId === collectionItemId)
        .forEach((entry) => {
          orderedFromCollection.push(entry);
          usedItemIds.add(entry.itemId);
        });
    });

    const missingItems = alphaSorted.filter((entry) => !usedItemIds.has(entry.itemId));
    return [...orderedFromCollection, ...missingItems];
  }, [activeCollection, locale, visibleExercises, visibleGlossaryTerms, visibleTechniqueCards]);

  const sortedKey = useMemo(
    () => sortedVisibleItems.map((item) => item.itemId).join(','),
    [sortedVisibleItems],
  );

  const {
    visibleItems: visibleBookmarks,
    hasMore,
    loadMore,
  } = useIncrementalList(sortedVisibleItems, {
    pageSize: 18,
    resetKey: `${selectedCollectionId}-${sortedKey}`,
  });

  const renderedBookmarks = isCollectionEditMode ? sortedVisibleItems : visibleBookmarks;
  const itemIndexById = useMemo(
    () => new Map(sortedVisibleItems.map((item, index) => [item.itemId, index] as const)),
    [sortedVisibleItems],
  );
  const reorderItemIdByRenderItemId = useMemo(
    () =>
      new Map(sortedVisibleItems.map((item) => [item.itemId, item.collectionItemId] as const)),
    [sortedVisibleItems],
  );

  useEffect(() => {
    if (!pendingFocusItemId.current) return;
    const itemId = pendingFocusItemId.current;
    pendingFocusItemId.current = null;
    requestAnimationFrame(() => {
      cardRefs.current.get(itemId)?.focus();
    });
  }, [sortedKey]);

  const collectionCounts = useMemo(() => {
    const map = new Map<string, number>();
    orderedCollections.forEach((collection) => {
      const collectionTechniqueIds = membershipByCollection.get(collection.id) ?? new Set<string>();
      const techniqueCount = Array.from(collectionTechniqueIds).reduce((sum, techniqueId) => {
        const technique = techniqueById.get(techniqueId);
        if (!technique) return sum;
        return sum + getBookmarkedTechniqueVariants(technique, progressById[techniqueId]).length;
      }, 0);
      const glossaryCount = glossaryMembershipByCollection.get(collection.id)?.size ?? 0;
      const exerciseCount = exerciseMembershipByCollection.get(collection.id)?.size ?? 0;
      map.set(collection.id, techniqueCount + glossaryCount + exerciseCount);
    });
    return map;
  }, [
    orderedCollections,
    membershipByCollection,
    glossaryMembershipByCollection,
    exerciseMembershipByCollection,
    getBookmarkedTechniqueVariants,
    progressById,
    techniqueById,
  ]);

  const studyCollectionCounts = useMemo(() => {
    const practiceTechniqueCount = techniques.reduce(
      (sum, technique) => sum + getTechniqueVariantsByStudyStatus(technique, 'practice').length,
      0,
    );
    const stableTechniqueCount = techniques.reduce(
      (sum, technique) => sum + getTechniqueVariantsByStudyStatus(technique, 'stable').length,
      0,
    );

    return {
      [STUDY_PRACTICE_COLLECTION_ID]:
        practiceTechniqueCount +
        studyGlossaryIdsByStatus.practice.size +
        studyExerciseIdsByStatus.practice.size,
      [STUDY_STABLE_COLLECTION_ID]:
        stableTechniqueCount + studyGlossaryIdsByStatus.stable.size + studyExerciseIdsByStatus.stable.size,
    };
  }, [getTechniqueVariantsByStudyStatus, techniques, studyExerciseIdsByStatus, studyGlossaryIdsByStatus]);

  const studyCollections = useMemo(
    () => [
      {
        id: STUDY_PRACTICE_COLLECTION_ID,
        name: copy.collectionsStudyPractice,
        icon: null,
        count: studyCollectionCounts[STUDY_PRACTICE_COLLECTION_ID],
      },
      {
        id: STUDY_STABLE_COLLECTION_ID,
        name: copy.collectionsStudyStable,
        icon: null,
        count: studyCollectionCounts[STUDY_STABLE_COLLECTION_ID],
      },
    ],
    [copy.collectionsStudyPractice, copy.collectionsStudyStable, studyCollectionCounts],
  );

  const allBookmarkedTechniqueCount = useMemo(
    () =>
      allBookmarkedTechniques.reduce(
        (sum, technique) =>
          sum + getBookmarkedTechniqueVariants(technique, progressById[technique.id]).length,
        0,
      ),
    [allBookmarkedTechniques, getBookmarkedTechniqueVariants, progressById],
  );

  const ungroupedTechniqueCount = useMemo(
    () =>
      Array.from(ungroupedIds).reduce((sum, techniqueId) => {
        const technique = techniqueById.get(techniqueId);
        if (!technique) return sum;
        return sum + getBookmarkedTechniqueVariants(technique, progressById[techniqueId]).length;
      }, 0),
    [getBookmarkedTechniqueVariants, progressById, techniqueById, ungroupedIds],
  );

  const allCount =
    allBookmarkedTechniqueCount + bookmarkedGlossaryIds.size + bookmarkedExerciseIds.size;
  const ungroupedCount =
    ungroupedTechniqueCount + ungroupedGlossaryIds.size + ungroupedExerciseIds.size;

  const emptyStateMessage = useMemo(() => {
    if (selectedCollectionId === 'all') {
      return copy.collectionsEmptyAll;
    }
    if (selectedCollectionId === 'ungrouped') {
      return copy.collectionsEmptyUngrouped;
    }
    return copy.collectionsEmptyCollection;
  }, [copy, selectedCollectionId]);

  const openCreateModal = () => setDialog({ type: 'create' });
  const openRenameModal = (collectionId: string) => {
    const collection = orderedCollections.find((entry) => entry.id === collectionId);
    if (collection) {
      setDialog({ type: 'rename', collection });
    }
  };
  const openDeleteModal = (collectionId: string) => {
    const collection = orderedCollections.find((entry) => entry.id === collectionId);
    if (collection) {
      setDialog({ type: 'delete', collection });
    }
  };

  const closeDialog = () => setDialog(null);

  const setCardRef = (itemId: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(itemId, element);
      return;
    }
    cardRefs.current.delete(itemId);
  };

  const handleCollectionSelect = (id: SelectedCollectionId) => {
    onSelectCollection(id);
  };

  const handleToggleEdit = () => {
    if (!activeCollection) return;
    setEditingByCollection((previous) => ({
      ...previous,
      [activeCollection.id]: !previous[activeCollection.id],
    }));
  };

  const moveItem = (itemId: string, direction: 'backward' | 'forward') => {
    if (!activeCollection || !isCollectionEditMode) return;
    const index = itemIndexById.get(itemId);
    if (index == null) return;
    const reorderItemId = reorderItemIdByRenderItemId.get(itemId) ?? itemId;
    const isOutOfBounds =
      (direction === 'backward' && index <= 0) ||
      (direction === 'forward' && index >= sortedVisibleItems.length - 1);
    if (isOutOfBounds) return;

    pendingFocusItemId.current = itemId;
    onReorderCollectionItem(activeCollection.id, reorderItemId, direction);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, itemId: string) => {
    if (!isCollectionEditMode) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveItem(itemId, 'backward');
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveItem(itemId, 'forward');
    }
  };

  const handleCreate = (name: string) => {
    const newId = onCreateCollection(name);
    closeDialog();
    if (newId) {
      handleCollectionSelect(newId);
    }
  };

  const handleRename = (id: string, name: string) => {
    onRenameCollection(id, name);
    closeDialog();
  };

  const handleDelete = (id: string) => {
    onDeleteCollection(id);
    setEditingByCollection((previous) => {
      if (!(id in previous)) return previous;
      const next = { ...previous };
      delete next[id];
      return next;
    });
    closeDialog();
    if (selectedCollectionId === id) {
      handleCollectionSelect('all');
    }
  };

  return (
    <>
      <div className="no-select space-y-4 lg:space-y-0">
        <div className="lg:hidden">
          <MobileCollections
            copy={copy}
            collections={orderedCollections.map((collection) => ({
              id: collection.id,
              name: collection.name,
              icon: collection.icon ?? null,
              count: collectionCounts.get(collection.id) ?? 0,
            }))}
            studyCollections={studyCollections}
            selectedId={selectedCollectionId}
            allCount={allCount}
            ungroupedCount={ungroupedCount}
            onSelect={handleCollectionSelect}
            onCreate={openCreateModal}
            onRename={openRenameModal}
            onDelete={openDeleteModal}
            isEditing={isCollectionEditMode}
            isEditDisabled={!isUserCollectionSelected}
            onToggleEdit={handleToggleEdit}
            forceOpen={forceCollectionsSidebarOpen}
          />
        </div>
        <div className="relative">
          <ExpandableFilterBar
            label={copy.collectionsTitle}
            tourTargetId="bookmarks-collections-sidebar"
            forceOpen={forceCollectionsSidebarOpen}
          >
            <CollectionsSidebar
              copy={copy}
              collections={orderedCollections.map((collection) => ({
                id: collection.id,
                name: collection.name,
                icon: collection.icon ?? null,
                count: collectionCounts.get(collection.id) ?? 0,
              }))}
              studyCollections={studyCollections}
              selectedId={selectedCollectionId}
              allCount={allCount}
              ungroupedCount={ungroupedCount}
              onSelect={handleCollectionSelect}
              onCreate={openCreateModal}
              onRename={openRenameModal}
              onDelete={openDeleteModal}
              isEditing={isCollectionEditMode}
              isEditDisabled={!isUserCollectionSelected}
              onToggleEdit={handleToggleEdit}
            />
          </ExpandableFilterBar>

          <section>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {renderedBookmarks.map((item, index) => {
                const itemIndex = itemIndexById.get(item.itemId) ?? -1;
                const disableBackward = itemIndex <= 0;
                const disableForward =
                  itemIndex === -1 || itemIndex >= sortedVisibleItems.length - 1;
                const reorderControls =
                  isCollectionEditMode && itemIndex !== -1 ? (
                    <ReorderControls
                      copy={copy}
                      disableBackward={disableBackward}
                      disableForward={disableForward}
                      onMoveBackward={() => moveItem(item.itemId, 'backward')}
                      onMoveForward={() => moveItem(item.itemId, 'forward')}
                    />
                  ) : undefined;

                if (item.type === 'technique') {
                  const technique = item.item;
                  const assignedCollections =
                    membershipByTechnique.get(technique.id) ?? new Set<string>();
                  return (
                    <TechniqueCard
                      key={item.itemId}
                      cardRef={(element) => setCardRef(item.itemId, element)}
                      technique={technique}
                      locale={locale}
                      progress={item.cardProgress}
                      copy={copy}
                      onSelect={onOpenTechnique}
                      studyStatus={item.studyStatus}
                      showJapanese={false}
                      showVariantMeta
                      variantMetaPlacement="footer"
                      showEntryTags={false}
                      headerAlign="center"
                      motionIndex={index}
                      variants={listMotion.item}
                      getTransition={getItemTransition}
                      prefersReducedMotion={prefersReducedMotion}
                      isDimmed={activeCardId === item.itemId}
                      summaryLines={3}
                      summarySlot={reorderControls}
                      onCardKeyDown={(event) => handleCardKeyDown(event, item.itemId)}
                      enableLayoutAnimation={isCollectionEditMode}
                      actionSlot={
                        <AddToCollectionMenu
                          copy={copy}
                          collections={orderedCollections.map((collection) => ({
                            id: collection.id,
                            name: collection.name,
                            icon: collection.icon ?? null,
                            checked: assignedCollections.has(collection.id),
                          }))}
                          onToggle={(collectionId, nextChecked) => {
                            if (nextChecked) {
                              onAssign(technique.id, collectionId);
                            } else {
                              onUnassign(technique.id, collectionId);
                            }
                          }}
                          onCreate={openCreateModal}
                          onOpen={() => setActiveCardId(item.itemId)}
                          onClose={() =>
                            setActiveCardId((cur) => (cur === item.itemId ? null : cur))
                          }
                        />
                      }
                    />
                  );
                } else {
                  if (item.type === 'glossary') {
                    const term = item.item;
                    const assignedCollections =
                      glossaryMembershipByTerm.get(term.id) ?? new Set<string>();
                    return (
                      <TermBookmarkCard
                        key={item.itemId}
                        cardRef={(element) => setCardRef(item.itemId, element)}
                        term={term}
                        locale={locale}
                        progress={glossaryProgressById[term.id]}
                        copy={copy}
                        onSelect={onOpenGlossaryTerm}
                        studyStatus={getStudyStatusForItem(studyStatus, 'term', term.slug)}
                        showJapanese={false}
                        headerAlign="center"
                        motionIndex={index}
                        variants={listMotion.item}
                        getTransition={getItemTransition}
                        prefersReducedMotion={prefersReducedMotion}
                        isDimmed={activeCardId === item.itemId}
                        descriptionSlot={reorderControls}
                        onCardKeyDown={(event) => handleCardKeyDown(event, item.itemId)}
                        enableLayoutAnimation={isCollectionEditMode}
                        actionSlot={
                          <AddToCollectionMenu
                            copy={copy}
                            collections={orderedCollections.map((collection) => ({
                              id: collection.id,
                              name: collection.name,
                              icon: collection.icon ?? null,
                              checked: assignedCollections.has(collection.id),
                            }))}
                            onToggle={(collectionId, nextChecked) => {
                              if (nextChecked) {
                                onAssignGlossary(term.id, collectionId);
                              } else {
                                onUnassignGlossary(term.id, collectionId);
                              }
                            }}
                            onCreate={openCreateModal}
                            onOpen={() => setActiveCardId(item.itemId)}
                            onClose={() =>
                              setActiveCardId((cur) => (cur === item.itemId ? null : cur))
                            }
                          />
                        }
                      />
                    );
                  }

                  const exercise = item.item;
                  const assignedCollections =
                    membershipByExercise.get(exercise.id) ?? new Set<string>();
                  return (
                    <ExerciseCard
                      key={item.itemId}
                      cardRef={(element) => setCardRef(item.itemId, element)}
                      exercise={exercise}
                      copy={copy}
                      locale={locale}
                      studyStatus={getStudyStatusForItem(studyStatus, 'exercise', exercise.slug)}
                      onSelect={onOpenExercise}
                      motionIndex={index}
                      variants={listMotion.item}
                      getTransition={getItemTransition}
                      prefersReducedMotion={prefersReducedMotion}
                      isDimmed={activeCardId === item.itemId}
                      categoryPlacement="footer"
                      headerAlign="center"
                      summarySlot={reorderControls}
                      onCardKeyDown={(event) => handleCardKeyDown(event, item.itemId)}
                      enableLayoutAnimation={isCollectionEditMode}
                      actionSlot={
                        <AddToCollectionMenu
                          copy={copy}
                          collections={orderedCollections.map((collection) => ({
                            id: collection.id,
                            name: collection.name,
                            icon: collection.icon ?? null,
                            checked: assignedCollections.has(collection.id),
                          }))}
                          onToggle={(collectionId, nextChecked) => {
                            if (nextChecked) {
                              onAssignExercise(exercise.id, collectionId);
                            } else {
                              onUnassignExercise(exercise.id, collectionId);
                            }
                          }}
                          onCreate={openCreateModal}
                          onOpen={() => setActiveCardId(item.itemId)}
                          onClose={() =>
                            setActiveCardId((cur) => (cur === item.itemId ? null : cur))
                          }
                        />
                      }
                    />
                  );
                }
              })}

              {hasMore && !isCollectionEditMode && (
                <div className="col-span-full flex justify-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    className="inline-flex items-center justify-center rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
                  >
                    {copy.loadMore}
                  </button>
                </div>
              )}

              {sortedVisibleItems.length === 0 && (
                <div className="col-span-full flex items-center justify-center min-h-[280px] py-6 text-sm text-subtle text-center border border-dashed border-[var(--color-border)] rounded-2xl mt-6 md:mt-0">
                  <div className="max-w-lg px-4">{emptyStateMessage}</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {dialog?.type === 'create' && (
          <NameModal
            key="modal-create"
            strings={{
              title: copy.collectionsNew,
              nameLabel: copy.collectionsNameLabel,
              confirmLabel: copy.collectionsCreateAction,
              cancelLabel: copy.collectionsCancel,
            }}
            onCancel={closeDialog}
            onConfirm={(name) => handleCreate(name)}
          />
        )}

        {dialog?.type === 'rename' && (
          <NameModal
            key="modal-rename"
            strings={{
              title: copy.collectionsRename,
              nameLabel: copy.collectionsNameLabel,
              confirmLabel: copy.collectionsRenameAction,
              cancelLabel: copy.collectionsCancel,
            }}
            initialName={dialog.collection.name}
            onCancel={closeDialog}
            onConfirm={(name) => handleRename(dialog.collection.id, name)}
          />
        )}

        {dialog?.type === 'delete' && (
          <ConfirmModal
            key="modal-delete"
            strings={{
              title: copy.collectionsConfirmDeleteTitle,
              body: copy.collectionsConfirmDeleteBody,
              confirmLabel: copy.collectionsDelete,
              cancelLabel: copy.collectionsCancel,
            }}
            onCancel={closeDialog}
            onConfirm={() => handleDelete(dialog.collection.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
