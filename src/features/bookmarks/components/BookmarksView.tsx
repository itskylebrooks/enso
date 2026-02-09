import { ExerciseCard } from '@features/exercises/components/ExerciseCard';
import { TechniqueCard } from '@features/technique/components/TechniqueCard';
import { ExpandableFilterBar } from '@shared/components/ui/ExpandableFilterBar';
import { MobileCollections } from '@shared/components/ui/MobileCollections';
import { ConfirmModal } from '@shared/components/ui/modals/ConfirmModal';
import { NameModal } from '@shared/components/ui/modals/NameModal';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { useIncrementalList } from '@shared/hooks/useIncrementalList';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState, type ReactElement } from 'react';
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
  onOpenTechnique: (slug: string, bookmarkedVariant?: TechniqueVariantKey) => void;
  onOpenGlossaryTerm: (slug: string) => void;
  onOpenExercise: (slug: string) => void;
};

type DialogState =
  | { type: 'create' }
  | { type: 'rename'; collection: Collection }
  | { type: 'delete'; collection: Collection }
  | null;

export const BookmarksView = ({
  copy,
  locale,
  techniques,
  exercises,
  glossaryTerms,
  progress,
  glossaryProgress,
  exerciseProgress,
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
  onOpenTechnique,
  onOpenGlossaryTerm,
  onOpenExercise,
}: BookmarksViewProps): ReactElement => {
  const { listMotion, getItemTransition, prefersReducedMotion } = useMotionPreferences();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [editing, setEditing] = useState(false);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

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

  const visibleTechniqueIds = useMemo(() => {
    if (selectedCollectionId === 'all') {
      return new Set(allBookmarkedTechniques.map((technique) => technique.id));
    }

    if (selectedCollectionId === 'ungrouped') {
      return ungroupedIds;
    }

    return membershipByCollection.get(selectedCollectionId) ?? new Set<string>();
  }, [selectedCollectionId, allBookmarkedTechniques, ungroupedIds, membershipByCollection]);

  const visibleGlossaryIds = useMemo(() => {
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
  ]);

  const visibleExerciseIds = useMemo(() => {
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
  ]);

  const visibleTechniques = useMemo(
    () => allBookmarkedTechniques.filter((technique) => visibleTechniqueIds.has(technique.id)),
    [allBookmarkedTechniques, visibleTechniqueIds],
  );

  const visibleGlossaryTerms = useMemo(
    () => allBookmarkedGlossaryTerms.filter((term) => visibleGlossaryIds.has(term.id)),
    [allBookmarkedGlossaryTerms, visibleGlossaryIds],
  );

  const visibleExercises = useMemo(
    () => allBookmarkedExercises.filter((exercise) => visibleExerciseIds.has(exercise.id)),
    [allBookmarkedExercises, visibleExerciseIds],
  );

  // Combined and sorted list of both techniques and glossary terms
  const sortedVisibleItems = useMemo(() => {
    const techniqueItems = visibleTechniques.map((technique) => ({
      type: 'technique' as const,
      item: technique,
      name: technique.name[locale] || technique.name.en,
      id: technique.id,
    }));

    const glossaryItems = visibleGlossaryTerms.map((term) => ({
      type: 'glossary' as const,
      item: term,
      name: term.romaji,
      id: term.id,
    }));

    const exerciseItems = visibleExercises.map((exercise) => ({
      type: 'exercise' as const,
      item: exercise,
      name: exercise.name[locale] || exercise.name.en,
      id: exercise.id,
    }));

    const combined = [...techniqueItems, ...glossaryItems, ...exerciseItems];

    return combined.sort((a, b) =>
      a.name.localeCompare(b.name, locale, {
        sensitivity: 'accent',
        caseFirst: 'upper',
      }),
    );
  }, [visibleTechniques, visibleGlossaryTerms, visibleExercises, locale]);

  const sortedKey = useMemo(
    () => sortedVisibleItems.map((item) => `${item.type}-${item.id}`).join(','),
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

  const collectionCounts = useMemo(() => {
    const map = new Map<string, number>();
    orderedCollections.forEach((collection) => {
      const techniqueCount = membershipByCollection.get(collection.id)?.size ?? 0;
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
  ]);

  const allCount = bookmarkedIds.size + bookmarkedGlossaryIds.size + bookmarkedExerciseIds.size;
  const ungroupedCount = ungroupedIds.size + ungroupedGlossaryIds.size + ungroupedExerciseIds.size;

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

  const handleCollectionSelect = (id: SelectedCollectionId) => {
    onSelectCollection(id);
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
            selectedId={selectedCollectionId}
            allCount={allCount}
            ungroupedCount={ungroupedCount}
            onSelect={handleCollectionSelect}
            onCreate={openCreateModal}
            onRename={openRenameModal}
            onDelete={openDeleteModal}
            isEditing={editing}
            onToggleEdit={() => setEditing((value) => !value)}
          />
        </div>
        <div className="relative">
          <ExpandableFilterBar label={copy.collectionsTitle}>
            <CollectionsSidebar
              copy={copy}
              collections={orderedCollections.map((collection) => ({
                id: collection.id,
                name: collection.name,
                icon: collection.icon ?? null,
                count: collectionCounts.get(collection.id) ?? 0,
              }))}
              selectedId={selectedCollectionId}
              allCount={allCount}
              ungroupedCount={ungroupedCount}
              onSelect={handleCollectionSelect}
              onCreate={openCreateModal}
              onRename={openRenameModal}
              onDelete={openDeleteModal}
              isEditing={editing}
              onToggleEdit={() => setEditing((value) => !value)}
            />
          </ExpandableFilterBar>

          <section>
            <motion.div
              key={`${selectedCollectionId}-${sortedKey}`}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={listMotion.container}
              initial={false}
              animate="show"
            >
              {visibleBookmarks.map((item, index) => {
                if (item.type === 'technique') {
                  const technique = item.item;
                  const assignedCollections =
                    membershipByTechnique.get(technique.id) ?? new Set<string>();
                  return (
                    <TechniqueCard
                      key={technique.id}
                      technique={technique}
                      locale={locale}
                      progress={progressById[technique.id]}
                      copy={copy}
                      onSelect={onOpenTechnique}
                      motionIndex={index}
                      variants={listMotion.item}
                      getTransition={getItemTransition}
                      prefersReducedMotion={prefersReducedMotion}
                      isDimmed={activeCardId === technique.id}
                      summaryLines={3}
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
                          onOpen={() => setActiveCardId(technique.id)}
                          onClose={() =>
                            setActiveCardId((cur) => (cur === technique.id ? null : cur))
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
                        key={`glossary-${term.id}`}
                        term={term}
                        locale={locale}
                        progress={glossaryProgressById[term.id]}
                        copy={copy}
                        onSelect={onOpenGlossaryTerm}
                        motionIndex={index}
                        variants={listMotion.item}
                        getTransition={getItemTransition}
                        prefersReducedMotion={prefersReducedMotion}
                        isDimmed={activeCardId === `glossary-${term.id}`}
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
                            onOpen={() => setActiveCardId(`glossary-${term.id}`)}
                            onClose={() =>
                              setActiveCardId((cur) => (cur === `glossary-${term.id}` ? null : cur))
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
                      key={`exercise-${exercise.id}`}
                      exercise={exercise}
                      copy={copy}
                      locale={locale}
                      onSelect={onOpenExercise}
                      motionIndex={index}
                      variants={listMotion.item}
                      getTransition={getItemTransition}
                      prefersReducedMotion={prefersReducedMotion}
                      isDimmed={activeCardId === `exercise-${exercise.id}`}
                      categoryPlacement="footer"
                      headerAlign="center"
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
                          onOpen={() => setActiveCardId(`exercise-${exercise.id}`)}
                          onClose={() =>
                            setActiveCardId((cur) =>
                              cur === `exercise-${exercise.id}` ? null : cur,
                            )
                          }
                        />
                      }
                    />
                  );
                }
              })}

              {hasMore && (
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
                <motion.div
                  className="col-span-full flex items-center justify-center min-h-[280px] py-6 text-sm text-subtle text-center border border-dashed border-[var(--color-border)] rounded-2xl mt-6 md:mt-0"
                  variants={listMotion.item}
                  transition={getItemTransition(0)}
                >
                  <div className="max-w-lg px-4">{emptyStateMessage}</div>
                </motion.div>
              )}
            </motion.div>
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
