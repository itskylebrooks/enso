import type { ReactElement } from 'react';
import { Undo2 } from 'lucide-react';
import type { Copy } from '@shared/constants/i18n';
import type { ChildrenGameFilters, ChildrenGameMaterial } from '@shared/types';
import { usePinnedSidebarSection } from '@shared/components/ui';
import { defaultChildrenGameFilters } from '../filterModel';
import { ChildrenGamesFilterFields } from './ChildrenGamesFilterFields';

type ChildrenGamesFilterPanelProps = {
  copy: Copy;
  filters: ChildrenGameFilters;
  materials: ChildrenGameMaterial[];
  onChange: (filters: ChildrenGameFilters) => void;
};

export const ChildrenGamesFilterPanel = ({
  copy,
  filters,
  materials,
  onChange,
}: ChildrenGamesFilterPanelProps): ReactElement => {
  const isPinnedSection = usePinnedSidebarSection();
  const hasActiveFilters =
    filters.participantCount !== undefined ||
    filters.settings.length > 0 ||
    filters.materials.length > 0;
  const showHeader = !isPinnedSection || hasActiveFilters;

  return (
    <div className="space-y-6 no-select">
      {showHeader && (
        <div className="flex items-center justify-between gap-2">
          {!isPinnedSection && (
            <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">
              {copy.filters}
            </h2>
          )}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onChange(defaultChildrenGameFilters)}
              aria-label={copy.resetFilters}
              className="rounded-lg p-1.5 text-subtle transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              <Undo2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}
      <ChildrenGamesFilterFields
        copy={copy}
        filters={filters}
        materials={materials}
        onChange={onChange}
      />
    </div>
  );
};
