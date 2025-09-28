import type { HTMLAttributes, ReactElement } from 'react';
import { classNames } from '../../utils/classNames';

export const Logo = ({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement => (
  <div
    className={classNames(
      'w-7 h-7 rounded-full border-2 border-contrast flex items-center justify-center transition-colors duration-150',
      className,
    )}
    {...props}
  >
    <div className="w-4 h-4 rounded-full border border-contrast" />
  </div>
);
