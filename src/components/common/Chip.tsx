import type { ButtonHTMLAttributes } from 'react';
import { classNames } from '../../utils/classNames';

type ChipProps = {
  label: string;
  active?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Chip = ({ label, active = false, className, disabled, ...buttonProps }: ChipProps): JSX.Element => (
  <button
    type="button"
    disabled={disabled}
    {...buttonProps}
    className={classNames(
      'px-2 py-1 text-xs rounded-full border transition',
      active ? 'btn-contrast' : 'btn-tonal',
      disabled && 'chip-passive',
      className,
    )}
  >
    {label}
  </button>
);
