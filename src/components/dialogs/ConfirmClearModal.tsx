import { useEffect, useRef, useState, type ReactElement } from 'react'
import { motion } from 'motion/react'

import { Modal } from '@/components/ui/Modal'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import type { Copy } from '@/lib/i18n/copy'

type ConfirmClearModalProps = {
  copy: Copy;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmClearModal = ({ copy, onCancel, onConfirm }: ConfirmClearModalProps): ReactElement => {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { overlayMotion, toggleTransition, prefersReducedMotion } = useMotionPreferences()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const canConfirm = value === 'CLEAR';

  return (
    <Modal
      isOpen
      onClose={onCancel}
      labelledBy="confirm-clear-title"
      panelClassName="w-full max-w-xs sm:max-w-sm"
    >
      <div className="surface rounded-xl border surface-border p-5 shadow-xl space-y-4">
        <h2 id="confirm-clear-title" className="text-lg font-semibold">
          {copy.confirmClearTitle}
        </h2>
        <p className="text-sm text-subtle leading-relaxed">{copy.confirmClearBody}</p>
        <label className="text-left text-sm space-y-2">
          <span>{copy.confirmClearLabel}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            className="w-full rounded-lg border surface surface-border px-3 py-2 uppercase tracking-[0.3em] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            autoComplete="off"
            aria-required="true"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <motion.button
            type="button"
            onClick={() => {
              setValue('')
              onCancel()
            }}
            className="rounded-lg border px-4 py-2 btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
          >
            {copy.confirmClearCancel}
          </motion.button>
          <motion.button
            type="button"
            onClick={() => {
              if (canConfirm) {
                onConfirm()
                setValue('')
              }
            }}
            className="rounded-lg border px-4 py-2 btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            transition={toggleTransition}
            disabled={!canConfirm}
          >
            {copy.confirmClearAction}
          </motion.button>
        </div>
      </div>
    </Modal>
  )
};
