import type { ReactNode, ReactElement } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Progress, Technique } from '../../types';
import { EmphasizedName, LevelBadge } from '../common';
import { CheckIcon, StarIcon } from '../common/icons';
import { MediaEmbed } from '../media/MediaEmbed';
import { classNames } from '../../utils/classNames';
import { getTaxonomyLabel } from '../../i18n/taxonomy';
import { stripDiacritics } from '../../utils/text';
import { useMotionPreferences, defaultEase } from '../ui/motion';

const buildTags = (technique: Technique, locale: Locale): string[] => {
  const title = technique.name[locale]?.toLowerCase?.() ?? '';
  const normalizedTitle = stripDiacritics(title);

  const candidates: Array<{ type: 'category' | 'attack' | 'stance' | 'weapon'; value?: string | null }> = [
    { type: 'stance', value: technique.stance },
    { type: 'weapon', value: technique.weapon && technique.weapon !== 'empty-hand' ? technique.weapon : undefined },
    { type: 'category', value: technique.category },
    { type: 'attack', value: technique.attack },
  ];

  const unique: string[] = [];
  const seen = new Set<string>();

  candidates.forEach(({ type, value }) => {
    if (!value) return;
    const label = getTaxonomyLabel(locale, type, value);
    const normalizedValue = stripDiacritics(label.toLowerCase());
    if (normalizedValue.length === 0) return;
    if (normalizedTitle.includes(normalizedValue)) return;
    if (seen.has(normalizedValue)) return;
    seen.add(normalizedValue);
    unique.push(label);
  });

  return unique;
};

type TechniquePageProps = {
  technique: Technique;
  progress: Progress | null;
  copy: Copy;
  locale: Locale;
  backLabel: string;
  onBack: () => void;
  onToggleFocus: () => void;
  onToggleConfident: () => void;
};

export const TechniquePage = ({
  technique,
  progress,
  copy,
  locale,
  backLabel,
  onBack,
  onToggleFocus,
  onToggleConfident,
}: TechniquePageProps): ReactElement => {
  const tags = buildTags(technique, locale);
  const steps = technique.steps[locale];
  const ukeNotes = technique.ukeNotes ? technique.ukeNotes[locale] : null;
  const { mediaMotion, prefersReducedMotion } = useMotionPreferences();

  const focusActive = Boolean(progress?.focus);
  const confidentActive = Boolean(progress?.confident);

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-10">
  <header className="sticky top-16 z-10 border-b surface-border pb-4 bg-transparent">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 space-y-3">
            <a
              href="/"
              aria-label={backLabel}
              onClick={(event) => {
                event.preventDefault();
                onBack();
              }}
              className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2"
            >
              <span aria-hidden>←</span>
              <span>{backLabel}</span>
            </a>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold leading-tight truncate" title={technique.name[locale]}>
                <EmphasizedName name={technique.name[locale]} />
              </h1>
              {technique.jp && <div className="text-sm text-subtle truncate">{technique.jp}</div>}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border surface-border bg-[var(--color-surface)] px-2 py-1 text-xs uppercase tracking-wide text-subtle"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <LevelBadge locale={locale} level={technique.level} />
            <div className="inline-flex rounded-lg border surface-border overflow-hidden divide-x divide-[var(--color-border)]">
              <ToggleButton
                label={copy.focus}
                icon={<StarIcon className="w-4 h-4" />}
                active={focusActive}
                onClick={onToggleFocus}
              />
              <ToggleButton
                label={copy.confident}
                icon={<CheckIcon className="w-4 h-4" />}
                active={confidentActive}
                onClick={onToggleConfident}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-10">
        <section>
          <h2 className="uppercase tracking-[0.3em] text-xs text-subtle mb-6">{copy.steps}</h2>
          <div>
            {steps.map((step, index) => (
              <div key={index} className="grid grid-cols-[auto,1fr] gap-3 mb-6">
                <span className="w-7 h-7 rounded-full border surface-border flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
          {ukeNotes && (
            <motion.section
              className="mt-10 rounded-2xl border surface-border bg-[var(--color-surface)]/80 p-4"
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.2, ease: defaultEase }}
            >
              <h3 className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-subtle">
                <span aria-hidden className="text-base leading-none">🤝</span>
                <span>{copy.ukeNotes}</span>
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{ukeNotes}</p>
            </motion.section>
          )}
        </section>

        <section>
          <h2 className="uppercase tracking-[0.3em] text-xs text-subtle mb-6">{copy.media}</h2>
          <motion.div
            className="space-y-3"
            variants={mediaMotion.variants}
            initial="hidden"
            animate="show"
            transition={mediaMotion.transition}
          >
            {technique.media.length === 0 && <div className="text-sm text-muted">No media yet.</div>}
            {technique.media.map((item, index) => (
              <MediaEmbed key={`${item.url}-${index}`} media={item} />
            ))}
          </motion.div>
        </section>
      </main>

      <footer className="flex flex-wrap items-center justify-end gap-3 text-xs text-subtle border-t surface-border pt-3">
        <div>Keys: ⌘K or Ctrl+K</div>
      </footer>
    </div>
  );
};

type ToggleButtonProps = {
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
};

const ToggleButton = ({ label, icon, active, onClick }: ToggleButtonProps): ReactElement => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={classNames(
        'px-3 py-1.5 text-sm flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
        active
          ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
          : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
      )}
      variants={prefersReducedMotion
        ? {
            inactive: { scale: 1, opacity: 1 },
            active: { scale: 1, opacity: 1 },
          }
        : {
            inactive: { scale: 1, opacity: 1 },
            active: { scale: [1, 0.96, 1], opacity: [1, 0.85, 1] },
          }}
      animate={active ? 'active' : 'inactive'}
      transition={prefersReducedMotion ? { duration: 0.05 } : { duration: 0.12, ease: defaultEase }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
    >
      <span className="inline-flex items-center" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </motion.button>
  );
};
