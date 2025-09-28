import type { ReactElement } from 'react';
import type { Grade, Locale } from '../../types';
import { gradeLabel } from '../../styles/belts';
import { getGradeStyle } from '../../utils/grades';

type LevelBadgeProps = {
  level: Grade;
  locale: Locale;
};

export const LevelBadge = ({ level, locale }: LevelBadgeProps): ReactElement => {
  const style = getGradeStyle(level);
  const borderColor = style.color === '#FFFFFF' ? 'rgba(255, 255, 255, 0.32)' : 'rgba(0, 0, 0, 0.18)';

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full border font-semibold tracking-tight"
      style={{
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor,
      }}
    >
      {gradeLabel(level, locale)}
    </span>
  );
};
