import { useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type { Filters, Grade, Locale } from '../../../shared/types';
import { classNames } from '@shared/utils/classNames';
import { gradePalette } from '../../../shared/styles/belts';
import { getLevelLabel, getOrderedTaxonomyValues, getTaxonomyLabel, type TaxonomyType } from '../../../shared/i18n/taxonomy';
import { SectionTitle } from '../../../shared/components';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { ENTRY_MODE_ORDER } from '../../../shared/constants/entryModes';
import { ChevronDownIcon } from '@shared/components/ui/icons';

type FilterPanelProps = {
  copy: Copy;
  locale: Locale;
  filters: Filters;
  categories: string[];
  attacks: string[];
  stances: string[];
  weapons: string[];
  levels: Grade[];
  trainers: string[];
  onChange: (filters: Filters) => void;
};

type Option = {
  value: string;
  label: string;
  trailing?: ReactNode;
};

const buildTaxonomyOptions = (
  locale: Locale,
  type: TaxonomyType,
  values: string[],
): Option[] => {
  const ordered = getOrderedTaxonomyValues(type);
  const known = new Set(ordered);
  const extras = values.filter((value) => value && !known.has(value));
  const entries = [...ordered, ...extras];
  const options = entries.map((value) => ({ value, label: getTaxonomyLabel(locale, type, value) }));
  
  // Sort all taxonomy types alphabetically by label (requested by user)
  return options.sort((a, b) => a.label.localeCompare(b.label, locale, {
    sensitivity: 'accent',
    caseFirst: 'upper'
  }));
};

const buildEntryModeOptions = (locale: Locale, values: string[]): Option[] => {
  const entryModeLabels: Record<string, string> = {
    'irimi': locale === 'de' ? 'Irimi' : 'Irimi',
    'tenkan': locale === 'de' ? 'Tenkan' : 'Tenkan',
    'omote': locale === 'de' ? 'Omote' : 'Omote',
    'ura': locale === 'de' ? 'Ura' : 'Ura',
  };
  
  return values.map((value) => ({
    value,
    label: entryModeLabels[value] || value,
  }));
};

const buildTrainerOptions = (locale: Locale, values: string[]): Option[] => {
  // Format trainer IDs into more readable names
  const formatTrainerName = (trainerId: string): string => {
    return trainerId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const options = values.map((value) => ({
    value,
    label: formatTrainerName(value),
  }));

  // If there are techniques that are base versions (no trainer), expose a special option
  // We'll include it as value 'base-forms' and label localized via copy/messages where needed
  const hasBase = values.includes('base-forms');
  if (hasBase) {
    // ensure 'base-forms' sits at the top of the list and do not let it be re-sorted
    const filtered = options.filter((o) => o.value !== 'base-forms');
    return [{ value: 'base-forms', label: locale === 'de' ? 'Grundformen' : 'Base forms' }, ...filtered.sort((a, b) => a.label.localeCompare(b.label, locale))];
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, locale));
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
  trainers,
  onChange,
}: FilterPanelProps): ReactNode => {
  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  type SectionKey = 'category' | 'attack' | 'stance' | 'weapon' | 'level' | 'trainer';
  const [open, setOpen] = useState<Record<SectionKey, boolean>>(() => ({
    category: Boolean(filters.category),
    attack: Boolean(filters.attack),
    stance: Boolean(filters.stance),
    weapon: Boolean(filters.weapon),
    level: Boolean(filters.level),
    trainer: Boolean(filters.trainer),
  }));

  const toggleOpen = (key: SectionKey): void => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const availableCategorySet = useMemo(() => new Set(categories.filter(Boolean)), [categories]);
  const availableAttackSet = useMemo(() => new Set(attacks.filter(Boolean)), [attacks]);
  const normalizedStances = useMemo(
    () => (stances.length > 0 ? stances : ENTRY_MODE_ORDER),
    [stances],
  );
  const availableStanceSet = useMemo(() => new Set(normalizedStances.filter(Boolean)), [normalizedStances]);
  const availableWeaponSet = useMemo(() => new Set(weapons.filter(Boolean)), [weapons]);
  const availableTrainerSet = useMemo(() => new Set(trainers.filter(Boolean)), [trainers]);

  const categoryOptions = useMemo(() => buildTaxonomyOptions(locale, 'category', categories), [categories, locale]);
  const attackOptions = useMemo(() => buildTaxonomyOptions(locale, 'attack', attacks), [attacks, locale]);
  const stanceOptions = useMemo(() => buildEntryModeOptions(locale, normalizedStances), [normalizedStances, locale]);
  const weaponOptions = useMemo(() => buildTaxonomyOptions(locale, 'weapon', weapons), [weapons, locale]);
  const trainerOptions = useMemo(() => buildTrainerOptions(locale, trainers), [trainers, locale]);
  const levelOptions = useMemo<Option[]>(
    () =>
      levels.map((grade) => ({
        value: grade,
        label: getLevelLabel(locale, grade),
        trailing: (
          <span
            aria-hidden
            className="inline-flex h-3 w-10 flex-shrink-0 items-center justify-center rounded-sm"
            style={{
              backgroundColor: gradePalette[grade].bg,
              color: gradePalette[grade].fg,
            }}
          />
        ),
      })),
    [levels, locale],
  );

  const handleToggle = <K extends keyof Filters>(key: K, value: Filters[K] | undefined): void => {
    const next = { ...filters, [key]: filters[key] === value ? undefined : value };
    onChange(next);
  };

  // Open sections automatically when filters become active (covers persisted filters and later changes)
  useEffect(() => {
    setOpen((prev) => ({
      ...prev,
      category: prev.category || Boolean(filters.category),
      attack: prev.attack || Boolean(filters.attack),
      stance: prev.stance || Boolean(filters.stance),
      weapon: prev.weapon || Boolean(filters.weapon),
      level: prev.level || Boolean(filters.level),
      trainer: prev.trainer || Boolean(filters.trainer),
    }));
  }, [filters.category, filters.attack, filters.stance, filters.weapon, filters.level, filters.trainer]);

  const handleReset = (): void => onChange({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>{copy.filters}</SectionTitle>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            aria-label={copy.resetFilters}
            className="text-subtle transition-colors duration-150 hover:text-[var(--color-text)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 14 4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
            </svg>
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
        title={copy.trainer}
        options={trainerOptions}
        selected={filters.trainer}
        onSelect={(value) => handleToggle('trainer', value)}
        available={availableTrainerSet}
        isOpen={open.trainer}
        onToggle={() => toggleOpen('trainer')}
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

const FilterSection = ({ title, options, selected, onSelect, available, isOpen = false, onToggle }: FilterSectionProps): ReactNode => {
  const { collapseMotion } = useMotionPreferences();

  return (
    <section>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <SectionTitle>{title}</SectionTitle>
        <motion.span
          aria-hidden
          className="text-subtle"
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDownIcon className="w-4 h-4" />
        </motion.span>
      </button>
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={collapseMotion.variants}
        transition={collapseMotion.transition}
      >
        <div className="pt-3">
          <OptionList options={options} selected={selected} onSelect={onSelect} available={available} />
        </div>
      </motion.div>
    </section>
  );
};

type OptionListProps = {
  options: Option[];
  selected?: string;
  available?: Set<string>;
  onSelect: (value: string | undefined) => void;
};

const OptionList = ({ options, selected, onSelect }: OptionListProps): ReactNode => (
  <div className="space-y-2">
    {options.map(({ value, label, trailing }) => {
      const isActive = selected === value;

      return (
        <button
          key={value}
          type="button"
          aria-pressed={isActive}
          onClick={() => onSelect(isActive ? undefined : value)}
          className={classNames(
            'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
            isActive
              ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] shadow-sm hover:bg-[var(--color-text)]'
              : 'surface surface-border',
          )}
        >
          <span className="truncate">{label}</span>
          {trailing && <span className="ml-3 flex-shrink-0">{trailing}</span>}
        </button>
      );
    })}
  </div>
);
