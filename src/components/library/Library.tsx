import type { Locale, Progress, Technique } from '../../types';
import type { Copy } from '../../constants/i18n';
import { Chip, EmphasizedName, LevelBadge } from '../common';

const buildProgressMap = (entries: Progress[]): Record<string, Progress> =>
  Object.fromEntries(entries.map((entry) => [entry.techniqueId, entry]));

type LibraryProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  progress: Progress[];
  onOpen: (id: string) => void;
};

export const Library = ({ copy, locale, techniques, progress, onOpen }: LibraryProps): JSX.Element => {
  const progressById = buildProgressMap(progress);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {techniques.map((technique) => {
        const entry = progressById[technique.id];

        return (
          <button
            type="button"
            key={technique.id}
            onClick={() => onOpen(technique.id)}
            className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition hover:shadow-md hover-border-contrast text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate" title={technique.name[locale]}>
                  <EmphasizedName name={technique.name[locale]} />
                </div>
                <div className="text-xs text-subtle truncate">{technique.jp}</div>
              </div>
              <div className="flex items-center gap-2">
                <LevelBadge locale={locale} level={technique.level} />
                {entry?.focus && <span title={copy.focus}>⭐</span>}
                {entry?.notNow && <span title={copy.notNow}>⏸</span>}
                {entry?.confident && <span title={copy.confident}>✔︎</span>}
              </div>
            </div>
            <div className="text-sm text-muted line-clamp-2 min-h-[2.5rem]">
              {technique.description[locale]}
            </div>
            <div className="flex flex-wrap gap-1">
              {technique.attack && <Chip label={technique.attack} disabled />}
              {technique.stance && <Chip label={technique.stance} disabled />}
              {technique.weapon && <Chip label={technique.weapon} disabled />}
              {technique.category && <Chip label={technique.category} disabled />}
            </div>
          </button>
        );
      })}
      {techniques.length === 0 && (
        <div className="col-span-full text-sm text-muted">No techniques found for the selected filters.</div>
      )}
    </div>
  );
};
