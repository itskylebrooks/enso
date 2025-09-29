import { useMemo, useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import type {
  BookmarkCollection,
  Collection,
  Locale,
  Progress,
  Technique,
} from '../../types';
import { TechniqueCard } from '../library/TechniqueCard';
import { useMotionPreferences } from '../ui/motion';
import { CollectionsSidebar } from './CollectionsSidebar';
import { AddToCollectionMenu } from './AddToCollectionMenu';
import { NameModal } from '../ui/modals/NameModal';
import { ConfirmModal } from '../ui/modals/ConfirmModal';

type SelectedCollectionId = 'all' | 'ungrouped' | string;

type BookmarksViewProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  progress: Progress[];
  collections: Collection[];
  bookmarkCollections: BookmarkCollection[];
  selectedCollectionId: SelectedCollectionId;
  onSelectCollection: (id: SelectedCollectionId) => void;
  onCreateCollection: (name: string) => string | null;
  onRenameCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
  onAssign: (techniqueId: string, collectionId: string) => void;
  onUnassign: (techniqueId: string, collectionId: string) => void;
  onOpenTechnique: (slug: string) => void;
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
  progress,
  collections,
  bookmarkCollections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onAssign,
  onUnassign,
  onOpenTechnique,
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

  const ungroupedIds = useMemo(() => {
    const set = new Set<string>();
    bookmarkedIds.forEach((techniqueId) => {
      if (!membershipByTechnique.has(techniqueId) || membershipByTechnique.get(techniqueId)?.size === 0) {
        set.add(techniqueId);
      }
    });
    return set;
  }, [bookmarkedIds, membershipByTechnique]);

  const allBookmarkedTechniques = useMemo(
    () => techniques.filter((technique) => bookmarkedIds.has(technique.id)),
    [techniques, bookmarkedIds],
  );

  const selectedCollection = useMemo(
    () => orderedCollections.find((collection) => collection.id === selectedCollectionId) ?? null,
    [orderedCollections, selectedCollectionId],
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

  const visibleTechniques = useMemo(
    () => allBookmarkedTechniques.filter((technique) => visibleTechniqueIds.has(technique.id)),
    [allBookmarkedTechniques, visibleTechniqueIds],
  );

  const collectionCounts = useMemo(() => {
    const map = new Map<string, number>();
    orderedCollections.forEach((collection) => {
      map.set(collection.id, membershipByCollection.get(collection.id)?.size ?? 0);
    });
    return map;
  }, [orderedCollections, membershipByCollection]);

  const allCount = bookmarkedIds.size;
  const ungroupedCount = ungroupedIds.size;

  const viewTitle = useMemo(() => {
    if (selectedCollectionId === 'all') {
      return copy.progress;
    }
    if (selectedCollectionId === 'ungrouped') {
      return `${copy.progress} · ${copy.collectionsUngrouped}`;
    }
    if (selectedCollection) {
      return `${copy.progress} · ${selectedCollection.name}`;
    }
    return copy.progress;
  }, [copy, selectedCollectionId, selectedCollection]);

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
    <div className="grid md:grid-cols-[16rem,1fr] gap-6">
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

      <section className="space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">{viewTitle}</h1>
          <div className="text-sm text-subtle">
            {visibleTechniques.length} / {allCount}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCollectionId}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 min-h-[280px]"
            variants={listMotion.container}
            initial="hidden"
            animate="show"
            exit="hidden"
            layout
          >
            {visibleTechniques.map((technique, index) => {
            const assignedCollections = membershipByTechnique.get(technique.id) ?? new Set<string>();
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
                    onClose={() => setActiveCardId((cur) => (cur === technique.id ? null : cur))}
                  />
                }
              />
            );
          })}

          {visibleTechniques.length === 0 && (
            <motion.div
              className="col-span-full flex items-center justify-center py-6 text-sm text-subtle text-center border border-dashed border-[var(--color-border)] rounded-2xl"
              variants={listMotion.item}
              transition={getItemTransition(0)}
            >
              <div className="max-w-lg px-4">{emptyStateMessage}</div>
            </motion.div>
          )}
        </motion.div>
        </AnimatePresence>
      </section>

      {dialog?.type === 'create' && (
        <NameModal
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
    </div>
  );
};
