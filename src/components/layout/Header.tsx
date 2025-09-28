import type { PropsWithChildren } from 'react';
import { classNames } from '../../utils/classNames';
import type { AppTab } from '../../types';
import type { Copy } from '../../constants/i18n';

type HeaderProps = {
  copy: Copy;
  tab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  onSearch: () => void;
  onSettings: () => void;
};

export const Header = ({ copy, tab, onChangeTab, onSearch, onSettings }: HeaderProps): JSX.Element => (
  <header className="surface border-b surface-border sticky top-0 z-20 backdrop-blur">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-contrast flex items-center justify-center">
          <div className="w-4 h-4 rounded-full border border-contrast" />
        </div>
        <div className="font-semibold tracking-tight">{copy.app}</div>
      </div>
      <nav className="flex items-center gap-2">
        <TextButton onClick={onSearch}>{copy.searchBtn}</TextButton>
        <TabButton active={tab === 'library'} onClick={() => onChangeTab('library')}>
          {copy.library}
        </TabButton>
        <TabButton active={tab === 'progress'} onClick={() => onChangeTab('progress')}>
          {copy.progress}
        </TabButton>
        <div className="w-px h-6 nav-divider mx-1" />
        <IconButton label={copy.settings} onClick={onSettings}>
          ⚙️
        </IconButton>
      </nav>
    </div>
  </header>
);

type ButtonProps = PropsWithChildren<{ active?: boolean; label?: string; onClick: () => void }>;

const TabButton = ({ active = false, children, onClick }: ButtonProps): JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      'px-3 py-1.5 rounded-lg text-sm border',
      active ? 'btn-contrast' : 'btn-tonal surface-hover',
    )}
  >
    {children}
  </button>
);

const TextButton = ({ children, onClick }: ButtonProps): JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    className="px-3 py-1.5 rounded-lg text-sm border btn-tonal surface-hover"
  >
    {children}
  </button>
);

const IconButton = ({ children, label, onClick }: ButtonProps): JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1.5 rounded-lg border btn-tonal surface-hover text-sm"
    title={label}
  >
    <span aria-hidden>{children}</span>
  </button>
);
