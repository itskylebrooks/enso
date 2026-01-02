import type { SVGAttributes, ReactElement } from 'react';
import { classNames } from '../utils/classNames';

export const Logo = ({ className, ...props }: SVGAttributes<SVGElement>): ReactElement => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    className={classNames('w-7 h-7 transition-colors duration-150', className)}
    {...props}
  >
    {/* Outer circle with border */}
    <circle cx="16" cy="16" r="14" fill="none" className="stroke-current" strokeWidth="2" />
    {/* Inner circle with border */}
    <circle cx="16" cy="16" r="8" fill="none" className="stroke-current" strokeWidth="1" />
  </svg>
);
