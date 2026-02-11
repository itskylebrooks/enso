import type { PropsWithChildren, ReactElement } from 'react';
import { classNames } from '../utils/classNames';

type SectionTitleProps = PropsWithChildren<{
  muted?: boolean;
  variant?: 'default' | 'settings';
}>;

export const SectionTitle = ({
  children,
  muted = true,
  variant = 'default',
}: SectionTitleProps): ReactElement => {
  const isSettingsVariant = variant === 'settings';

  return (
    <h3
      className={classNames(
        isSettingsVariant
          ? 'text-sm font-semibold tracking-[0.02em] uppercase'
          : 'text-[0.6875rem] font-medium tracking-[0.18em] uppercase',
        muted && 'text-muted',
      )}
      style={
        isSettingsVariant ? undefined : { fontVariant: 'small-caps', letterSpacing: '0.18em' }
      }
    >
      {children}
    </h3>
  );
};
