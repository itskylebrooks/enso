import type { ReactElement, ReactNode } from 'react';
import { motion } from 'motion/react';
import { useMotionPreferences } from '../../../components/ui/motion';
import { classNames } from '../../utils/classNames';

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
  tooltip?: string;
};

export type SegmentedProps<T extends string = string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
  className?: string;
};

export const Segmented = <T extends string = string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
}: SegmentedProps<T>): ReactElement => {
  const { toggleTransition, prefersReducedMotion } = useMotionPreferences();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={classNames(
        'inline-flex flex-wrap gap-2',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const isDisabled = option.disabled;

        return (
          <motion.button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            title={option.tooltip}
            onClick={() => {
              if (!isDisabled) {
                onChange(option.value);
              }
            }}
            transition={toggleTransition}
            whileTap={prefersReducedMotion || isDisabled ? undefined : { scale: 0.96 }}
            className={classNames(
              'px-3 py-1.5 text-sm rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              isSelected
                ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                : isDisabled
                ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-white/10 cursor-not-allowed opacity-50'
                : 'bg-[var(--color-surface)] text-subtle border-white/10 hover:text-[var(--color-text)]'
            )}
          >
            <motion.span
              className="font-medium"
              animate={isSelected ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0.8 }}
              transition={toggleTransition}
            >
              {option.label}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
};

// Export a typed version for EntryMode specifically
export type EntrySegmentedProps = Omit<SegmentedProps<'omote' | 'ura'>, 'options'> & {
  options: SegmentedOption<'omote' | 'ura'>[];
};