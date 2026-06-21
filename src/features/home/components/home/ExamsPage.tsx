import { defaultEase, useMotionPreferences } from '@shared/components/ui/motion';
import { getCopy } from '@shared/constants/i18n';
import { getDefaultCurriculum } from '@shared/curricula';
import { getGradeStyle, gradeLabel } from '@shared/styles/belts';
import type { EntryMode, Grade, Locale } from '@shared/types';
import { getInitialThemeState } from '@shared/utils/theme';
import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { ExamMatrix } from '../exams/ExamMatrix';

const { gradeOrder } = getDefaultCurriculum();

type ExamsPageProps = {
  locale: Locale;
  onNavigateToExamsGrade: (grade: Grade) => void;
  onOpenTechnique: (
    slug: string,
    trainerId?: string,
    entry?: EntryMode,
    skipExistenceCheck?: boolean,
  ) => void;
  onNavigateToAdvanced: () => void;
  onNavigateToDan: () => void;
};

const sectionVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const ExamsPage = ({
  locale,
  onNavigateToExamsGrade,
  onOpenTechnique,
  onNavigateToAdvanced,
  onNavigateToDan,
}: ExamsPageProps): ReactElement => {
  const i18nCopy = getCopy(locale);
  const examsCopy = i18nCopy.examsPage;
  const { prefersReducedMotion } = useMotionPreferences();
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
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleBeltClick = (grade: Grade) => {
    onNavigateToExamsGrade(grade);
  };
  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden' as const,
        animate: 'show' as const,
        variants: sectionVariants,
        transition: { duration: 0.24, ease: defaultEase },
      };

  return (
    <section className="pt-0 pb-12">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-10">
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.examMatrixTitle}</h2>
          </header>
          <ExamMatrix
            locale={locale}
            copy={i18nCopy}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              const attackSlug = attackKey.replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{examsCopy.headings.belts}</h2>
            <p className="text-sm text-subtle leading-relaxed">{examsCopy.beltsLead}</p>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {gradeOrder
              .filter((g) => !['dan2', 'dan3', 'dan4', 'dan5'].includes(g))
              .map((grade) => {
                const style = getGradeStyle(grade);
                return (
                  <li key={grade}>
                    <button
                      type="button"
                      onClick={() => handleBeltClick(grade)}
                      className="w-full rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                    >
                      <span className="text-sm font-medium">{gradeLabel(grade, locale)}</span>
                      <span
                        aria-hidden
                        className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border border-transparent"
                        style={{
                          backgroundColor: style.backgroundColor,
                          color: style.color,
                          borderColor: style.borderColor,
                        }}
                      >
                        {examsCopy.beltNames[grade]}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </motion.article>

        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">
              {i18nCopy.advancedProgramsTitle}
            </h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.advancedProgramsLead}</p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onNavigateToAdvanced}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              <span className="text-sm font-medium">{i18nCopy.advancedProgramsCta}</span>
              <span aria-hidden className="text-sm text-subtle shrink-0">
                →
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToDan?.()}
              className="w-full rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              <span className="text-sm font-medium">{i18nCopy.danOverviewCta}</span>
              <span aria-hidden className="text-sm text-subtle shrink-0">
                →
              </span>
            </button>
          </div>
        </motion.article>
      </div>
    </section>
  );
};
