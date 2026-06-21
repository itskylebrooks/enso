import { Logo } from '@shared/components';
import { defaultEase, useMotionPreferences } from '@shared/components/ui/motion';
import type { Copy } from '@shared/constants/i18n';
import { getSectionForRoute, type AppSection } from '@shared/navigation/appRoutes';
import type { AppRoute } from '@shared/types';
import {
  Bookmark,
  ChevronDown,
  Compass,
  Info,
  LibraryBig,
  MessageSquare,
  School,
  Search,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, type Transition, type Variants } from 'motion/react';
import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
  type RefObject,
} from 'react';
import { classNames } from '../../utils/classNames';

type HeaderProps = {
  copy: Copy;
  route: AppRoute;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  onSearch: (method?: 'keyboard' | 'mouse') => void;
  onSettings: () => void;
  onStartTour: () => void;
  searchButtonRef: RefObject<HTMLButtonElement | null>;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
};

const desktopDropdownVariants: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: defaultEase },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.18, ease: defaultEase },
  },
};

const createMobileMenuVariants = (
  prefersReducedMotion: boolean,
  panelTransition: Transition,
): Variants => ({
  initial: prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 },
  animate: prefersReducedMotion
    ? { opacity: 1, transition: { duration: 0.12 } }
    : { opacity: 1, y: 0, scale: 1, transition: panelTransition },
  exit: prefersReducedMotion
    ? { opacity: 0, transition: { duration: 0.12 } }
    : {
        opacity: 0,
        y: -8,
        scale: 0.98,
        transition: { duration: 0.3, ease: defaultEase },
      },
});

const primaryNav: Array<{
  section: AppSection;
  route: AppRoute;
  tourTarget: string;
  labelKey: 'examsLink' | 'library' | 'study' | 'teach';
  icon: LucideIcon;
}> = [
  { section: 'exams', route: 'exams', tourTarget: 'nav-exams', labelKey: 'examsLink', icon: Compass },
  {
    section: 'library',
    route: 'library',
    tourTarget: 'nav-library',
    labelKey: 'library',
    icon: LibraryBig,
  },
  { section: 'study', route: 'study', tourTarget: 'nav-study', labelKey: 'study', icon: Bookmark },
  { section: 'teach', route: 'teach', tourTarget: 'nav-teach', labelKey: 'teach', icon: School },
];

export const Header = ({
  copy,
  route,
  onNavigate,
  onSearch,
  onSettings,
  onStartTour,
  searchButtonRef,
  settingsButtonRef,
}: HeaderProps): ReactElement => {
  const [moreDesktopOpen, setMoreDesktopOpen] = useState(false);
  const [moreMobileOpen, setMoreMobileOpen] = useState(false);
  const { prefersReducedMotion, overlayMotion } = useMotionPreferences();
  const mobileMenuVariants = useMemo(
    () => createMobileMenuVariants(prefersReducedMotion, overlayMotion.panelTransition),
    [prefersReducedMotion, overlayMotion.panelTransition],
  );
  const activeSection = getSectionForRoute(route);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMobileMenuRef = useRef<HTMLDivElement>(null);
  const moreMobileButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-close mobile "More" menu on outside click or scroll
  useEffect(() => {
    if (!moreMobileOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        moreMobileMenuRef.current?.contains(target) ||
        moreMobileButtonRef.current?.contains(target)
      ) {
        return;
      }
      setMoreMobileOpen(false);
    };

    const handleScroll = () => {
      setMoreMobileOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMoreMobileOpen(false);
        moreMobileButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleKey);
    };
  }, [moreMobileOpen]);

  // Close desktop "More" dropdown on outside click / Esc
  useEffect(() => {
    if (!moreDesktopOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (moreMenuRef.current?.contains(target) || moreButtonRef.current?.contains(target)) {
        return;
      }
      setMoreDesktopOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMoreDesktopOpen(false);
        moreButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [moreDesktopOpen]);

  return (
    <motion.header className="surface border-b surface-border sticky top-0 z-20 backdrop-blur no-select">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between relative">
        <a
          href="/"
          onClick={(event) => {
            event.preventDefault();
            onNavigate('home');
          }}
          className="flex items-center gap-3 rounded-lg px-1 py-1 -m-1 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)] transition-colors hover:opacity-90"
          aria-label={copy.app}
        >
          <Logo className="shrink-0" />
          <div className="font-semibold tracking-tight">{copy.app}</div>
        </a>
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-2 inset-y-0">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.section;
            const label = copy[item.labelKey];

            return (
              <button
                key={item.section}
                type="button"
                onClick={() => onNavigate(item.route)}
                data-tour-target={item.tourTarget}
                className={classNames(
                  'px-3 py-2 rounded-lg border inline-flex items-center gap-2 justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)] !transition-colors !duration-150 !ease-in-out',
                  isActive ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
                aria-pressed={isActive}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{label}</span>
              </button>
            );
          })}
        </div>
        <nav className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <div className="ml-4">
              <button
                ref={searchButtonRef}
                type="button"
                onClick={() => onSearch?.('mouse')}
                className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
                aria-label={copy.searchBtn}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {/* Desktop More dropdown */}
            <div className="relative">
              <button
                ref={moreButtonRef}
                type="button"
                onClick={() => setMoreDesktopOpen((v) => !v)}
                className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
                aria-haspopup="menu"
                aria-expanded={moreDesktopOpen}
                aria-label={copy.more}
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {moreDesktopOpen && (
                  <motion.div
                    ref={moreMenuRef}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={desktopDropdownVariants}
                    className="absolute right-0 mt-2 w-48 rounded-lg border surface-border bg-[var(--color-surface)] panel-shadow z-30"
                    role="menu"
                  >
                    <ul className="p-2">
                      <li>
                        <button
                          ref={settingsButtonRef as RefObject<HTMLButtonElement>}
                          type="button"
                          onClick={() => {
                            setMoreDesktopOpen(false);
                            onSettings();
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                          role="menuitem"
                        >
                          <span className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            {copy.settings}
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreDesktopOpen(false);
                            onNavigate('feedback');
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                          role="menuitem"
                        >
                          <span className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            {copy.feedback}
                          </span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreDesktopOpen(false);
                            onStartTour();
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                          role="menuitem"
                        >
                          <span className="flex items-center gap-2">
                            <Compass className="w-4 h-4" />
                            {copy.startTour}
                          </span>
                        </button>
                      </li>

                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreDesktopOpen(false);
                            onNavigate('about');
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                          role="menuitem"
                        >
                          <span className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            {copy.aboutLink}
                          </span>
                        </button>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Settings moved into More dropdown */}
          </div>

          {/* Mobile: search + bookmarks + more */}
          <div className="md:hidden relative">
            <div className="flex items-center gap-2">
              <IconButton
                ref={searchButtonRef}
                onClick={() => onSearch?.('mouse')}
                label={copy.searchBtn}
              >
                <Search className="w-5 h-5" />
              </IconButton>
              <button
                ref={moreMobileButtonRef}
                type="button"
                onClick={() => setMoreMobileOpen((v) => !v)}
                className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
                aria-haspopup="menu"
                aria-expanded={moreMobileOpen}
                aria-label={copy.more}
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence>
              {moreMobileOpen && (
                <motion.div
                  ref={moreMobileMenuRef}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={mobileMenuVariants}
                  className="absolute right-0 mt-4 w-48 rounded-lg border surface-border bg-[var(--color-surface)] panel-shadow z-30"
                  role="menu"
                >
                  <ul className="p-2">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMobileOpen(false);
                          onSettings();
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          {copy.settings}
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMobileOpen(false);
                          onNavigate('feedback');
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {copy.feedback}
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMobileOpen(false);
                          onStartTour();
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <Compass className="w-4 h-4" />
                          {copy.startTour}
                        </span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMobileOpen(false);
                          onNavigate('about');
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          {copy.aboutLink}
                        </span>
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>
    </motion.header>
  );
};

type ButtonProps = PropsWithChildren<{ active?: boolean; label?: string; onClick: () => void }>;

const TextButton = forwardRef<HTMLButtonElement, ButtonProps>(({ children, onClick }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    className="px-3 py-1.5 rounded-lg text-sm border btn-tonal surface-hover focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
  >
    {children}
  </button>
));

TextButton.displayName = 'TextButton';

const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, label, onClick }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text)]"
      title={label}
      aria-label={label}
    >
      <span aria-hidden>{children}</span>
    </button>
  ),
);

IconButton.displayName = 'IconButton';
