import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import { CheckIcon, FolderPlusIcon, FolderCheckIcon, PlusIcon } from '../common/icons';
import { useMotionPreferences } from '../ui/motion';

type CollectionOption = {
  id: string;
  name: string;
  icon: string | null;
  checked: boolean;
};

type AddToCollectionMenuProps = {
  copy: Copy;
  collections: CollectionOption[];
  onToggle: (collectionId: string, nextChecked: boolean) => void;
  onCreate?: () => void;
};

export const AddToCollectionMenu = ({ copy, collections, onToggle, onCreate }: AddToCollectionMenuProps): ReactElement => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useMotionPreferences();

  const hasCollections = collections.length > 0;
  const hasCheckedCollections = collections.some(collection => collection.checked);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const firstFocusable = menuRef.current?.querySelector<HTMLButtonElement>('button');
    firstFocusable?.focus();
  }, [open]);

  const menuVariants = useMemo(
    () => ({
      initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 8 },
      animate: prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
      exit: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 },
    }),
    [prefersReducedMotion],
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={hasCheckedCollections 
          ? "p-2 rounded-lg border bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-bg)]"
          : "p-2 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        }
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={copy.collectionsAddTo}
      >
        {hasCheckedCollections ? (
          <FolderCheckIcon className="w-4 h-4" />
        ) : (
          <FolderPlusIcon className="w-4 h-4" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label={copy.collectionsAddTo}
            variants={menuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 mt-1 w-56 rounded-lg border surface surface-border shadow-lg z-30 overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            {hasCollections ? (
              <ul className="max-h-64 overflow-y-auto py-1">
                {collections.map((collection) => (
                  <li key={collection.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-sm flex items-center justify-between gap-2 text-left hover:bg-[var(--color-surface-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                      role="menuitemcheckbox"
                      aria-checked={collection.checked}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onToggle(collection.id, !collection.checked);
                      }}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {collection.icon && <span aria-hidden="true">{collection.icon}</span>}
                        <span className="truncate">{collection.name}</span>
                      </span>
                      {collection.checked && <CheckIcon className="w-4 h-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-2 text-sm text-subtle">
                <p>{copy.collectionsNone}</p>
                {onCreate && (
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setOpen(false);
                      onCreate();
                    }}
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>{copy.collectionsNew}</span>
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
