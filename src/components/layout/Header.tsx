import { forwardRef, type PropsWithChildren, type ReactElement, type RefObject } from 'react';
import { classNames } from '../../utils/classNames';
import type { AppRoute } from '../../types';
import type { Copy } from '../../constants/i18n';
import { SearchIcon, SettingsIcon } from '../common/icons';
import { Logo } from '../common';

type HeaderProps = {
  copy: Copy;
  route: AppRoute;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  onSearch: () => void;
  onSettings: () => void;
  searchButtonRef: RefObject<HTMLButtonElement | null>;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
};

export const Header = ({
  copy,
  route,
  onNavigate,
  onSearch,
  onSettings,
  searchButtonRef,
  settingsButtonRef,
}: HeaderProps): ReactElement => (
  <header className="surface border-b surface-border sticky top-0 z-20 backdrop-blur">
    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
      <a
        href="/"
        onClick={(event) => {
          event.preventDefault();
          onNavigate('home');
        }}
        className="flex items-center gap-3 rounded-lg px-1 py-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-colors hover:opacity-90"
        aria-label={copy.app}
      >
        <Logo className="shrink-0" />
        <div className="font-semibold tracking-tight">{copy.app}</div>
      </a>
      <nav className="flex items-center gap-2">
        <TextButton ref={searchButtonRef} onClick={onSearch}>
          <span className="flex items-center gap-1">
            <SearchIcon className="w-4 h-4" />
            <span>{copy.searchBtn}</span>
          </span>
        </TextButton>
        <TabButton active={route === 'library'} onClick={() => onNavigate('library')}>
          {copy.library}
        </TabButton>
        <TabButton active={route === 'progress'} onClick={() => onNavigate('progress')}>
          {copy.progress}
        </TabButton>
        <div className="w-px h-6 nav-divider mx-1" />
        <IconButton ref={settingsButtonRef} label={copy.settings} onClick={onSettings}>
          <SettingsIcon className="w-5 h-5" />
        </IconButton>
      </nav>
    </div>
  </header>
);

type ButtonProps = PropsWithChildren<{ active?: boolean; label?: string; onClick: () => void }>;

const TabButton = ({ active = false, children, onClick }: ButtonProps): ReactElement => (
  <button
    type="button"
    onClick={onClick}
    className={classNames(
      'px-3 py-1.5 rounded-lg text-sm border',
      active ? 'btn-contrast' : 'btn-tonal surface-hover',
    )}
    aria-pressed={active}
    aria-current={active ? 'page' : undefined}
  >
    {children}
  </button>
);

const TextButton = forwardRef<HTMLButtonElement, ButtonProps>(({ children, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className="px-3 py-1.5 rounded-lg text-sm border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
  >
    {children}
  </button>
));

TextButton.displayName = 'TextButton';

const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(({ children, label, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className="px-2 py-1.5 rounded-lg border btn-tonal surface-hover text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
    title={label}
    aria-label={label}
  >
    <span aria-hidden>{children}</span>
  </button>
));

IconButton.displayName = 'IconButton';
