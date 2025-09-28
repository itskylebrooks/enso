import type { ReactNode, ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';
import type { Locale, Progress, Technique } from '../../types';
import { EmphasizedName, LevelBadge } from '../common';
import { CheckIcon, StarIcon } from '../common/icons';
import { MediaEmbed } from '../media/MediaEmbed';
import { classNames } from '../../utils/classNames';
import { formatDetailLabel, formatWeaponLabel } from '../../utils/format';

const removeDiacritics = (value: string): string =>
  value.normalize('NFD').replace(/\p{Diacritic}/gu, '');

const buildTags = (technique: Technique, locale: Locale): string[] => {
  const title = technique.name[locale]?.toLowerCase?.() ?? '';
  const normalizedTitle = removeDiacritics(title);
  const candidates = [
    formatDetailLabel(technique.stance),
    technique.weapon && technique.weapon !== 'empty-hand' ? formatWeaponLabel(technique.weapon) : null,
    formatDetailLabel(technique.category),
    formatDetailLabel(technique.attack),
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));

  const unique: string[] = [];
  candidates.forEach((value) => {
    const lower = value.toLowerCase();
    const normalizedValue = removeDiacritics(lower);
    if (title.includes(lower) || normalizedTitle.includes(normalizedValue)) {
      return;
    }
    if (!unique.some((entry) => removeDiacritics(entry.toLowerCase()) === normalizedValue)) {
      unique.push(value);
    }
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

  const focusActive = Boolean(progress?.focus);
  const confidentActive = Boolean(progress?.confident);

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-10">
      <header className="sticky top-16 z-10 border-b surface surface-border backdrop-blur bg-[var(--color-surface)]/90 pb-4">
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
        </section>

        <section>
          <h2 className="uppercase tracking-[0.3em] text-xs text-subtle mb-6">{copy.media}</h2>
          <div className="space-y-3">
            {technique.media.length === 0 && <div className="text-sm text-muted">No media yet.</div>}
            {technique.media.map((item, index) => (
              <MediaEmbed key={`${item.url}-${index}`} media={item} />
            ))}
          </div>
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

const ToggleButton = ({ label, icon, active, onClick }: ToggleButtonProps): ReactElement => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={classNames(
      'px-3 py-1.5 text-sm flex items-center gap-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
      active
        ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
        : 'bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
    )}
  >
    <span className="inline-flex items-center" aria-hidden>
      {icon}
    </span>
    <span>{label}</span>
  </button>
);
