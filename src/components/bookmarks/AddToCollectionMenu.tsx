import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

import type { Copy } from '@/lib/i18n/copy'
import { CheckIcon, FolderPlusIcon, FolderCheckIcon, PlusIcon } from '@/components/ui/icons'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'

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
  onOpen?: () => void;
  onClose?: () => void;
};

export const AddToCollectionMenu = ({ copy, collections, onToggle, onCreate, onOpen, onClose }: AddToCollectionMenuProps): ReactElement => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useMotionPreferences();

  // Lock body scroll on mobile when menu is open
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  useLockBodyScroll(open && isMobile);

  const hasCollections = collections.length > 0;
  const hasCheckedCollections = collections.some(collection => collection.checked);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 224; // 224px = w-56
    const viewportWidth = window.innerWidth;
    
    // For mobile, center the menu on the card/button
    // For desktop, position to the right of the button
    let left;
    if (viewportWidth <= 768) { // Mobile breakpoint
      // Center the menu horizontally on the trigger
      left = rect.left + (rect.width / 2) - (menuWidth / 2);
      // Ensure it doesn't go off-screen
      left = Math.max(8, Math.min(left, viewportWidth - menuWidth - 8));
    } else {
      // Desktop: position to the right
      left = rect.right - menuWidth;
    }
    
    setPosition({
      top: rect.bottom + 4,
      left: left
    });
  };

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

    const handleScroll = () => {
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('scroll', handleScroll, true); // Use capture to catch all scroll events
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  // notify parent when open state changes
  useEffect(() => {
    if (open) {
      onOpen?.();
    } else {
      onClose?.();
    }
    // only want to run when open changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          if (!open) {
            updatePosition();
          }
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
      {open && createPortal(
        <AnimatePresence>
          <motion.div
            ref={menuRef}
            role="menu"
            aria-label={copy.collectionsAddTo}
            variants={menuVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed w-56 rounded-lg border surface surface-border shadow-lg z-50 overflow-hidden"
            style={{ 
              top: position.top, 
              left: position.left
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {hasCollections ? (
              <ul className="py-1 max-h-32 overflow-y-auto">
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
                        setOpen(false);
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
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
