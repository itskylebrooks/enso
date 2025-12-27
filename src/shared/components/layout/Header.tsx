import { forwardRef, useState, useEffect, useRef, type PropsWithChildren, type ReactElement, type RefObject } from 'react';
import { classNames } from '../../utils/classNames';
import type { AppRoute } from '@shared/types';
import type { Copy } from '@shared/constants/i18n';
import { Search, Settings, Bookmark, LibraryBig, BookOpenText, Compass, ChevronDown, Milestone, MessageSquare, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMotionPreferences, defaultEase } from '../ui/motion';
import { Logo } from '@shared/components';

type HeaderProps = {
  copy: Copy;
  route: AppRoute;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
  onSearch: (method?: 'keyboard' | 'mouse') => void;
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
  const [moreDesktopOpen, setMoreDesktopOpen] = useState(false);
  const [moreMobileOpen, setMoreMobileOpen] = useState(false);
  const { overlayMotion, prefersReducedMotion } = useMotionPreferences();
  const isGuideActive =
    route === 'guide' ||
    route === 'guideAdvanced' ||
    route === 'guideDan' ||
    route === 'guideKyu5' ||
    route === 'guideKyu4' ||
    route === 'guideKyu3' ||
    route === 'guideKyu2' ||
    route === 'guideKyu1' ||
    route === 'guideDan1';
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreMobileMenuRef = useRef<HTMLDivElement>(null);
  const moreMobileButtonRef = useRef<HTMLButtonElement>(null);

  // Smoother mobile menu animation with slower exit
  const menuVariants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.05 } },
        exit: { opacity: 0, transition: { duration: 0.05 } },
      }
    : {
        initial: { opacity: 0, y: 12, scale: 0.98 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          // Keep snappy spring on enter
          transition: overlayMotion.panelTransition,
        },
        exit: {
          opacity: 0,
          y: -8,
          scale: 0.98,
          // Make exit smoother and a bit longer so it reads
          transition: { duration: 0.28, ease: defaultEase },
        },
      } as const;

  // Auto-close mobile "More" menu on outside click or scroll
  useEffect(() => {
    if (!moreMobileOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (moreMobileMenuRef.current?.contains(target) || moreMobileButtonRef.current?.contains(target)) {
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
          className="flex items-center gap-3 rounded-lg px-1 py-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] transition-colors hover:opacity-90"
          aria-label={copy.app}
        >
          <Logo className="shrink-0" />
          <div className="font-semibold tracking-tight">{copy.app}</div>
        </a>
        {/* Centered nav (desktop): Guide / Library / Glossary */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center gap-2 inset-y-0">
          <button
            type="button"
            onClick={() => onNavigate('guide')}
            className={classNames(
              'px-3 py-2 rounded-lg border inline-flex items-center gap-2 justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              isGuideActive ? 'btn-contrast' : 'btn-tonal surface-hover',
            )}
            aria-pressed={isGuideActive}
            aria-current={isGuideActive ? 'page' : undefined}
            aria-label={copy.guideLink}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="text-sm">{copy.guideLink}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className={classNames(
              'px-3 py-2 rounded-lg border inline-flex items-center gap-2 justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              route === 'library' ? 'btn-contrast' : 'btn-tonal surface-hover',
            )}
            aria-pressed={route === 'library'}
            aria-current={route === 'library' ? 'page' : undefined}
            aria-label={copy.library}
          >
            <LibraryBig className="w-4 h-4 shrink-0" />
            <span className="text-sm">{copy.library}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('glossary')}
            className={classNames(
              'px-3 py-2 rounded-lg border inline-flex items-center gap-2 justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              route === 'glossary' ? 'btn-contrast' : 'btn-tonal surface-hover',
            )}
            aria-pressed={route === 'glossary'}
            aria-current={route === 'glossary' ? 'page' : undefined}
            aria-label={copy.glossary}
          >
            <BookOpenText className="w-4 h-4 shrink-0" />
            <span className="text-sm">{copy.glossary}</span>
          </button>
        </div>
        <nav className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <div className="ml-4">
              <button
                ref={searchButtonRef}
                type="button"
                onClick={() => onSearch?.('mouse')}
                className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                aria-label={copy.searchBtn}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bookmarks')}
              className={classNames(
                'px-3 py-2 rounded-lg border inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                route === 'bookmarks' ? 'btn-contrast' : 'btn-tonal surface-hover',
              )}
              aria-pressed={route === 'bookmarks'}
              aria-current={route === 'bookmarks' ? 'page' : undefined}
              aria-label={copy.progress}
            >
              <Bookmark className="w-4 h-4" />
            </button>
            {/* Desktop More dropdown */}
            <div className="relative">
              <button
                ref={moreButtonRef}
                type="button"
                onClick={() => setMoreDesktopOpen((v) => !v)}
                className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                aria-haspopup="menu"
                aria-expanded={moreDesktopOpen}
                aria-label={copy.more}
              >
                <motion.span
                  initial={false}
                  animate={{ rotate: moreDesktopOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: defaultEase }}
                  className="inline-flex"
                  aria-hidden
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </button>
              <AnimatePresence>
                {moreDesktopOpen && (
                  <motion.div
                    ref={moreMenuRef}
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: defaultEase } }}
                    exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.2, ease: defaultEase } }}
                    className="absolute right-0 mt-2 w-48 rounded-lg border surface-border bg-[var(--color-surface)] panel-shadow z-30"
                    role="menu"
                  >
                    <ul className="p-2">
                      <li>
                        <button
                          ref={settingsButtonRef as any}
                          type="button"
                          onClick={() => {
                            setMoreDesktopOpen(false);
                            onSettings();
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                          role="menuitem"
                        >
                          <span className="flex items-center gap-2"><Settings className="w-4 h-4" />{copy.settings}</span>
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => {
                            setMoreDesktopOpen(false);
                            onNavigate('roadmap');
                          }}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                          role="menuitem"
                        >
                          <span className="flex items-center gap-2"><Milestone className="w-4 h-4" />{copy.roadmap}</span>
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
                          <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />{copy.feedback}</span>
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
                          <span className="flex items-center gap-2"><Info className="w-4 h-4" />{copy.aboutLink}</span>
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
              <IconButton ref={searchButtonRef} onClick={() => onSearch?.('mouse')} label={copy.searchBtn}>
                <Search className="w-5 h-5" />
              </IconButton>
              <button
                type="button"
                onClick={() => onNavigate('bookmarks')}
                className={classNames(
                  'px-3 py-2 rounded-lg border inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                  route === 'bookmarks' ? 'btn-contrast' : 'btn-tonal surface-hover',
                )}
                aria-pressed={route === 'bookmarks'}
                aria-current={route === 'bookmarks' ? 'page' : undefined}
                aria-label={copy.progress}
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button
                ref={moreMobileButtonRef}
                type="button"
                onClick={() => setMoreMobileOpen((v) => !v)}
                className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                aria-haspopup="menu"
                aria-expanded={moreMobileOpen}
                aria-label={copy.more}
              >
                <motion.span
                  initial={false}
                  animate={{ rotate: moreMobileOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: defaultEase }}
                  className="inline-flex"
                  aria-hidden
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.span>
              </button>
            </div>

            <AnimatePresence>
              {moreMobileOpen && (
                <motion.div
                  ref={moreMobileMenuRef}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={menuVariants}
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
                        <span className="flex items-center gap-2"><Settings className="w-4 h-4" />{copy.settings}</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setMoreMobileOpen(false);
                          onNavigate('roadmap');
                        }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                        role="menuitem"
                      >
                        <span className="flex items-center gap-2"><Milestone className="w-4 h-4" />{copy.roadmap}</span>
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
                        <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />{copy.feedback}</span>
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
                        <span className="flex items-center gap-2"><Info className="w-4 h-4" />{copy.aboutLink}</span>
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
    className="px-3 py-2 rounded-lg border btn-tonal surface-hover inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
    title={label}
    aria-label={label}
  >
    <span aria-hidden>{children}</span>
  </button>
));

IconButton.displayName = 'IconButton';
