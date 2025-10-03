import type { ReactElement } from 'react';
import { AnimatePresence, motion, LayoutGroup } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import { EditIcon, PencilIcon, PlusIcon, TrashIcon } from './icons';
import { useMotionPreferences } from './motion';

type SelectedCollectionId = 'all' | 'ungrouped' | string;

type CollectionOption = {
  id: string;
  name: string;
  icon: string | null;
  count: number;
};



type MobileCollectionsProps = {
  copy: Copy;
  collections: CollectionOption[];
  selectedId: SelectedCollectionId;
  allCount: number;
  ungroupedCount: number;
  onSelect: (id: SelectedCollectionId) => void;
  onCreate: () => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
};

export const MobileCollections = ({
  copy,
  collections,
  selectedId,
  allCount,
  ungroupedCount,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  isEditing,
  onToggleEdit,
}: MobileCollectionsProps): ReactElement => {
  const { listMotion, prefersReducedMotion } = useMotionPreferences();

  return (
    <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4 space-y-4" aria-label={copy.collectionsTitle}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-subtle">{copy.collectionsTitle}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="p-2 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            aria-label={copy.collectionsNew}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleEdit}
            className={`p-2 rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] ${
              isEditing ? 'btn-contrast' : 'btn-tonal surface-hover'
            }`}
            aria-label={copy.collectionsEdit}
            aria-pressed={isEditing}
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="space-y-4" aria-label={copy.collectionsTitle}>
        <ul className="space-y-1 text-sm">
          <li>
            <SidebarButton
              active={selectedId === 'all'}
              label={copy.collectionsAll}
              count={allCount}
              onClick={() => onSelect('all')}
            />
          </li>
          <li>
            <SidebarButton
              active={selectedId === 'ungrouped'}
              label={copy.collectionsUngrouped}
              count={ungroupedCount}
              onClick={() => onSelect('ungrouped')}
            />
          </li>
        </ul>

        <LayoutGroup>
          <AnimatePresence initial={false}>
            <motion.ul
              className="space-y-1 text-sm"
              variants={listMotion.container}
              initial="hidden"
              animate="show"
              layout
            >
              {collections.map((collection) => (
                <motion.li key={collection.id} layout variants={listMotion.item} transition={prefersReducedMotion ? { duration: 0.05 } : undefined}>
                  <div className="relative flex items-center gap-2">
                    <motion.div 
                      className="flex-1 min-w-0"
                      animate={{ 
                        paddingRight: isEditing ? "4.5rem" : "0rem" 
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      <SidebarButton
                        active={selectedId === collection.id}
                        label={collection.name}
                        icon={collection.icon}
                        count={collection.count}
                        onClick={() => onSelect(collection.id)}
                      />
                    </motion.div>
                    <AnimatePresence initial={false}>
                      {isEditing && (
                        <motion.div
                          className="absolute right-0 flex items-center gap-1"
                          initial={{ opacity: 0, x: 8, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          key={`edit-actions-${collection.id}`}
                        >
                          <IconButton label={copy.collectionsRename} onClick={() => onRename(collection.id)}>
                            <EditIcon className="w-4 h-4" />
                          </IconButton>
                          <IconButton label={copy.collectionsDelete} onClick={() => onDelete(collection.id)}>
                            <TrashIcon className="w-4 h-4" />
                          </IconButton>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.li>
              ))}
              {collections.length === 0 && (
                <motion.li
                  className="text-xs text-subtle px-2 py-1"
                  variants={listMotion.item}
                  transition={prefersReducedMotion ? { duration: 0.05 } : undefined}
                >
                  {copy.collectionsNone}
                </motion.li>
              )}
            </motion.ul>
          </AnimatePresence>
        </LayoutGroup>
      </nav>
    </div>
  );
};

type SidebarButtonProps = {
  active: boolean;
  label: string;
  icon?: string | null;
  count: number;
  onClick: () => void;
};

const SidebarButton = ({ active, label, icon, count, onClick }: SidebarButtonProps): ReactElement => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left ${
      active ? 'btn-contrast' : 'btn-tonal surface-hover'
    }`}
    aria-pressed={active}
    aria-current={active ? 'page' : undefined}
  >
    <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
      {icon && <span aria-hidden="true" className="flex-shrink-0">{icon}</span>}
      <span className="truncate min-w-0">{label}</span>
    </span>
    <span className="text-xs font-medium text-subtle flex-shrink-0">{count}</span>
  </button>
);

type IconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactElement;
};

const IconButton = ({ label, onClick, children }: IconButtonProps): ReactElement => (
  <button
    type="button"
    onClick={onClick}
    className="p-1.5 rounded-md border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
    aria-label={label}
  >
    {children}
  </button>
);