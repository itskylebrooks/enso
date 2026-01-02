import type { ReactElement } from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type { GlossaryTerm } from '../../../shared/types';
import { classNames } from '@shared/utils/classNames';
import { usePinButton } from '@shared/components/ui';
import { Undo2, Pin, PinOff } from 'lucide-react';

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
  const pinButtonContext = usePinButton();

  return (
    <div className="space-y-6 no-select">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-subtle">
          {copy.filters}
        </h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              aria-label={copy.resetFilters}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-subtle hover:text-[var(--color-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              <Undo2 className="h-4 w-4" aria-hidden />
            </button>
          )}
          {pinButtonContext && (
            <button
              type="button"
              onClick={pinButtonContext.togglePin}
              className="p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] text-subtle hover:text-[var(--color-text)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              aria-label={pinButtonContext.isPinned ? 'Unpin panel' : 'Pin panel'}
              title={pinButtonContext.isPinned ? 'Unpin panel' : 'Pin panel'}
            >
              {pinButtonContext.isPinned ? (
                <PinOff className="w-4 h-4" aria-hidden />
              ) : (
                <Pin className="w-4 h-4" aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

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
  );
};
