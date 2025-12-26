import type { PropsWithChildren, ReactElement } from 'react';
import { classNames } from '../utils/classNames';

type SectionTitleProps = PropsWithChildren<{
  muted?: boolean;
}>;

export const SectionTitle = ({ children, muted = true }: SectionTitleProps): ReactElement => (
  <h3
    className={classNames(
      'text-[0.6875rem] font-medium tracking-[0.18em] uppercase',
      muted && 'text-muted'
    )}
    style={{ fontVariant: 'small-caps', letterSpacing: '0.18em' }}
  >
    {children}
  </h3>
);
