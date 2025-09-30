import type { ReactElement } from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type { GlossaryTerm } from '../../../shared/types';
import { SectionTitle } from '../../../shared/components';
import { classNames } from '../../../shared/utils/classNames';

type GlossaryFilters = {
  category?: GlossaryTerm['category'];
};

type GlossaryFilterPanelProps = {
  copy: Copy;
  filters: GlossaryFilters;
  categories: GlossaryTerm['category'][];
  onChange: (filters: GlossaryFilters) => void;
};

const getCategoryLabel = (category: GlossaryTerm['category'], copy: Copy): string => {
  const labels: Record<GlossaryTerm['category'], string> = {
    movement: copy.categoryMovement,
    stance: copy.categoryStance,
    attack: copy.categoryAttack,
    etiquette: copy.categoryEtiquette,
    philosophy: copy.categoryPhilosophy,
    other: copy.categoryOther,
  };
  return labels[category];
};

export const GlossaryFilterPanel = ({
  copy,
  filters,
  categories,
  onChange,
}: GlossaryFilterPanelProps): ReactElement => {
  const handleCategoryChange = (category: GlossaryTerm['category'] | undefined) => {
    onChange({
      ...filters,
      category,
    });
  };

  const handleReset = () => {
    onChange({});
  };

  const hasActiveFilters = filters.category;

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

      <div className="space-y-4">
        <div className="space-y-3">
          <SectionTitle>{copy.category}</SectionTitle>
          <div className="space-y-2">
            {categories.map((category) => {
              const isActive = filters.category === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleCategoryChange(isActive ? undefined : category)}
                  className={classNames(
                    'flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-soft motion-ease focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] hover:border-[var(--color-text)] hover:bg-[var(--color-surface-hover)]',
                    isActive
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-[var(--color-text)] shadow-sm hover:bg-[var(--color-text)]'
                      : 'surface surface-border',
                  )}
                >
                                            <span className="truncate">{getCategoryLabel(category, copy)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};