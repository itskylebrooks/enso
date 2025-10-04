import type { KeyboardEvent, ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { GlossaryTerm, GlossaryProgress } from '../../../shared/types';
import type { Locale } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';
import { getCategoryStyle, getCategoryLabel } from '../../../shared/styles/glossary';
import { getInitialThemeState } from '@shared/utils/theme';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

type GlossaryBookmarkCardProps = {
  term: GlossaryTerm;
  locale: Locale;
  progress?: GlossaryProgress | null;
  copy: Copy;
  onSelect: (slug: string) => void;
  motionIndex: number;
  isDimmed?: boolean;
  actionSlot?: ReactElement;
} & MotionProps;



export const GlossaryBookmarkCard = ({
  term,
  locale,
  copy,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  // prefersReducedMotion removed (no hover motion)
  isDimmed = false,
  actionSlot,
}: GlossaryBookmarkCardProps): ReactElement => {
  const [isDark, setIsDark] = useState(getInitialThemeState);

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

  const definition = term.def[locale] || term.def.en;
  const categoryLabel = getCategoryLabel(term.category, copy);
  const categoryStyle = getCategoryStyle(term.category, isDark);
  
  const handleActivate = () => {
    onSelect(term.slug);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={
        `relative surface border surface-border rounded-2xl p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] flex flex-col gap-3 text-left card-hover-shadow` +
        (isDimmed ? ' pointer-events-none opacity-70 blur-card' : '')
      }
      variants={variants}
      transition={getTransition(motionIndex)}
  /* Hover and tap motion removed to disable hover effects completely */
  animate={isDimmed ? {} : {}}
    >      
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-medium leading-snug line-clamp-2" title={term.romaji}>
            {term.romaji}
          </h3>
          {term.jp && <div className="text-xs text-subtle truncate">{term.jp}</div>}
        </div>
        <div className="flex items-center gap-2">
          {actionSlot}
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm text-muted leading-relaxed">
        {definition}
      </p>

      {/* Category label at bottom */}
      <div className="mt-auto flex justify-end pt-1">
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{
            backgroundColor: categoryStyle.backgroundColor,
            color: categoryStyle.color,
          }}
        >
          {categoryLabel}
        </span>
      </div>
    </motion.div>
  );
};