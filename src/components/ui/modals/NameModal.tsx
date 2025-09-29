import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react'
import { motion } from 'motion/react'

import { Modal } from '@/components/ui/Modal'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

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
  const nameInputRef = useRef<HTMLInputElement>(null)
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences()
  const [name, setName] = useState(initialName)

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
    <Modal
      isOpen
      onClose={onCancel}
      labelledBy="collection-name-title"
      panelClassName="w-full max-w-xs sm:max-w-sm"
    >
      <form onSubmit={handleSubmit} className="surface rounded-xl border surface-border p-5 shadow-xl">
        <h2 id="collection-name-title" className="text-lg font-semibold">
          {strings.title}
        </h2>
        <div className={initialName ? 'mt-3' : 'mt-4'}>
          <label className="text-sm space-y-2">
            {!initialName && <span>{strings.nameLabel}</span>}
            <input
              ref={nameInputRef}
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, maxNameLength))}
              className="w-full rounded-lg border surface surface-border px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-text)/0.12]"
              maxLength={maxNameLength}
              required
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
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
            type="submit"
            className="rounded-lg border px-4 py-2 btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
            disabled={!canSubmit}
          >
            {strings.confirmLabel}
          </motion.button>
        </div>
      </form>
    </Modal>
  )
};
