import { useState, type ReactElement } from 'react';
import { motion } from 'motion/react';
import type { Copy } from '@shared/constants/i18n';
import type { ChildrenGameFilters, ChildrenGameMaterial } from '@shared/types';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { defaultChildrenGameFilters } from '../filterModel';
import { ChildrenGamesFilterFields } from './ChildrenGamesFilterFields';

type MobileChildrenGamesFiltersProps = {
  copy: Copy;
  filters: ChildrenGameFilters;
  materials: ChildrenGameMaterial[];
  onChange: (filters: ChildrenGameFilters) => void;
};

export const MobileChildrenGamesFilters = ({
  copy,
  filters,
  materials,
  onChange,
}: MobileChildrenGamesFiltersProps): ReactElement => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const { collapseMotion } = useMotionPreferences();
  const hasActiveFilters =
    filters.participantCount !== undefined ||
    filters.settings.length > 0 ||
    filters.materials.length > 0;

  return (
    <div className="rounded-2xl border surface-border bg-[var(--color-surface)] p-4">
      <button
        type="button"
        aria-expanded={isPanelOpen}
        onClick={() => setIsPanelOpen((open) => !open)}
        className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-base font-semibold leading-tight focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
      >
        {copy.filters}
      </button>
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={isPanelOpen ? 'open' : 'closed'}
        variants={collapseMotion.variants}
        transition={collapseMotion.transition}
      >
        <div className="pt-3">
          {hasActiveFilters && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => onChange(defaultChildrenGameFilters)}
                className="text-xs font-medium underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              >
                {copy.resetFilters}
              </button>
            </div>
          )}
          <ChildrenGamesFilterFields
            copy={copy}
            filters={filters}
            materials={materials}
            onChange={onChange}
          />
        </div>
      </motion.div>
    </div>
  );
};
