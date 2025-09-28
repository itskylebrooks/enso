import { useMemo, useState } from 'react';
import type { Copy } from '../../constants/i18n';
import type { Filters, Grade, Locale } from '../../types';
import { classNames } from '../../utils/classNames';
import { gradeColor, gradeLabel } from '../../utils/grades';
import { Chip, SectionTitle } from '../common';

type FilterPanelProps = {
  copy: Copy;
  locale: Locale;
  filters: Filters;
  categories: string[];
  attacks: string[];
  stances: string[];
  weapons: string[];
  levels: Grade[];
  onChange: (filters: Filters) => void;
};

export const FilterPanel = ({
  copy,
  locale,
  filters,
  categories,
  attacks,
  stances,
  weapons,
  levels,
  onChange,
}: FilterPanelProps): JSX.Element => {
  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const handleToggle = <K extends keyof Filters>(key: K, value: Filters[K]): void => {
    const next = { ...filters, [key]: filters[key] === value ? undefined : value };
    onChange(next);
  };

  const handleReset = (): void => onChange({});

  return (
    <div className="space-y-3">
      <SectionTitle>{copy.filters}</SectionTitle>
      <div className="flex flex-wrap gap-2">
        <DropdownChips
          label={copy.category}
          items={categories}
          value={filters.category}
          onSelect={(value) => handleToggle('category', value)}
        />
        <DropdownChips
          label={copy.attack}
          items={attacks}
          value={filters.attack}
          onSelect={(value) => handleToggle('attack', value)}
        />
        <DropdownChips
          label={copy.stance}
          items={stances}
          value={filters.stance}
          onSelect={(value) => handleToggle('stance', value)}
        />
        <DropdownChips
          label={copy.weapon}
          items={weapons}
          value={filters.weapon}
          onSelect={(value) => handleToggle('weapon', value)}
        />
        <LevelDropdown
          label={copy.level}
          locale={locale}
          items={levels}
          value={filters.level}
          onSelect={(value) => handleToggle('level', value)}
        />
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="px-2 py-1 text-xs rounded-full border btn-tonal surface-hover"
        >
          Reset
        </button>
      )}
    </div>
  );
};

type DropdownProps = {
  label: string;
  items: string[];
  value?: string;
  onSelect: (value: string) => void;
};

const DropdownChips = ({ label, items, value, onSelect }: DropdownProps): JSX.Element => {
  const [open, setOpen] = useState(false);

  const handleSelect = (item: string): void => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={classNames(
          'px-3 py-1.5 rounded-lg border text-sm',
          value ? 'btn-contrast' : 'btn-tonal surface-hover',
        )}
      >
        {label}
        {value ? `: ${value}` : ''}
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-56 surface border surface-border rounded-xl shadow-lg p-2 max-h-64 overflow-auto">
          <div className="grid grid-cols-1 gap-1">
            {items.map((item) => (
              <Chip key={item} label={item} active={value === item} onClick={() => handleSelect(item)} />
            ))}
            {items.length === 0 && (
              <div className="px-2 py-1 text-xs text-muted">—</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type LevelDropdownProps = {
  label: string;
  locale: Locale;
  items: Grade[];
  value?: Grade;
  onSelect: (value: Grade) => void;
};

const LevelDropdown = ({ label, locale, items, value, onSelect }: LevelDropdownProps): JSX.Element => {
  const [open, setOpen] = useState(false);

  const handleSelect = (grade: Grade): void => {
    onSelect(grade);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={classNames(
          'px-3 py-1.5 rounded-lg border text-sm',
          value ? 'btn-contrast' : 'btn-tonal surface-hover',
        )}
      >
        {label}
        {value ? `: ${gradeLabel(value, locale)}` : ''}
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-56 surface border surface-border rounded-xl shadow-lg p-2 max-h-64 overflow-auto">
          <div className="grid grid-cols-1 gap-1">
            {items.map((grade) => (
              <button
                type="button"
                key={grade}
                onClick={() => handleSelect(grade)}
                className={classNames(
                  'flex items-center gap-2 px-2 py-1 rounded-lg border text-xs',
                  gradeColor[grade],
                  value === grade ? 'border-contrast' : 'border-transparent',
                )}
              >
                {gradeLabel(grade, locale)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
