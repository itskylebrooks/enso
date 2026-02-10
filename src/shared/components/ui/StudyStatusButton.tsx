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
  popupTrigger?: 'status-change' | 'click';
};

export const StudyStatusButton = ({
  status,
  label,
  onClick,
  popupTextByStatus,
  popupTrigger = 'status-change',
}: StudyStatusButtonProps): ReactElement => {
  const selected = status === 'practice' || status === 'stable';
  const [popupText, setPopupText] = useState<string>('');
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const mounted = useRef(false);
  const pendingClickTrigger = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    if (popupTrigger === 'click' && !pendingClickTrigger.current) {
      return;
    }
    pendingClickTrigger.current = false;

    const nextPopup = popupTextByStatus[status];
    if (!nextPopup) return;
    setPopupText(nextPopup);
    setIsPopupVisible(true);
    const hideTimeout = window.setTimeout(() => setIsPopupVisible(false), 1180);
    return () => window.clearTimeout(hideTimeout);
  }, [popupTextByStatus, status, popupTrigger]);

  return (
    <div className="inline-flex items-center">
      <div
        className={classNames(
          'inline-flex h-8 items-center overflow-hidden rounded-lg border shadow-sm',
          selected
            ? 'btn-contrast'
            : 'btn-tonal',
        )}
      >
        <motion.span
          initial={false}
          animate={isPopupVisible ? { width: 'auto' } : { width: 0 }}
          transition={{
            duration: isPopupVisible ? 0.26 : 0.34,
            ease: isPopupVisible ? [0.22, 1, 0.36, 1] : [0.16, 1, 0.3, 1],
          }}
          className={classNames(
            'pointer-events-none inline-flex h-8 items-center overflow-hidden whitespace-nowrap text-xs leading-none',
            selected ? 'text-[var(--color-bg)]' : 'text-[var(--color-text)]',
          )}
          aria-hidden
        >
          <motion.span
            initial={false}
            animate={{ opacity: isPopupVisible ? 1 : 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="px-2.5 whitespace-nowrap"
          >
            {popupText}
          </motion.span>
        </motion.span>
        <button
          type="button"
          onClick={() => {
            pendingClickTrigger.current = true;
            onClick();
          }}
          title={label}
          aria-label={label}
          aria-pressed={selected}
          className={classNames(
            'inline-flex h-8 w-8 items-center justify-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            selected
              ? 'bg-[var(--color-text)] text-[var(--color-bg)] focus-visible:ring-[var(--color-bg)]'
              : 'text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] focus-visible:ring-[var(--color-text)]',
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
    </div>
  );
};
