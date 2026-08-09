import type { ChangeEvent, ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { ChildrenGameFilters, ChildrenGameMaterial, ChildrenGameSetting } from '@shared/types';
import { classNames } from '@shared/utils/classNames';
import { SectionTitle } from '@shared/components';
import { getChildrenGameMaterialLabel, getChildrenGameSettingLabel } from '../labels';

type ChildrenGamesFilterFieldsProps = {
  copy: Copy;
  filters: ChildrenGameFilters;
  materials: ChildrenGameMaterial[];
  onChange: (filters: ChildrenGameFilters) => void;
};

const settings: ChildrenGameSetting[] = ['indoor', 'outdoor', 'evening'];

const toggleValue = <T,>(values: T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

const FilterButton = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}): ReactElement => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={classNames(
      'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
      active
        ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] shadow-sm hover:bg-[var(--color-text)]'
        : 'surface surface-border',
    )}
  >
    <span className="truncate">{label}</span>
  </button>
);

export const ChildrenGamesFilterFields = ({
  copy,
  filters,
  materials,
  onChange,
}: ChildrenGamesFilterFieldsProps): ReactElement => {
  const handleParticipantChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const parsed = Number.parseInt(value, 10);
    onChange({
      ...filters,
      participantCount: value === '' || !Number.isFinite(parsed) ? undefined : Math.max(1, parsed),
    });
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionTitle>{copy.childrenGames.participantCount}</SectionTitle>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={filters.participantCount ?? ''}
          onChange={handleParticipantChange}
          placeholder={copy.childrenGames.participantPlaceholder}
          aria-label={copy.childrenGames.participantCount}
          className="w-full rounded-lg border surface-border bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-soft placeholder:text-subtle focus:border-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-text)]/15"
        />
      </section>

      <section className="space-y-3">
        <SectionTitle>{copy.childrenGames.settings}</SectionTitle>
        <div className="space-y-2">
          {settings.map((setting) => (
            <FilterButton
              key={setting}
              active={filters.settings.includes(setting)}
              label={getChildrenGameSettingLabel(setting, copy)}
              onClick={() =>
                onChange({
                  ...filters,
                  settings: toggleValue(filters.settings, setting),
                })
              }
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>{copy.childrenGames.materials}</SectionTitle>
        <div className="space-y-2">
          {materials.map((material) => (
            <FilterButton
              key={material}
              active={filters.materials.includes(material)}
              label={getChildrenGameMaterialLabel(material, copy)}
              onClick={() =>
                onChange({
                  ...filters,
                  materials: toggleValue(filters.materials, material),
                })
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
};
