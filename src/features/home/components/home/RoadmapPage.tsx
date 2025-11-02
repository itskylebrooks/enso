import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import { useMemo, useEffect, useState } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { Locale } from '@shared/types';
import type { RoadmapIconName, RoadmapItem, RoadmapStatus } from '@shared/types/roadmap';
import { roadmapItems } from '@shared/data/roadmap';
import { classNames } from '@shared/utils/classNames';
import { useMotionPreferences, defaultEase } from '@shared/components/ui/motion';
import { getInitialThemeState } from '@shared/utils/theme';
import { DynamicIcon, iconNames } from 'lucide-react/dynamic';
import type { IconName as LucideIconName } from 'lucide-react/dynamic';

type RoadmapPageProps = {
  copy: Copy;
  locale: Locale;
};

type ColumnStatus = Exclude<RoadmapStatus, 'meta'>;

const columnStatuses: ColumnStatus[] = ['planned', 'in-progress', 'launched'];

// Convert camelCase or snake_case names to Lucide's kebab-case and validate
const toLucideName = (name?: string): LucideIconName | undefined => {
  if (!name) return undefined;
  const candidate = name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
  return (iconNames as readonly string[]).includes(candidate) ? (candidate as LucideIconName) : undefined;
};

const statusAccent = (copy: Copy) =>
  ({
    planned: {
      label: copy.roadmapStatusPlanned,
      tagClass:
        'bg-[#e9d5ff] font-semibold dark:bg-[rgba(129,140,248,0.18)] dark:text-[#d9c9ff]',
      hoverRingClass: 'hover:ring-2 hover:ring-offset-2 hover:ring-[#a855f7]/35 hover:ring-offset-transparent',
      focusRingClass: 'focus-visible:ring-[#a855f7]/40 focus-visible:border-[#a855f7]/65',
      hoverBorderClass: 'hover:border-[#7c3aed]/75 dark:hover:border-[#c084fc]/75',
    },
    'in-progress': {
      label: copy.roadmapStatusInProgress,
      tagClass:
        'bg-[#fde68a] font-semibold dark:bg-[rgba(253,224,71,0.16)] dark:text-[#facc15]',
      hoverRingClass: 'hover:ring-2 hover:ring-offset-2 hover:ring-[#f59e0b]/35 hover:ring-offset-transparent',
      focusRingClass: 'focus-visible:ring-[#f59e0b]/38 focus-visible:border-[#f59e0b]/60',
      hoverBorderClass: 'hover:border-[#f59e0b]/70 dark:hover:border-[#fbbf24]/70',
    },
    launched: {
      label: copy.roadmapStatusLaunched,
      tagClass:
        'bg-[#a7f3d0] font-semibold dark:bg-[rgba(16,185,129,0.18)] dark:text-[#6ee7b7]',
      hoverRingClass: 'hover:ring-2 hover:ring-offset-2 hover:ring-[#10b981]/35 hover:ring-offset-transparent',
      focusRingClass: 'focus-visible:ring-[#10b981]/36 focus-visible:border-[#10b981]/58',
      hoverBorderClass: 'hover:border-[#10b981]/70 dark:hover:border-[#34d399]/70',
    },
  }) satisfies Record<
    ColumnStatus,
    {
      label: string;
      tagClass: string;
      hoverRingClass: string;
      focusRingClass: string;
      hoverBorderClass: string;
    }
  >;

const cardBaseClass =
  'group relative overflow-hidden rounded-2xl surface border surface-border border-black/20 dark:border-white/18 px-5 py-6 transition-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const selectSummary = (summary: RoadmapItem['summary'], locale: Locale): string =>
  locale === 'de' ? summary.de ?? summary.en : summary.en;

const selectTitle = (title: RoadmapItem['title'], locale: Locale): string =>
  typeof title === 'string' ? title : (locale === 'de' ? title.de ?? title.en : title.en);

export const RoadmapPage = ({ copy, locale }: RoadmapPageProps): ReactElement => {
  const { prefersReducedMotion } = useMotionPreferences();
  const [isDark, setIsDark] = useState(getInitialThemeState);
  const [isMetaHovered, setIsMetaHovered] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const grouped = useMemo(() => {
    const columns: Record<ColumnStatus, RoadmapItem[]> = {
      planned: [],
      'in-progress': [],
      launched: [],
    };
    let meta: RoadmapItem | null = null;

    for (const item of roadmapItems) {
      if (item.status === 'meta') {
        meta = item;
        continue;
      }

      columns[item.status as ColumnStatus].push(item);
    }

    return { columns, meta };
  }, []);

  const accent = statusAccent(copy);
  // const updates = updatesFeed[locale] ?? updatesFeed.en; // removed usage

  return (
    <section className="min-h-dvh py-14 md:py-18 font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-12 md:space-y-14">
        <header className="space-y-4 text-center md:text-left">
          <h1 className="text-3xl md:text-[2.5rem] leading-tight font-semibold tracking-tight">
            {copy.roadmapTitle}
          </h1>
          <p className="text-base md:text-lg text-subtle max-w-3xl">
            {copy.roadmapSummary}
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {columnStatuses.map((status, index) => {
            const items = grouped.columns[status];
            const config = accent[status];

            return (
              <motion.section
                key={status}
                initial={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 0, y: 18 }
                }
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 1, y: 0 }
                }
                transition={
                  prefersReducedMotion
                    ? undefined
                    : { duration: 0.5, delay: index * 0.08, ease: defaultEase }
                }
                className="space-y-4"
                aria-labelledby={`roadmap-column-${status}`}
                style={prefersReducedMotion ? undefined : { willChange: 'transform, opacity' }}
              >
                <div
                  id={`roadmap-column-${status}`}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] uppercase tracking-[0.15em] font-semibold opacity-100',
                    config.tagClass,
                  )}
                  style={
                    isDark
                      ? undefined
                      : status === 'planned'
                        ? { backgroundColor: '#e9d5ff' }
                        : status === 'in-progress'
                          ? { backgroundColor: '#fde68a' }
                          : { backgroundColor: '#a7f3d0' }
                  }
                >
                  <span
                    style={
                      isDark
                        ? undefined
                        : status === 'planned'
                          ? { color: '#5b21b6' }
                          : status === 'in-progress'
                            ? { color: '#92400e' }
                            : { color: '#0f766e' }
                    }
                  >
                    {config.label}
                  </span>
                </div>
                <div className="space-y-4">
                  {items.map((item) => (
                    <ArticleCard
                      key={item.id}
                      item={item}
                      hoverRingClass={config.hoverRingClass}
                      focusRingClass={config.focusRingClass}
                      hoverBorderClass={config.hoverBorderClass}
                      prefersReducedMotion={prefersReducedMotion}
                      locale={locale}
                    />
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>

        {grouped.meta && (
          <motion.article
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 24 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? undefined : { duration: 0.6, ease: defaultEase }}
            className="group relative overflow-hidden rounded-3xl surface border surface-border border-black/20 dark:border-white/18 px-6 py-8 md:px-10 md:py-12 text-center"
            onMouseEnter={() => setIsMetaHovered(true)}
            onMouseLeave={() => setIsMetaHovered(false)}
            aria-labelledby="roadmap-meta-title"
          >
            {/* Hover-only inner spotlight (computed per theme; no dark: classes to avoid mismatch) */}
            <div
              className="absolute inset-[1px] rounded-[inherit] pointer-events-none transition-opacity duration-300 z-0"
              style={{
                opacity: isMetaHovered ? 1 : 0,
                background: isDark
                  ? 'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.07) 0%, transparent 55%)'
                  : 'radial-gradient(110% 70% at 50% 0%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0) 58%)',
              }}
            />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-center">
                      <MetaIcon iconName={grouped.meta.icon} />
              </div>
              <h2 id="roadmap-meta-title" className="text-2xl md:text-3xl font-semibold tracking-tight">
                {selectTitle(grouped.meta.title as RoadmapItem['title'], locale)}
              </h2>
              <p className="text-base md:text-lg text-subtle max-w-2xl mx-auto">
                {selectSummary(grouped.meta.summary, locale)}
              </p>
            </div>
          </motion.article>
        )}

        {/* Recent updates section removed intentionally */}
      </div>
    </section>
  );
};

type ArticleCardProps = {
  item: RoadmapItem;
  hoverRingClass: string;
  focusRingClass: string;
  hoverBorderClass: string;
  prefersReducedMotion: boolean;
  locale: Locale;
};

const ArticleCard = ({
  item,
  hoverRingClass,
  focusRingClass,
  hoverBorderClass,
  prefersReducedMotion,
  locale,
}: ArticleCardProps): ReactElement => {
  const summary = selectSummary(item.summary, locale);

  return (
    <motion.article
      className={classNames(
        cardBaseClass,
        focusRingClass,
        hoverBorderClass,
        hoverRingClass,
        'hover:[box-shadow:var(--card-shadow)]',
      )}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 14 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? undefined : { duration: 0.45, ease: defaultEase }}
    >
      {/* Hover now affects only the frame via ring/border; no color overlays */}

      <div className="relative z-10 space-y-4">
        <div className="flex items-start gap-3">
          {item.icon ? (
            <DynamicIcon
              name={toLucideName(item.icon) ?? 'circle'}
              className="mt-0.5 h-5 w-5 text-[var(--color-text)]/75"
            />
          ) : null}
          <div className="space-y-1.5">
            <h3 className="text-lg font-medium tracking-tight">
              {selectTitle(item.title, locale)}
            </h3>
            {item.version && (
              <div className="text-xs uppercase tracking-[0.3em] text-subtle">
                {item.version}
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-subtle leading-relaxed">
          {summary}
        </p>

        {/* Roadmap cards: omit badges like planned/community/new */}

        {/* Learn more button removed intentionally */}
      </div>
    </motion.article>
  );
};

const MetaIcon = ({ iconName }: { iconName?: RoadmapIconName }): ReactElement | null => {
  if (!iconName) return null;
  return (
    <DynamicIcon
      name={toLucideName(iconName) ?? 'circle'}
      className="h-8 w-8 text-[var(--color-text)]/70"
    />
  );
};
