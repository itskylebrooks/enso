import type { ReactElement, ReactNode } from 'react';
import type { Locale, Progress, Technique } from '../../types';
import type { Copy } from '../../constants/i18n';
import { EmphasizedName, LevelBadge, SectionTitle } from '../common';
import { StarIcon, CheckIcon } from '../common/icons';

type ProgressListsProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  progress: Progress[];
  onOpen: (slug: string) => void;
};

const partitionByStatus = (techniques: Technique[], progressMap: Record<string, Progress>) => ({
  focus: techniques.filter((technique) => progressMap[technique.id]?.focus),
  confident: techniques.filter((technique) => progressMap[technique.id]?.confident),
});

export const ProgressLists = ({ copy, locale, techniques, progress, onOpen }: ProgressListsProps): ReactElement => {
  const progressById = Object.fromEntries(progress.map((entry) => [entry.techniqueId, entry]));
  const buckets = partitionByStatus(techniques, progressById);

  return (
    <div className="flex flex-col gap-6">
      <ProgressSection title={`${copy.focus} (${buckets.focus.length})`}>
        <TechniqueList
          items={buckets.focus}
          locale={locale}
          copy={copy}
          progressById={progressById}
          onOpen={onOpen}
        />
      </ProgressSection>
      <ProgressSection title={`${copy.confident} (${buckets.confident.length})`}>
        <TechniqueList
          items={buckets.confident}
          locale={locale}
          copy={copy}
          progressById={progressById}
          onOpen={onOpen}
        />
      </ProgressSection>
    </div>
  );
};

type SectionProps = {
  title: string;
  children: ReactNode;
};

const ProgressSection = ({ title, children }: SectionProps): ReactElement => (
  <section className="surface border surface-border rounded-2xl p-3">
    <SectionTitle>{title}</SectionTitle>
    <div className="mt-2">{children}</div>
  </section>
);

type TechniqueListProps = {
  items: Technique[];
  locale: Locale;
  copy: Copy;
  progressById: Record<string, Progress>;
  onOpen: (slug: string) => void;
};

const TechniqueList = ({ items, locale, copy, progressById, onOpen }: TechniqueListProps): ReactElement => {
  if (items.length === 0) {
    return <div className="text-sm text-muted">—</div>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((technique) => {
        const entry = progressById[technique.id];
        return (
          <li key={technique.id}>
            <button
              type="button"
              onClick={() => onOpen(technique.slug)}
              className="w-full text-left rounded-2xl border surface-border bg-[var(--color-surface)] px-4 py-3 flex items-start justify-between gap-4 transition duration-150 ease-out hover:border-[var(--color-text)]/20 motion-safe:hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              aria-label={`${copy.openAriaPrefix} ${technique.name[locale]}`}
            >
              <div className="min-w-0 space-y-1">
                <div className="truncate" title={technique.name[locale]}>
                  <EmphasizedName name={technique.name[locale]} />
                </div>
                <div className="text-[10px] text-subtle truncate">{technique.jp}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <LevelBadge locale={locale} level={technique.level} />
                {entry?.focus && (
                  <span title={copy.focus} className="inline-flex text-[0px]">
                    <StarIcon className="w-3.5 h-3.5" />
                  </span>
                )}
                {entry?.confident && (
                  <span title={copy.confident} className="inline-flex text-[0px]">
                    <CheckIcon className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
