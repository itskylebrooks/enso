import { useRef, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useMotionPreferences } from '../ui/motion';

type ConfirmClearModalProps = {
  copy: Copy;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmClearModal = ({
  copy,
  onCancel,
  onConfirm,
}: ConfirmClearModalProps): ReactElement | null => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences();

  useFocusTrap(true, dialogRef, onCancel);

  const content = (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/45"
      variants={overlayMotion.backdrop}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={overlayMotion.transition}
      onClick={onCancel}
      style={
        prefersReducedMotion
          ? undefined
          : { backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }
      }
    >
      <motion.div
        ref={dialogRef}
        className="relative w-full max-w-sm surface rounded-xl border surface-border panel-shadow p-5 space-y-4 no-select"
        variants={overlayMotion.panel}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={overlayMotion.panelTransition}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-clear-title"
      >
        <h2 id="confirm-clear-title" className="text-lg font-semibold">
          {copy.confirmClearTitle}
        </h2>
        <p className="text-sm text-subtle leading-relaxed">{copy.confirmClearBody}</p>
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
            {copy.confirmClearCancel}
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg border border-red-600 bg-red-600 text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
          >
            {copy.confirmClearAction}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
};
