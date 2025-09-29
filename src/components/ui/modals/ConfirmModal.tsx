import { useEffect, useRef, type ReactElement } from 'react'
import { motion } from 'motion/react'

import { Modal } from '@/components/ui/Modal'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

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

export const ConfirmModal = ({ strings, onCancel, onConfirm }: ConfirmModalProps): ReactElement => {
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences()

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

  return (
    <Modal
      isOpen
      onClose={onCancel}
      labelledBy="confirm-modal-title"
      panelClassName="w-full max-w-xs sm:max-w-sm"
    >
      <div className="surface rounded-xl border surface-border p-5 shadow-xl space-y-4">
        <h2 id="confirm-modal-title" className="text-lg font-semibold">
          {strings.title}
        </h2>
        <p className="text-sm leading-relaxed text-subtle">{strings.body}</p>
        <div className="flex justify-end gap-2 pt-2">
          <motion.button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
          >
            {strings.cancelLabel}
          </motion.button>
          <motion.button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border px-4 py-2 btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
          >
            {strings.confirmLabel}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
};
