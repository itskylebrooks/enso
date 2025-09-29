import { forwardRef, useState, type PropsWithChildren, type ReactElement, type RefObject } from 'react';
import { classNames } from '../../utils/classNames';
import type { AppRoute } from '../../types';
import type { Copy } from '../../constants/i18n';
import { SearchIcon, SettingsIcon, MenuIcon, BookmarkIcon, PersonStandingIcon, BookOpenTextIcon } from '../common/icons';
import { motion } from 'motion/react';
import { useMotionPreferences } from '../ui/motion';
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
}: HeaderProps): ReactElement => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { overlayMotion, prefersReducedMotion, toggleTransition } = useMotionPreferences();

  return (
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
          <div className="hidden md:flex items-center gap-2">
            <TextButton ref={searchButtonRef} onClick={onSearch}>
              <span className="flex items-center gap-1">
                <SearchIcon className="w-4 h-4" />
                <span>{copy.searchBtn}</span>
              </span>
            </TextButton>
            <TabButton active={route === 'basics'} onClick={() => onNavigate('basics')}>
              <span className="flex items-center gap-1">
                <BookOpenTextIcon className="w-4 h-4" />
                <span>{copy.basicsLink}</span>
              </span>
            </TabButton>
            <TabButton active={route === 'library'} onClick={() => onNavigate('library')}>
              <span className="flex items-center gap-1">
                <PersonStandingIcon className="w-4 h-4" />
                <span>{copy.library}</span>
              </span>
            </TabButton>
            <TabButton active={route === 'bookmarks'} onClick={() => onNavigate('bookmarks')}>
              <span className="flex items-center gap-1">
                <BookmarkIcon className="w-4 h-4" />
                <span>{copy.progress}</span>
              </span>
            </TabButton>
            <TextButton ref={settingsButtonRef} onClick={onSettings}>
              <span className="flex items-center gap-1">
                <SettingsIcon className="w-5 h-5" />
                <span>{copy.settings}</span>
              </span>
            </TextButton>
          </div>

          {/* Mobile: hamburger + animated dropdown */}
          <div className="md:hidden relative">
            <div className="flex items-center gap-2">
              <IconButton ref={searchButtonRef} onClick={onSearch} label={copy.searchBtn}>
                <SearchIcon className="w-5 h-5" />
              </IconButton>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="px-2 py-1.5 rounded-lg border btn-tonal surface-hover text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                aria-expanded={menuOpen}
                aria-label="Open menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
            </div>

            {menuOpen && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={overlayMotion.panel}
                transition={prefersReducedMotion ? { duration: 0.05 } : toggleTransition}
                className="absolute right-0 mt-2 w-56 rounded-lg border surface border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg z-30"
              >
                <ul className="p-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('basics');
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="flex items-center gap-2"><BookOpenTextIcon className="w-4 h-4" />{copy.basicsLink}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('library');
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="flex items-center gap-2"><PersonStandingIcon className="w-4 h-4" />{copy.library}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('bookmarks');
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="flex items-center gap-2"><BookmarkIcon className="w-4 h-4" />{copy.progress}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onSettings();
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="flex items-center gap-2"><SettingsIcon className="w-4 h-4" />{copy.settings}</span>
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

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
