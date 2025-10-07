import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { Filters, Grade, Locale } from '@shared/types';
import { classNames } from '../../utils/classNames';
import { gradePalette } from '@shared/styles/belts';
import { getLevelLabel, getOrderedTaxonomyValues, getTaxonomyLabel, type TaxonomyType } from '@shared/i18n/taxonomy';
import { ENTRY_MODE_ORDER } from '@shared/constants/entryModes';
import { SectionTitle } from '../index';
import { useMotionPreferences } from './motion';
import { PencilLineIcon, ChevronDownIcon } from './icons';

type MobileFiltersProps = {
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
  onContribute?: () => void;
  onContributePrefetch?: () => void;
};

type SectionKey = 'category' | 'attack' | 'stance' | 'weapon' | 'level' | 'trainer';

type Option = {
  value: string;
  label: string;
  trailing?: ReactElement;
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
  return options.sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'accent', caseFirst: 'upper' }));
};

const buildEntryModeOptions = (locale: Locale, values: string[]): Option[] => {
  const entryModeLabels: Record<string, string> = {
    irimi: locale === 'de' ? 'Irimi' : 'Irimi',
    tenkan: locale === 'de' ? 'Tenkan' : 'Tenkan',
    omote: locale === 'de' ? 'Omote' : 'Omote',
    ura: locale === 'de' ? 'Ura' : 'Ura',
  };

  return values.map((value) => ({ value, label: entryModeLabels[value] || value }));
};

const buildTrainerOptions = (locale: Locale, values: string[]): Option[] => {
  const formatTrainerName = (trainerId: string): string =>
    trainerId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const options = values.map((value) => ({ value, label: formatTrainerName(value) }));

  const hasBase = values.includes('base-forms');
  if (hasBase) {
    const filtered = options.filter((o) => o.value !== 'base-forms');
    return [{ value: 'base-forms', label: locale === 'de' ? 'Grundformen' : 'Base forms' }, ...filtered.sort((a, b) => a.label.localeCompare(b.label, locale))];
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, locale));
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
  trainers,
  onChange,
  onContribute,
  onContributePrefetch,
}: MobileFiltersProps): ReactElement => {
  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    category: true,
    attack: false,
    stance: false,
    weapon: false,
    level: false,
    trainer: false,
  });

  const toggleOpen = (key: SectionKey): void => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const normalizedStances = useMemo(() => (stances.length > 0 ? stances : ENTRY_MODE_ORDER), [stances]);

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

  const handleReset = (): void => onChange({});

  return (
    <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>{copy.filters}</SectionTitle>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
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
        isOpen={open.category}
        onToggle={() => toggleOpen('category')}
      />

      <FilterSection
        title={copy.attack}
        options={attackOptions}
        selected={filters.attack}
        onSelect={(value) => handleToggle('attack', value)}
        isOpen={open.attack}
        onToggle={() => toggleOpen('attack')}
      />

      <FilterSection
        title={copy.stance}
        options={stanceOptions}
        selected={filters.stance}
        onSelect={(value) => handleToggle('stance', value)}
        isOpen={open.stance}
        onToggle={() => toggleOpen('stance')}
      />

      <FilterSection
        title={copy.weapon}
        options={weaponOptions}
        selected={filters.weapon}
        onSelect={(value) => handleToggle('weapon', value)}
        isOpen={open.weapon}
        onToggle={() => toggleOpen('weapon')}
      />

      <FilterSection
        title={copy.trainer}
        options={trainerOptions}
        selected={filters.trainer}
        onSelect={(value) => handleToggle('trainer', value)}
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

      {onContribute && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onContribute}
            onMouseEnter={onContributePrefetch}
            onFocus={onContributePrefetch}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border surface-border bg-[var(--color-surface)] px-4 py-2 text-sm transition-soft hover-border-adaptive"
          >
            <PencilLineIcon width={20} height={20} aria-hidden />
            {copy.feedbackAddTechniqueCta}
          </button>
        </div>
      )}
    </div>
  );
};

type FilterSectionProps = {
  title: string;
  options: Option[];
  selected?: string;
  onSelect: (value: string | undefined) => void;
  isOpen?: boolean;
  onToggle?: () => void;
};

const FilterSection = ({ title, options, selected, onSelect, isOpen = false, onToggle }: FilterSectionProps): ReactElement => {
  const { collapseMotion } = useMotionPreferences();

  return (
    <section className="mb-3">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left rounded-lg px-3 py-2 bg-[var(--color-surface)]/0 hover:bg-[var(--color-surface-hover)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] touch-manipulation"
        style={{ minHeight: 40 }}
      >
        <SectionTitle><span className="text-sm">{title}</span></SectionTitle>
        <motion.span aria-hidden className="text-subtle" animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.2, ease: 'easeInOut' }}>
          <ChevronDownIcon className="w-4 h-4" />
        </motion.span>
      </button>

      <motion.div className="overflow-hidden" initial={false} animate={isOpen ? 'open' : 'closed'} variants={collapseMotion.variants} transition={collapseMotion.transition}>
        <div className="pt-3">
          <OptionList options={options} selected={selected} onSelect={onSelect} />
        </div>
      </motion.div>
    </section>
  );
};

type OptionListProps = {
  options: Option[];
  selected?: string;
  onSelect: (value: string | undefined) => void;
};

const OptionList = ({ options, selected, onSelect }: OptionListProps): ReactElement => (
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
            'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)] touch-manipulation',
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
