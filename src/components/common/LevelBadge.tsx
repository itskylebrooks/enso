import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import type { Grade, Locale } from '../../shared/types';
import { gradeLabel } from '../../shared/styles/belts';
import { getGradeStyle } from '../../shared/utils/grades';

type LevelBadgeProps = {
  level: Grade;
  locale: Locale;
};

export const LevelBadge = ({ level, locale }: LevelBadgeProps): ReactElement => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      const html = document.documentElement;
      setIsDark(html.classList.contains('dark'));
    };

    // Initial check
    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const style = getGradeStyle(level, isDark);
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
