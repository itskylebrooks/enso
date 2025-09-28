import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';
import type { Filters, Grade, Locale } from '../../types';
import { gradePalette } from '../../styles/belts';
import { classNames } from '../../utils/classNames';
import { getLevelLabel, getOrderedTaxonomyValues, getTaxonomyLabel, type TaxonomyType } from '../../i18n/taxonomy';

const buildTaxonomyOptions = (locale: Locale, type: TaxonomyType, values: string[]) => {
  const ordered = getOrderedTaxonomyValues(type);
  const known = new Set(ordered);
  const extras = values.filter((value) => value && !known.has(value));
  const entries = [...ordered, ...extras];
  return entries.map((value) => ({
    value,
    label: getTaxonomyLabel(locale, type, value),
  }));
};

type MobileFiltersProps = {
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

type SectionKey = 'category' | 'attack' | 'stance' | 'weapon' | 'level';

type Option = {
  value: string;
  label: string;
  badge?: ReactElement;
};

export const MobileFilters = ({
  copy,
  locale,
  filters,
  categories,
  attacks,
  stances,
  weapons,
  levels,
  onChange,
}: MobileFiltersProps): ReactElement => {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const categoryOptions = useMemo(() => buildTaxonomyOptions(locale, 'category', categories), [categories, locale]);
  const attackOptions = useMemo(() => buildTaxonomyOptions(locale, 'attack', attacks), [attacks, locale]);
  const normalizedStances = useMemo(() => (stances.length > 0 ? stances : ['omote', 'ura']), [stances]);
  const stanceOptions = useMemo(
    () => buildTaxonomyOptions(locale, 'stance', normalizedStances),
    [normalizedStances, locale],
  );
  const weaponOptions = useMemo(() => buildTaxonomyOptions(locale, 'weapon', weapons), [weapons, locale]);
  const levelOptions = useMemo<Option[]>(
    () =>
      levels.map((grade) => ({
        value: grade,
        label: getLevelLabel(locale, grade),
        badge: (
          <span
            aria-hidden
            className="inline-flex h-4 w-12 flex-shrink-0 items-center justify-center rounded-sm border"
            style={{
              backgroundColor: gradePalette[grade].bg,
              color: gradePalette[grade].fg,
              borderColor:
                gradePalette[grade].fg === '#FFFFFF' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)',
            }}
          />
        ),
      })),
    [levels, locale],
  );

  const toggleValue = <K extends keyof Filters>(key: K, value: Filters[K] | undefined): void => {
    const next = { ...filters, [key]: filters[key] === value ? undefined : value };
    onChange(next);
  };

  const sections: Array<{ key: SectionKey; title: string; options: Option[]; selected?: string }> = [
    { key: 'category', title: copy.category, options: categoryOptions, selected: filters.category },
    { key: 'attack', title: copy.attack, options: attackOptions, selected: filters.attack },
    { key: 'stance', title: copy.stance, options: stanceOptions, selected: filters.stance },
    { key: 'weapon', title: copy.weapon, options: weaponOptions, selected: filters.weapon },
    { key: 'level', title: copy.level, options: levelOptions, selected: filters.level },
  ];

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle">{copy.filters}</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-xs font-medium underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
          >
            {copy.resetFilters}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {sections.map(({ key, title, options, selected }) => {
          const isOpen = openSection === key;
          return (
            <div key={key} className="border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]/70">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                aria-expanded={isOpen}
                onClick={() => setOpenSection(isOpen ? null : key)}
              >
                <span className="text-sm font-medium">{title}</span>
                <span aria-hidden className="text-xs text-subtle">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-[var(--color-border)]">
                  <ul className="max-h-64 overflow-y-auto p-2 space-y-2">
                    {options.map(({ value, label, badge }) => {
                      const active = selected === value;
                      return (
                        <li key={value}>
                          <button
                            type="button"
                            className={classNames(
                              'w-full rounded-lg border px-3 py-2.5 text-sm flex items-center justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                              active
                                ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] font-semibold shadow-sm'
                                : 'surface surface-border hover:border-[var(--color-text)]',
                            )}
                            aria-pressed={active}
                            onClick={() => toggleValue(key, active ? undefined : (value as Filters[SectionKey]))}
                          >
                            <span className="truncate">{label}</span>
                            {badge}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
