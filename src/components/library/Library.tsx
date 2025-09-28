import type { ReactElement } from 'react';
import type { Locale, Progress, Technique } from '../../types';
import type { Copy } from '../../constants/i18n';
import { EmphasizedName, LevelBadge } from '../common';
import { StarIcon, CheckIcon } from '../common/icons';
import { formatDetailLabel, formatWeaponLabel } from '../../utils/format';

const buildProgressMap = (entries: Progress[]): Record<string, Progress> =>
  Object.fromEntries(entries.map((entry) => [entry.techniqueId, entry]));

type LibraryProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  progress: Progress[];
  onOpen: (slug: string) => void;
};

export const Library = ({ copy, locale, techniques, progress, onOpen }: LibraryProps): ReactElement => {
  const progressById = buildProgressMap(progress);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {techniques.map((technique) => {
        const entry = progressById[technique.id];

        const stanceLabel = formatDetailLabel(technique.stance);
        const weaponLabel = technique.weapon && technique.weapon !== 'empty-hand' ? formatWeaponLabel(technique.weapon) : null;

        return (
          <button
            type="button"
            key={technique.id}
            onClick={() => onOpen(technique.slug)}
            className="surface border surface-border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition hover:shadow-md hover-border-contrast text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="truncate text-base font-medium leading-snug" title={technique.name[locale]}>
                  <EmphasizedName name={technique.name[locale]} />
                </div>
                {technique.jp && <div className="text-xs text-subtle truncate">{technique.jp}</div>}
              </div>
              <div className="flex items-center gap-2 text-base">
                {entry?.focus && (
                  <span title={copy.focus} className="text-[0px] inline-flex">
                    <StarIcon className="w-4 h-4" />
                  </span>
                )}
                {entry?.confident && (
                  <span title={copy.confident} className="text-[0px] inline-flex">
                    <CheckIcon className="w-4 h-4" />
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-muted leading-relaxed line-clamp-2 min-h-[2.5rem]">
              {technique.description[locale]}
            </p>

            <div className="mt-auto flex items-end justify-between gap-4 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-subtle">
                {stanceLabel && <span className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">{stanceLabel}</span>}
                {weaponLabel && (
                  <span className="rounded-sm bg-black/5 px-2 py-0.5 dark:bg-white/10">{weaponLabel}</span>
                )}
              </div>
              <div className="ml-auto">
                <LevelBadge locale={locale} level={technique.level} />
              </div>
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
