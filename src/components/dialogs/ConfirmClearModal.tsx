import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';
import { useFocusTrap } from '../../utils/useFocusTrap';

type ConfirmClearModalProps = {
  copy: Copy;
  onCancel: () => void;
  onConfirm: () => void;
};

export const ConfirmClearModal = ({ copy, onCancel, onConfirm }: ConfirmClearModalProps): ReactElement => {
  const [value, setValue] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useFocusTrap(true, dialogRef, onCancel);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canConfirm = value === 'CLEAR';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="w-full max-w-sm surface rounded-xl border surface-border shadow-xl p-5 space-y-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-clear-title"
      >
        <h2 id="confirm-clear-title" className="text-lg font-semibold">
          {copy.confirmClearTitle}
        </h2>
        <p className="text-sm text-subtle leading-relaxed">
          {copy.confirmClearBody}
        </p>
        <label className="text-sm text-left space-y-2">
          <span>{copy.confirmClearLabel}</span>
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            className="w-full px-3 py-2 rounded-lg border surface surface-border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] uppercase tracking-[0.3em]"
            autoComplete="off"
            aria-required="true"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setValue('');
              onCancel();
            }}
            className="px-4 py-2 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          >
            {copy.confirmClearCancel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (canConfirm) {
                onConfirm();
                setValue('');
              }
            }}
            className="px-4 py-2 rounded-lg border btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!canConfirm}
          >
            {copy.confirmClearAction}
          </button>
        </div>
      </div>
    </div>
  );
};
