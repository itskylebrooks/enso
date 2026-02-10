import type { ReactElement } from 'react';
import { BicepsFlexed, Circle, Dumbbell } from 'lucide-react';
import type { StudyStatus } from '@shared/types';
import { classNames } from '@shared/utils/classNames';

type StudyStatusIconProps = {
  status: StudyStatus;
  className?: string;
};

export const StudyStatusIcon = ({ status, className }: StudyStatusIconProps): ReactElement => {
  if (status === 'practice') {
    return <Dumbbell className={className} aria-hidden />;
  }

  if (status === 'stable') {
    return <BicepsFlexed className={className} aria-hidden />;
  }

  return <Circle className={className} aria-hidden />;
};

type StudyStatusIndicatorProps = {
  status: StudyStatus;
  practiceLabel: string;
  stableLabel: string;
  className?: string;
};

export const StudyStatusIndicator = ({
  status,
  practiceLabel,
  stableLabel,
  className,
}: StudyStatusIndicatorProps): ReactElement | null => {
  if (status === 'none') {
    return null;
  }

  const label = status === 'practice' ? practiceLabel : stableLabel;

  return (
    <span
      className={classNames(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border surface-border bg-[var(--color-surface)] text-subtle',
        className,
      )}
      title={label}
      aria-hidden
    >
      <StudyStatusIcon status={status} className="h-3 w-3" />
    </span>
  );
};

type StudyStatusBadgeProps = {
  status: StudyStatus;
  practiceLabel: string;
  stableLabel: string;
  position: 'top-right' | 'bottom-right';
};

export const StudyStatusBadge = ({
  status,
  practiceLabel,
  stableLabel,
  position,
}: StudyStatusBadgeProps): ReactElement | null => {
  if (status === 'none') {
    return null;
  }

  const label = status === 'practice' ? practiceLabel : stableLabel;

  return (
    <span
      className={classNames(
        'pointer-events-none absolute z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border surface-border bg-[var(--color-surface)]/95 text-subtle shadow-sm',
        position === 'top-right' ? 'right-3 top-3' : 'bottom-3 right-3',
      )}
      title={label}
      aria-hidden
    >
      <StudyStatusIcon status={status} className="h-3.5 w-3.5" />
    </span>
  );
};
