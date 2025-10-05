import { useEffect, useRef, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import { useMotionPreferences } from '../motion';
import useLockBodyScroll from '@shared/hooks/useLockBodyScroll';

type ConfirmStrings = {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
};

type ConfirmModalProps = {
  strings: ConfirmStrings;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmModal = ({ strings, onCancel, onConfirm }: ConfirmModalProps): ReactElement | null => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences();

  useFocusTrap(true, dialogRef, onCancel);

  // Lock body scroll while confirmation modal is open
  useLockBodyScroll(true);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const content = (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/45"
      variants={overlayMotion.backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={overlayMotion.transition}
      onClick={onCancel}
      style={{ backdropFilter: prefersReducedMotion ? 'blur(8px)' : undefined }}
    >
      <motion.div
        ref={dialogRef}
        className="relative w-full max-w-xs sm:max-w-sm surface rounded-xl border surface-border shadow-xl p-5 space-y-4"
        variants={overlayMotion.panel}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={overlayMotion.panelTransition}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold">
          {strings.title}
        </h2>
        <p className="text-sm text-subtle leading-relaxed">{strings.body}</p>
        <div className="flex justify-end gap-2 pt-2">
          <motion.button
            type="button"
            onClick={() => {
              onCancel();
            }}
            className="px-4 py-2 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
          >
            {strings.cancelLabel}
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg border btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
          >
            {strings.confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
};
