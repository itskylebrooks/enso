import { useEffect, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
  const [popupText, setPopupText] = useState<string>('');
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const nextPopup = popupTextByStatus[status];
    if (!nextPopup) return;
    setPopupText(nextPopup);
    setIsPopupVisible(true);
    const hideTimeout = window.setTimeout(() => setIsPopupVisible(false), 1180);
    return () => window.clearTimeout(hideTimeout);
  }, [popupTextByStatus, status]);

  return (
    <div className="inline-flex items-center">
      <motion.span
        initial={false}
        animate={
          isPopupVisible
            ? { scaleX: 1, opacity: 1, marginRight: 0, paddingLeft: 10, paddingRight: 10 }
            : { scaleX: 0, opacity: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }
        }
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className={classNames(
          'pointer-events-none origin-right inline-flex h-8 items-center overflow-hidden whitespace-nowrap rounded-l-lg border border-r-0 text-xs leading-none shadow-sm',
          selected
            ? 'border-[var(--color-text)] bg-[var(--color-text)] text-[var(--color-bg)]'
            : 'surface-border bg-[var(--color-surface-hover)] text-[var(--color-text)]',
        )}
        aria-hidden
      >
        <span className="min-w-0 truncate">{popupText}</span>
      </motion.span>
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        aria-pressed={selected}
        className={classNames(
          'inline-flex h-8 w-8 items-center justify-center border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors duration-150',
          isPopupVisible ? 'rounded-l-none border-l-0 rounded-r-lg' : 'rounded-lg',
          selected
            ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] focus-visible:ring-[var(--color-bg)]'
            : 'btn-tonal surface-hover focus-visible:ring-[var(--color-text)]',
        )}
      >
        <span className="relative flex h-4 w-4 items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={status}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <StudyStatusIcon status={status} className="h-4 w-4" />
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
    </div>
  );
};
