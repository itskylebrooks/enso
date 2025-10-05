import type { ReactElement } from 'react';
import { motion, type HTMLMotionProps, useReducedMotion } from 'motion/react';
import { classNames } from '../../utils/classNames';
import { defaultEase } from './motion';
import { CheckIcon } from './icons';

type ChipProps = {
  label: string;
  active?: boolean;
} & HTMLMotionProps<'button'>;

export const Chip = ({ label, active = false, className, disabled, ...buttonProps }: ChipProps): ReactElement => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      disabled={disabled}
      {...buttonProps}
      className={classNames(
        'px-2 py-1 text-xs rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
        active ? 'btn-contrast shadow-sm' : 'btn-tonal',
        disabled && 'chip-passive',
        className,
      )}
      variants={{
        inactive: { opacity: 1 },
        active: prefersReducedMotion ? { opacity: 1 } : { opacity: [0.92, 1] },
      }}
      animate={active ? 'active' : 'inactive'}
      transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.1, ease: defaultEase }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
    >
      <span className="inline-flex items-center gap-1.5">
        {active && <CheckIcon width={16} height={16} aria-hidden="true" />}
        <span>{label}</span>
      </span>
    </motion.button>
  );
};
