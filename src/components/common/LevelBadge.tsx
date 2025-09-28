import type { ReactElement } from 'react';
import type { Grade, Locale } from '../../types';
import { gradeColor, gradeLabel } from '../../utils/grades';
import { classNames } from '../../utils/classNames';

type LevelBadgeProps = {
  level: Grade;
  locale: Locale;
};

export const LevelBadge = ({ level, locale }: LevelBadgeProps): ReactElement => (
  <span className={classNames('text-xs px-2 py-0.5 rounded-full border', gradeColor[level], 'border-transparent')}>
    {gradeLabel(level, locale)}
  </span>
);
