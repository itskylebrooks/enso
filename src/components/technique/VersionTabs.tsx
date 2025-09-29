import { useMemo, useRef, type KeyboardEvent, type ReactElement } from 'react';
import type { TechniqueVersion } from '../../types';

export type VersionTabsProps = {
  versions: TechniqueVersion[];
  activeVersionId: string;
  onChange: (versionId: string) => void;
  label: string;
};

export const VersionTabs = ({ versions, activeVersionId, onChange, label }: VersionTabsProps): ReactElement => {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const orderedIds = useMemo(() => versions.map((version) => version.id), [versions]);

  const focusTab = (index: number) => {
    const node = refs.current[index];
    if (node) {
      node.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = index === 0 ? orderedIds.length - 1 : index - 1;
      onChange(orderedIds[nextIndex]);
      focusTab(nextIndex);
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = index === orderedIds.length - 1 ? 0 : index + 1;
      onChange(orderedIds[nextIndex]);
      focusTab(nextIndex);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onChange(orderedIds[0]);
      focusTab(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      const lastIndex = orderedIds.length - 1;
      onChange(orderedIds[lastIndex]);
      focusTab(lastIndex);
    }
  };

  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-2">
      {versions.map((version, index) => {
        const isActive = version.id === activeVersionId;
        return (
          <button
            key={version.id}
            ref={(element) => {
              refs.current[index] = element;
            }}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onClick={() => onChange(version.id)}
            className={
              'px-3 py-1.5 text-sm rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] ' +
              (isActive
                ? 'bg-[var(--color-text)] text-[var(--color-bg)] border-transparent'
                : 'bg-[var(--color-surface)] text-subtle border-white/10 hover:text-[var(--color-text)]')
            }
          >
            <span className="font-medium">{version.label}</span>
          </button>
        );
      })}
    </div>
  );
};
