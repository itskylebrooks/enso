import type { KeyboardEvent, ReactElement } from 'react';
import { useState, useEffect } from 'react';
import { motion, type Variants, type Transition } from 'motion/react';
import type { GlossaryTerm } from '../../../shared/types';
import type { Locale } from '../../../shared/types';
import type { Copy } from '../../../shared/constants/i18n';
import { getCategoryStyle, getCategoryLabel } from '../../../shared/styles/glossary';
import { getInitialThemeState } from '@shared/utils/theme';

type MotionProps = {
  variants: Variants;
  getTransition: (index: number) => Transition;
  prefersReducedMotion: boolean;
};

type GlossaryCardProps = {
  term: GlossaryTerm;
  locale: Locale;
  copy: Copy;
  onSelect: (slug: string) => void;
  motionIndex: number;
} & MotionProps;



const truncateDefinition = (text: string, maxLength: number = 120): string => {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? `${truncated.slice(0, lastSpace)}...` : `${truncated}...`;
};

export const GlossaryCard = ({
  term,
  locale,
  copy,
  onSelect,
  motionIndex,
  variants,
  getTransition,
  prefersReducedMotion,
}: GlossaryCardProps): ReactElement => {
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

  const ariaLabel = `${term.romaji} – ${definition}`;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 text-left cursor-pointer"
      variants={variants}
      transition={getTransition(motionIndex)}
      whileHover={prefersReducedMotion ? undefined : { y: -2, boxShadow: '0 8px 20px -12px rgba(15,23,42,0.25)' }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      aria-label={ariaLabel}
    >
      {/* Header with romaji and badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold leading-tight">{term.romaji}</h3>
          {term.jp && <div className="text-xs text-subtle truncate">{term.jp}</div>}
        </div>
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
          style={{
            backgroundColor: categoryStyle.backgroundColor,
            color: categoryStyle.color,
          }}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Definition */}
      <p className="text-sm text-muted leading-relaxed flex-1">
        {truncateDefinition(definition, 140)}
      </p>
    </motion.div>
  );
};