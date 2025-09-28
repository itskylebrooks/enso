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

export const ProgressLists = ({ copy, locale, techniques, progress, onOpen }: ProgressListsProps): JSX.Element => {
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
  children: React.ReactNode;
};

const ProgressSection = ({ title, children }: SectionProps): JSX.Element => (
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

const TechniqueList = ({ items, locale, copy, progressById, onOpen }: TechniqueListProps): JSX.Element => {
  if (items.length === 0) {
    return <div className="text-sm text-muted">—</div>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((technique) => {
        const entry = progressById[technique.id];
        return (
          <li key={technique.id} className="py-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate" title={technique.name[locale]}>
                <EmphasizedName name={technique.name[locale]} />
              </div>
              <div className="text-[10px] text-subtle truncate">{technique.jp}</div>
            </div>
            <div className="flex items-center gap-2">
              <LevelBadge locale={locale} level={technique.level} />
              {entry?.focus && (
                <span title={copy.focus} className="text-[0px] inline-flex">
                  <StarIcon className="w-3.5 h-3.5" />
                </span>
              )}
              {entry?.confident && (
                <span title={copy.confident} className="text-[0px] inline-flex">
                  <CheckIcon className="w-3.5 h-3.5" />
                </span>
              )}
              <button type="button" onClick={() => onOpen(technique.slug)} className="text-xs underline">
                Open
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
