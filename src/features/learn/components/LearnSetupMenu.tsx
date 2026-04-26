import { useMotionPreferences } from '@shared/components/ui/motion';
import type { Copy } from '@shared/constants/i18n';
import { classNames } from '@shared/utils/classNames';
import { Brain, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import type { LearnFrontMode, LearnOrder, LearnSetupOptions } from '../types';

type LearnSetupMenuProps = {
  copy: Copy;
  cardCount: number;
  disabled?: boolean;
  variant: 'popover' | 'inline' | 'panel';
  onStart: (options: LearnSetupOptions) => void;
};

type ChoiceOption<T extends string> = {
  value: T;
  label: string;
};

type ChoiceRowProps<T extends string> = {
  ariaLabel: string;
  value: T;
  options: [ChoiceOption<T>, ChoiceOption<T>];
  onChange: (value: T) => void;
};

const ChoiceRow = <T extends string>({
  ariaLabel,
  value,
  options,
  onChange,
}: ChoiceRowProps<T>): ReactElement => (
  <div className="grid grid-cols-2 gap-2" role="group" aria-label={ariaLabel}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={classNames(
            'min-w-0 rounded-lg border px-3 py-2 text-center text-sm font-normal leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
            active ? 'btn-contrast' : 'btn-tonal surface-hover',
          )}
          aria-pressed={active}
        >
          <span className="block truncate">{option.label}</span>
        </button>
      );
    })}
  </div>
);

export const LearnSetupMenu = ({
  copy,
  cardCount,
  disabled = false,
  variant,
  onStart,
}: LearnSetupMenuProps): ReactElement => {
  const [open, setOpen] = useState(false);
  const [frontMode, setFrontMode] = useState<LearnFrontMode>('title');
  const [order, setOrder] = useState<LearnOrder>('current');
  const [showTags, setShowTags] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { prefersReducedMotion, collapseMotion } = useMotionPreferences();
  const isDisabled = disabled || cardCount === 0;

  useEffect(() => {
    if (variant !== 'popover' || !open) return;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    window.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, variant]);

  const handleStart = () => {
    if (isDisabled) return;
    onStart({ frontMode, order, showTags });
    if (variant === 'popover') {
      setOpen(false);
    }
  };

  const panelContent = (
    <>
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
          {copy.learnModeLabel}
        </p>
        <ChoiceRow<LearnFrontMode>
          ariaLabel={copy.learnModeLabel}
          value={frontMode}
          onChange={setFrontMode}
          options={[
            { value: 'title', label: copy.learnModeTitleFirst },
            { value: 'definition', label: copy.learnModeDefinitionFirst },
          ]}
        />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-subtle">
          {copy.learnOrderLabel}
        </p>
        <ChoiceRow<LearnOrder>
          ariaLabel={copy.learnOrderLabel}
          value={order}
          onChange={setOrder}
          options={[
            { value: 'current', label: copy.learnOrderCurrent },
            { value: 'random', label: copy.learnOrderRandom },
          ]}
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border surface-border px-3 py-2 text-sm">
        <span>{copy.learnTagsLabel}</span>
        <input
          type="checkbox"
          checked={showTags}
          onChange={(event) => setShowTags(event.target.checked)}
          className="h-4 w-4 accent-[var(--color-text)]"
        />
      </label>

      <button
        type="button"
        onClick={handleStart}
        disabled={isDisabled}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border btn-contrast px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
      >
        <Play className="h-4 w-4" aria-hidden />
        <span>{copy.learnStart}</span>
      </button>
    </>
  );

  if (variant === 'panel') {
    return (
      <div ref={rootRef} className="relative">
        <div className="space-y-4">{panelContent}</div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className={classNames(
            'flex w-full items-center justify-center rounded-lg px-3 py-2 text-base font-semibold leading-tight text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
            isDisabled && 'opacity-60',
          )}
        >
          <span>{copy.learn}</span>
        </button>

        <motion.div
          className="overflow-hidden"
          initial={false}
          animate={open ? 'open' : 'closed'}
          variants={collapseMotion.variants}
          transition={collapseMotion.transition}
        >
          <div className="space-y-4 pt-3">{panelContent}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isDisabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className={classNames(
          'w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
          isDisabled ? 'btn-tonal opacity-60' : 'btn-tonal surface-hover',
        )}
      >
        <Brain className="h-4 w-4" aria-hidden />
        <span>{copy.learn}</span>
        <span className="ml-auto text-xs text-subtle">{cardCount}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="learn-setup-panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-full z-30 mt-2 min-w-72 rounded-xl border surface-border surface p-3 shadow-lg space-y-4"
          >
            {panelContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
