import { defaultEase, useMotionPreferences } from '@shared/components/ui/motion';
import { getCopy } from '@shared/constants/i18n';
import { getGradeStyle, gradeLabel } from '@shared/styles/belts';
import type { EntryMode, Grade, GuideRoutine, Locale } from '@shared/types';
import { gradeOrder } from '@shared/utils/grades';
import { getInitialThemeState } from '@shared/utils/theme';
import { motion } from 'motion/react';
import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { ExamMatrix } from '../guide/ExamMatrix';

type GuidePageProps = {
  locale: Locale;
  onNavigateToGuideGrade: (grade: Grade) => void;
  onNavigateToRoutine: (routine: GuideRoutine) => void;
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

export const GuidePage = ({
  locale,
  onNavigateToGuideGrade,
  onNavigateToRoutine,
  onOpenTechnique,
  onNavigateToAdvanced,
  onNavigateToDan,
}: GuidePageProps): ReactElement => {
  const i18nCopy = getCopy(locale);
  const guideCopy = i18nCopy.guidePage;
  const { prefersReducedMotion } = useMotionPreferences();
  const [isDark, setIsDark] = useState(getInitialThemeState);

  // Adaptive colors for highlighted external links (bg + text)
  const externalColors = {
    dab: {
      light: { bg: 'rgba(249, 220, 4, 0.12)', fg: '#1f1f1f' }, // #f9dc04
      dark: { bg: 'rgba(249, 220, 4, 0.16)', fg: '#f9dc04' },
    },
    wsv: {
      light: { bg: 'rgba(2, 130, 53, 0.12)', fg: '#042d14' }, // #028235
      dark: { bg: 'rgba(2, 130, 53, 0.2)', fg: '#bff7d1' },
    },
    bsv: {
      light: { bg: 'rgba(178, 1, 0, 0.12)', fg: '#3b0000' }, // #b20100
      dark: { bg: 'rgba(178, 1, 0, 0.18)', fg: '#ffd6d6' },
    },
  } as const;

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
    onNavigateToGuideGrade(grade);
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
    <section className="py-12">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-10">
        {/* Belts */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{guideCopy.headings.belts}</h2>
            <p className="text-sm text-subtle leading-relaxed">{guideCopy.beltsLead}</p>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {gradeOrder
              .filter((g) => !['dan2', 'dan3', 'dan4', 'dan5'].includes(g))
              .map((grade) => {
                // Use default grade style (always-white text) for belt labels in the list.
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
                        className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                        style={{
                          backgroundColor: style.backgroundColor,
                          color: style.color,
                        }}
                      >
                        {guideCopy.beltNames[grade]}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </motion.article>

        {/* Routines */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{guideCopy.headings.routines}</h2>
          </header>
          <ul className="grid gap-3 sm:grid-cols-2">
            {guideCopy.routines.map((routine) => (
              <li key={routine.id}>
                <button
                  type="button"
                  onClick={() => onNavigateToRoutine(routine.id as GuideRoutine)}
                  className="w-full rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3 flex items-start justify-between gap-3 text-left cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  <span className="space-y-1">
                    <span className="block text-sm font-medium">{routine.title}</span>
                    <span className="block text-xs text-subtle leading-relaxed">
                      {routine.description}
                    </span>
                  </span>
                  <span aria-hidden className="text-sm text-subtle shrink-0">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </motion.article>

        {/* Exam Program Matrix */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.examMatrixTitle}</h2>
          </header>
          <ExamMatrix
            locale={locale}
            copy={i18nCopy}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              // Create combined technique slug: e.g., "katate-tori-ude-osae-ikkyo-omote"
              const attackSlug = attackKey.replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        {/* Advanced Programs (moved) */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">
              {i18nCopy.advancedProgramsTitle}
            </h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.advancedProgramsLead}</p>
          </header>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onNavigateToAdvanced}
              className="inline-flex items-center rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {i18nCopy.advancedProgramsCta} →
            </button>
            <button
              type="button"
              onClick={() => onNavigateToDan?.()}
              className="inline-flex items-center rounded-xl border surface-border bg-[var(--color-surface)]/20 px-4 py-2 text-sm font-medium hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {i18nCopy.danOverviewCta} →
            </button>
          </div>
        </motion.article>

        {/* Philosophy */}
        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{guideCopy.headings.philosophy}</h2>
            <p className="text-sm text-subtle leading-relaxed">{guideCopy.philosophyLead}</p>
          </header>
          <ul className="space-y-3 text-sm leading-relaxed">
            {guideCopy.philosophyPoints.map((point) => (
              <li key={point} className="text-sm leading-relaxed flex gap-2">
                <span aria-hidden className="shrink-0">
                  •
                </span>
                <span className="flex-1">{point}</span>
              </li>
            ))}
          </ul>
          {/* virtues section removed */}
        </motion.article>

        {/* Etiquette */}
        <motion.article className="space-y-3" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{guideCopy.headings.etiquette}</h2>
            <p className="text-sm text-subtle leading-relaxed">{guideCopy.etiquetteLead}</p>
          </header>
          <ul className="space-y-3 text-sm leading-relaxed">
            {guideCopy.etiquettePoints.map((point) => (
              <li key={point} className="text-sm leading-relaxed flex gap-2">
                <span aria-hidden className="shrink-0">
                  •
                </span>
                <span className="flex-1">{point}</span>
              </li>
            ))}
          </ul>
        </motion.article>
        {/* Further Study */}
        <motion.article className="space-y-3" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">
              {guideCopy.headings.furtherStudy}
            </h2>
            <p className="text-sm text-subtle leading-relaxed">{guideCopy.furtherStudyLead}</p>
          </header>
          <div className="flex flex-wrap gap-3">
            {guideCopy.furtherStudyLinks.map((link) => {
              let style: CSSProperties | undefined;
              let className =
                'inline-flex items-center rounded-full px-4 py-2 bg-[var(--color-surface)]/20 border surface-border text-sm hover:bg-[var(--color-surface-hover)] transition-colors';
              if (link.id === 'dab') {
                className =
                  'inline-flex items-center rounded-full px-4 py-2 border text-sm transition-colors pill-adaptive';
                style = {
                  '--pill-bg': isDark ? externalColors.dab.dark.bg : externalColors.dab.light.bg,
                  '--pill-bg-hover': isDark ? 'rgba(249, 220, 4, 0.22)' : 'rgba(249, 220, 4, 0.18)',
                  color: isDark ? externalColors.dab.dark.fg : externalColors.dab.light.fg,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                } as CSSProperties;
              } else if (link.id === 'wsv') {
                className =
                  'inline-flex items-center rounded-full px-4 py-2 border text-sm transition-colors pill-adaptive';
                style = {
                  '--pill-bg': isDark ? externalColors.wsv.dark.bg : externalColors.wsv.light.bg,
                  '--pill-bg-hover': isDark ? 'rgba(2, 130, 53, 0.28)' : 'rgba(2, 130, 53, 0.18)',
                  color: isDark ? externalColors.wsv.dark.fg : externalColors.wsv.light.fg,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                } as CSSProperties;
              } else if (link.id === 'bsv') {
                className =
                  'inline-flex items-center rounded-full px-4 py-2 border text-sm transition-colors pill-adaptive';
                style = {
                  '--pill-bg': isDark ? externalColors.bsv.dark.bg : externalColors.bsv.light.bg,
                  '--pill-bg-hover': isDark ? 'rgba(178, 1, 0, 0.28)' : 'rgba(178, 1, 0, 0.18)',
                  color: isDark ? externalColors.bsv.dark.fg : externalColors.bsv.light.fg,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                } as CSSProperties;
              } else {
                style = { color: 'var(--color-text)' };
              }

              return (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                  style={style}
                  aria-label={link.label}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </motion.article>
        {/* YouTube Inspiration */}
        <motion.article className="space-y-3" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">
              {guideCopy.headings.youtubeInspiration}
            </h2>
            <p className="text-sm text-subtle leading-relaxed">
              {guideCopy.youtubeInspirationLead}
            </p>
          </header>
          <div className="flex flex-wrap gap-3">
            {guideCopy.youtubeLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full px-4 py-2 bg-[var(--color-surface)]/20 border surface-border text-sm hover:bg-[var(--color-surface-hover)] transition-colors"
                aria-label={link.label}
              >
                {link.label}
              </a>
            ))}
          </div>
        </motion.article>
      </div>
    </section>
  );
};
