import type { ReactElement } from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type { GlossaryTerm } from '../../../shared/types';
import { SectionTitle } from '../../../shared/components';
import { Chip } from '../../../shared/components/ui/Chip';

type GlossaryFilters = {
  category?: GlossaryTerm['category'];
};

type GlossaryFilterPanelProps = {
  copy: Copy;
  filters: GlossaryFilters;
  categories: GlossaryTerm['category'][];
  onChange: (filters: GlossaryFilters) => void;
};

const getCategoryLabel = (category: GlossaryTerm['category']): string => {
  const labels: Record<GlossaryTerm['category'], string> = {
    movement: 'Movement',
    stance: 'Stance',
    attack: 'Attack',
    etiquette: 'Etiquette',
    philosophy: 'Philosophy',
    other: 'Other',
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
            className="text-xs text-muted hover:text-primary underline"
          >
            {copy.resetFilters}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-subtle uppercase tracking-wide">
            {copy.category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Chip
                key={category}
                label={getCategoryLabel(category)}
                active={filters.category === category}
                onClick={() => 
                  handleCategoryChange(filters.category === category ? undefined : category)
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};