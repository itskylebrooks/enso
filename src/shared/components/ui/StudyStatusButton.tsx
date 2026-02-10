import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { StudyStatus } from '@shared/types';
import { classNames } from '@shared/utils/classNames';
import { StudyStatusIcon } from './StudyStatusIcon';

type StudyStatusButtonProps = {
  status: StudyStatus;
  label: string;
  onClick: () => void;
  popupTextByStatus: Record<StudyStatus, string>;
};

export const StudyStatusButton = ({
  status,
  label,
  onClick,
  popupTextByStatus,
}: StudyStatusButtonProps): ReactElement => {
  const selected = status === 'practice' || status === 'stable';
  const [popup, setPopup] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const nextPopup = popupTextByStatus[status];
    if (!nextPopup) return;
    setPopup(nextPopup);
    const timeout = window.setTimeout(() => setPopup(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [popupTextByStatus, status]);

  return (
    <div className="relative inline-flex items-center">
      {popup && (
        <span className="absolute right-full mr-2 whitespace-nowrap rounded-lg border surface-border bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)] shadow-sm">
          {popup}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        aria-pressed={selected}
        className={classNames(
          'p-2 rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors duration-150',
          selected
            ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] focus-visible:ring-[var(--color-bg)]'
            : 'btn-tonal surface-hover focus-visible:ring-[var(--color-text)]',
        )}
      >
        <span className="flex h-4 w-4 items-center justify-center">
          <StudyStatusIcon status={status} className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
};
