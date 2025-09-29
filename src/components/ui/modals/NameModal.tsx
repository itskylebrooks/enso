import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react';
import { motion } from 'motion/react';
import { useFocusTrap } from '../../../utils/useFocusTrap';
import { useMotionPreferences } from '../motion';
import useLockBodyScroll from '../../../../src/utils/useLockBodyScroll';

export type NameModalStrings = {
  title: string;
  nameLabel: string;
  confirmLabel: string;
  cancelLabel: string;
};

type NameModalProps = {
  strings: NameModalStrings;
  initialName?: string;
  onCancel: () => void;
  onConfirm: (name: string) => void;
};

const maxNameLength = 40;

export const NameModal = ({ strings, initialName = '', onCancel, onConfirm }: NameModalProps): ReactElement => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences();
  const [name, setName] = useState(initialName);

  useFocusTrap(true, dialogRef, onCancel);

  // Lock body scroll while this modal is open
  useLockBodyScroll(true);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed.slice(0, maxNameLength));
  };

  const canSubmit = name.trim().length > 0;

  return (
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
        className="relative w-full max-w-xs sm:max-w-sm surface rounded-xl border surface-border shadow-xl p-5"
        variants={overlayMotion.panel}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={overlayMotion.panelTransition}
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-name-title"
        onClick={(event) => event.stopPropagation()}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <h2 id="collection-name-title" className="text-lg font-semibold">
            {strings.title}
          </h2>
          <label className="text-sm space-y-2">
            <span>{strings.nameLabel}</span>
            <input
              ref={nameInputRef}
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, maxNameLength))}
              className="w-full px-3 py-2 rounded-lg border surface surface-border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              maxLength={maxNameLength}
              required
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <motion.button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              transition={toggleTransition}
            >
              {strings.cancelLabel}
            </motion.button>
            <motion.button
              type="submit"
              className="px-4 py-2 rounded-lg border btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] disabled:opacity-60 disabled:cursor-not-allowed"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              transition={toggleTransition}
              disabled={!canSubmit}
            >
              {strings.confirmLabel}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
