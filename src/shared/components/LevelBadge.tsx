import type { ReactElement } from 'react';
// no hooks required
import type { Grade, Locale } from '@shared/types';
import { gradeLabel, getGradeStyle } from '@shared/styles/belts';

type LevelBadgeProps = {
  level: Grade;
  locale: Locale;
};

export const LevelBadge = ({ level, locale }: LevelBadgeProps): ReactElement => {
  // LevelBadge should always display white text for belt labels per design.
  const style = getGradeStyle(level);
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-semibold tracking-tight border border-transparent"
      style={{
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
      }}
    >
      {gradeLabel(level, locale)}
    </span>
  );
};
