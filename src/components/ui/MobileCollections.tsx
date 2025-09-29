import { useState } from 'react';
import type { ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';
import { classNames } from '../../utils/classNames';

type SelectedCollectionId = 'all' | 'ungrouped' | string;

type CollectionOption = {
  id: string;
  name: string;
  icon: string | null;
  count: number;
};

type AllOption = {
  id: 'all' | 'ungrouped';
  name: string;
  count: number;
  icon?: never;
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
  const [isOpen, setIsOpen] = useState(false);

  const allOptions: Array<CollectionOption | { id: 'all' | 'ungrouped'; name: string; count: number; icon?: string | null }> = [
    { id: 'all' as const, name: copy.collectionsAll, count: allCount },
    { id: 'ungrouped' as const, name: copy.collectionsUngrouped, count: ungroupedCount },
    ...collections,
  ];

  const selectedOption = allOptions.find((option) => option.id === selectedId);

  return (
    <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle">{copy.collectionsTitle}</span>
        <button
          type="button"
          onClick={onToggleEdit}
          className="text-xs font-medium underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          {isEditing ? 'Done' : copy.collectionsEdit}
        </button>
      </div>
      
      <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]/70">
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {selectedOption && 'icon' in selectedOption && selectedOption?.icon && <span>{selectedOption.icon}</span>}
            <span className="text-sm font-medium">{selectedOption?.name}</span>
            <span className="text-xs text-subtle">({selectedOption?.count || 0})</span>
          </div>
          <span aria-hidden className="text-xs text-subtle">{isOpen ? '▾' : '▸'}</span>
        </button>
        
        {isOpen && (
          <div className="border-t border-[var(--color-border)]">
            <ul className="max-h-64 overflow-y-auto p-2 space-y-2">
              {allOptions.map((option) => {
                const active = selectedId === option.id;
                const isBuiltIn = option.id === 'all' || option.id === 'ungrouped';
                
                return (
                  <li key={option.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      className={classNames(
                        'flex-1 rounded-lg border px-3 py-2.5 text-sm flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                        active
                          ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] font-semibold shadow-sm'
                          : 'surface surface-border hover:border-[var(--color-text)]',
                      )}
                      onClick={() => {
                        onSelect(option.id as SelectedCollectionId);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {'icon' in option && option.icon && <span>{option.icon}</span>}
                        <span className="truncate">{option.name}</span>
                      </div>
                      <span className="text-xs opacity-70">({option.count})</span>
                    </button>
                    
                    {isEditing && !isBuiltIn && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onRename(option.id)}
                          className="p-2 text-xs text-subtle hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
                          aria-label={`Rename ${option.name}`}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(option.id)}
                          className="p-2 text-xs text-red-500 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500 rounded"
                          aria-label={`Delete ${option.name}`}
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
              
              {isEditing && (
                <li>
                  <button
                    type="button"
                    onClick={onCreate}
                    className="w-full rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2.5 text-sm text-subtle hover:text-[var(--color-text)] hover:border-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  >
                    + {copy.collectionsNew}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};