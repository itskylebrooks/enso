import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Copy } from '../../constants/i18n';
import type { Filters, Grade, Locale } from '../../types';
import { classNames } from '../../utils/classNames';
import { gradeColor, gradeLabel } from '../../utils/grades';
import { SectionTitle } from '../common';

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

type Option = {
  value: string;
  label: string;
  trailing?: ReactNode;
};

const CATEGORY_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    throw: 'Throws (Nage-waza)',
    control: 'Controls / Pins (Osae-waza)',
    immobilization: 'Immobilizations (Katame-waza)',
    weapon: 'Weapons (Buki-waza)',
    ukemi: 'Ukemi',
  },
  de: {
    throw: 'Würfe (Nage-waza)',
    control: 'Kontrollen / Haltegriffe (Osae-waza)',
    immobilization: 'Immobilisationen (Katame-waza)',
    weapon: 'Waffen (Buki-waza)',
    ukemi: 'Ukemi',
  },
};

const CATEGORY_BASE_OPTIONS: Option[] = [
  { value: 'throw', label: 'Throws (Nage-waza)' },
  { value: 'control', label: 'Controls / Pins (Osae-waza)' },
  { value: 'immobilization', label: 'Immobilizations (Katame-waza)' },
  { value: 'weapon', label: 'Weapons (Buki-waza)' },
  { value: 'ukemi', label: 'Ukemi' },
];

const ATTACK_BASE_OPTIONS: Option[] = [
  // Standardized list (user-specified order + spelling)
  { value: 'katate-tori', label: 'Katate-tori' },
  { value: 'ryote-tori', label: 'Ryote-tori' },
  { value: 'katate-ryote-tori', label: 'Katate-ryote-tori' },
  { value: 'mune-tori', label: 'Mune-tori' },
  { value: 'yoko-kubi-shime', label: 'Yoko-kubi-shime' },
  { value: 'ushiro-ryokata-tori', label: 'Ushiro-ryokata-tori' },
  { value: 'ushiro-kakae-tori', label: 'Ushiro-kakae-tori' },
  { value: 'ushiro-ryote-tori', label: 'Ushiro-ryote-tori' },
  { value: 'ushiro-eri-tori', label: 'Ushiro-eri-tori' },
  { value: 'ushiro-katate-tori-kubi-shime', label: 'Ushiro-katate-tori-kubi-shime' },
  { value: 'ushiro-kubi-shime', label: 'Ushiro-kubi-shime' },
  { value: 'yokomen-uchi', label: 'Yokomen-uchi' },
  { value: 'shomen-uchi', label: 'Shōmen-uchi' },
  { value: 'shomen-tsuki', label: 'Shōmen-tsuki' },
  { value: 'yoko-tsuki-soto', label: 'Yoko-tsuki (soto)' },

  // Compatibility with existing dataset values
  { value: 'katate-dori', label: 'Katate-dori' },
  { value: 'morote-dori', label: 'Morote-dori' },
  { value: 'ryote-dori', label: 'Ryōte-dori' },
  { value: 'ushiro-eri-dori', label: 'Ushiro-eri-dori' },
  { value: 'ushiro-ryo-kata-dori', label: 'Ushiro-ryō-kata-dori' },
  { value: 'ushiro-katate-dori-kubishime', label: 'Ushiro-katate-dori Kubishime' },
  { value: 'tsuki', label: 'Tsuki' },
];

const STANCE_OPTIONS: Option[] = [
  { value: 'omote', label: 'Omote (Irimi)' },
  { value: 'ura', label: 'Ura (Tenkan)' },
];

const WEAPON_OPTIONS: Option[] = [
  { value: 'empty-hand', label: 'Empty hand' },
  { value: 'tanto', label: 'Tantō' },
  { value: 'jo', label: 'Jō' },
  { value: 'bokken', label: 'Bokken' },
];

const formatFallbackLabel = (value: string): string =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const mergeOptions = (base: Option[], available: string[]): Option[] => {
  const known = new Set(base.map((option) => option.value));
  const extras = available
    .filter((value) => value && !known.has(value))
    .map<Option>((value) => ({ value, label: formatFallbackLabel(value) }));
  return [...base, ...extras];
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

  type SectionKey = 'category' | 'attack' | 'stance' | 'weapon' | 'level';
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    category: true,
    attack: false,
    stance: false,
    weapon: false,
    level: false,
  });

  const toggleOpen = (key: SectionKey): void => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const availableCategorySet = useMemo(() => new Set(categories), [categories]);
  const availableAttackSet = useMemo(() => new Set(attacks), [attacks]);
  const availableStanceSet = useMemo(() => new Set(stances), [stances]);
  const availableWeaponSet = useMemo(() => new Set(weapons), [weapons]);

  const categoryOptions = useMemo(() => {
    const merged = mergeOptions(CATEGORY_BASE_OPTIONS, categories);
    return merged.map((opt) => ({ ...opt, label: CATEGORY_LABELS[locale]?.[opt.value] ?? opt.label }));
  }, [categories, locale]);
  const attackOptions = useMemo(() => mergeOptions(ATTACK_BASE_OPTIONS, attacks), [attacks]);
  const stanceOptions = STANCE_OPTIONS;
  const weaponOptions = useMemo(() => mergeOptions(WEAPON_OPTIONS, weapons), [weapons]);
  const levelOptions = useMemo<Option[]>(
    () =>
      levels.map((grade) => ({
        value: grade,
        label: gradeLabel(grade, locale),
        trailing: (
          <span
            aria-hidden
            className={classNames(
              'inline-flex h-3 w-10 flex-shrink-0 items-center justify-center rounded-sm border border-black/10 text-[0.625rem] font-semibold uppercase tracking-wide dark:border-white/20',
              gradeColor[grade],
            )}
          />
        ),
      })),
    [levels, locale],
  );

  const handleToggle = <K extends keyof Filters>(key: K, value: Filters[K] | undefined): void => {
    const next = { ...filters, [key]: filters[key] === value ? undefined : value };
    onChange(next);
  };

  const handleReset = (): void => onChange({});

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <SectionTitle>{copy.filters}</SectionTitle>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium tracking-[0.2em] uppercase text-subtle transition-colors duration-150 hover:text-[var(--color-text)]"
          >
            {copy.resetFilters}
          </button>
        )}
      </div>

      <FilterSection
        title={copy.category}
        options={categoryOptions}
        selected={filters.category}
        onSelect={(value) => handleToggle('category', value)}
        available={availableCategorySet}
        isOpen={open.category}
        onToggle={() => toggleOpen('category')}
      />

      <FilterSection
        title={copy.attack}
        options={attackOptions}
        selected={filters.attack}
        onSelect={(value) => handleToggle('attack', value)}
        available={availableAttackSet}
        isOpen={open.attack}
        onToggle={() => toggleOpen('attack')}
      />

      <FilterSection
        title={copy.stance}
        options={stanceOptions}
        selected={filters.stance}
        onSelect={(value) => handleToggle('stance', value)}
        available={availableStanceSet}
        isOpen={open.stance}
        onToggle={() => toggleOpen('stance')}
      />

      <FilterSection
        title={copy.weapon}
        options={weaponOptions}
        selected={filters.weapon}
        onSelect={(value) => handleToggle('weapon', value)}
        available={availableWeaponSet}
        isOpen={open.weapon}
        onToggle={() => toggleOpen('weapon')}
      />

      <FilterSection
        title={copy.level}
        options={levelOptions}
        selected={filters.level}
        onSelect={(value) => handleToggle('level', value as Grade | undefined)}
        isOpen={open.level}
        onToggle={() => toggleOpen('level')}
      />
    </div>
  );
};

type FilterSectionProps = {
  title: string;
  options: Option[];
  selected?: string;
  onSelect: (value: string | undefined) => void;
  available?: Set<string>;
  isOpen?: boolean;
  onToggle?: () => void;
};

const FilterSection = ({ title, options, selected, onSelect, available, isOpen = false, onToggle }: FilterSectionProps): JSX.Element => (
  <section className="space-y-3">
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
      className="flex w-full items-center justify-between text-left"
    >
      <SectionTitle>{title}</SectionTitle>
      <span aria-hidden className="text-xs text-subtle">{isOpen ? '▾' : '▸'}</span>
    </button>
    {isOpen && (
      <OptionList options={options} selected={selected} onSelect={onSelect} available={available} />
    )}
  </section>
);

type OptionListProps = {
  options: Option[];
  selected?: string;
  available?: Set<string>;
  onSelect: (value: string | undefined) => void;
};

const OptionList = ({ options, selected, available, onSelect }: OptionListProps): JSX.Element => (
  <div className="space-y-2">
    {options.map(({ value, label, trailing }) => {
      const isActive = selected === value;
      const isAvailable = available ? available.has(value) : true;

      return (
        <button
          key={value}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(isActive ? undefined : value)}
          className={classNames(
            'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
            isActive
              ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] font-semibold shadow-sm hover:bg-[var(--color-text)]'
              : 'surface surface-border',
            !isAvailable && !isActive && 'opacity-60',
          )}
        >
          <span className="truncate">{label}</span>
          {trailing && <span className="ml-3 flex-shrink-0">{trailing}</span>}
        </button>
      );
    })}
  </div>
);
