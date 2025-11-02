import { forwardRef, useState, useEffect, useRef, type PropsWithChildren, type ReactElement, type RefObject } from 'react';
import { classNames } from '../../utils/classNames';
import type { AppRoute } from '@shared/types';
import type { Copy } from '@shared/constants/i18n';
import { Search, Settings, Menu, Bookmark, LibraryBig, BookOpenText, Compass, ChevronDown, Milestone, MessageSquare, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMotionPreferences, defaultEase } from '../ui/motion';
import { Logo } from '@shared/components';

// Hook to detect scroll direction and manage smart sticky header for mobile
const useSmartSticky = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check if mobile on mount and on resize
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) {
        setIsVisible(true);
      }
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Scrolling down - hide header
          if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setIsVisible(false);
          } 
          // Scrolling up - show header
          else if (currentScrollY < lastScrollY.current) {
            setIsVisible(true);
          }
          // Near top - always show
          else if (currentScrollY < 50) {
            setIsVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  return { isVisible, headerRef, isMobile };
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreDesktopOpen, setMoreDesktopOpen] = useState(false);
  const [moreMobileOpen, setMoreMobileOpen] = useState(false);
  const { overlayMotion, prefersReducedMotion } = useMotionPreferences();
  const { isVisible, headerRef, isMobile } = useSmartSticky();
  const isGuideActive = route === 'guide' || route === 'guideAdvanced' || route === 'guideDan';
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

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

  // Auto-close menu on outside click or scroll
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };

    const handleScroll = () => {
      setMenuOpen(false);
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
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
  }, [menuOpen]);

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
    <motion.header 
      ref={headerRef}
      className="surface border-b surface-border sticky top-0 z-20 backdrop-blur"
      animate={{ y: isMobile && !isVisible ? -80 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
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
              'px-3 py-2 rounded-lg border inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              isGuideActive ? 'btn-contrast' : 'btn-tonal surface-hover',
            )}
            aria-pressed={isGuideActive}
            aria-current={isGuideActive ? 'page' : undefined}
            aria-label={copy.guideLink}
          >
            <Compass className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className={classNames(
              'px-3 py-2 rounded-lg border inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              route === 'library' ? 'btn-contrast' : 'btn-tonal surface-hover',
            )}
            aria-pressed={route === 'library'}
            aria-current={route === 'library' ? 'page' : undefined}
            aria-label={copy.library}
          >
            <LibraryBig className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('glossary')}
            className={classNames(
              'px-3 py-2 rounded-lg border inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              route === 'glossary' ? 'btn-contrast' : 'btn-tonal surface-hover',
            )}
            aria-pressed={route === 'glossary'}
            aria-current={route === 'glossary' ? 'page' : undefined}
            aria-label={copy.glossary}
          >
            <BookOpenText className="w-4 h-4" />
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
                    className="absolute right-0 mt-2 w-48 rounded-lg border-2 border-[var(--color-text)]/20 bg-[var(--color-surface)] shadow-xl ring-1 ring-black/5 z-30"
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

          {/* Mobile: hamburger + animated dropdown */}
          <div className="md:hidden relative">
            <div className="flex items-center gap-2">
              <IconButton ref={searchButtonRef} onClick={() => onSearch?.('mouse')} label={copy.searchBtn}>
                <Search className="w-5 h-5" />
              </IconButton>
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="px-2 py-1.5 rounded-lg border btn-tonal surface-hover text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                aria-expanded={menuOpen}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  ref={menuRef}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={menuVariants}
                  className="absolute -right-3 mt-4 w-48 rounded-lg border-2 border-[var(--color-text)]/20 bg-[var(--color-surface)] shadow-xl ring-1 ring-black/5 z-30"
                >
                <ul className="px-2 pt-2 pb-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('guide');
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="flex items-center gap-2"><Compass className="w-4 h-4" />{copy.guideLink}</span>
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
                      <span className="flex items-center gap-2"><LibraryBig className="w-4 h-4" />{copy.library}</span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate('glossary');
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                    >
                      <span className="flex items-center gap-2"><BookOpenText className="w-4 h-4" />{copy.glossary}</span>
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
                      <span className="flex items-center gap-2"><Bookmark className="w-4 h-4" />{copy.progress}</span>
                    </button>
                  </li>
                  
                  {/* More trigger inside same list for consistent framing */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setMoreMobileOpen((v) => !v)}
                      className={classNames(
                        'w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)] flex items-center gap-2',
                        moreMobileOpen ? 'bg-[var(--color-surface-hover)]' : undefined,
                      )}
                      aria-expanded={moreMobileOpen}
                      aria-controls="mobile-more-submenu"
                    >
                      <motion.span
                        initial={false}
                        animate={{ rotate: moreMobileOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: defaultEase }}
                        className="inline-flex"
                        aria-hidden
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.span>
                      <span>{copy.more}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {moreMobileOpen && (
                        <motion.div
                          id="mobile-more-submenu"
                          initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto', transition: { duration: 0.22, ease: defaultEase } }}
                        exit={{ opacity: 0, y: -4, height: 0, transition: { duration: 0.2, ease: defaultEase } }}
                        className="overflow-hidden"
                      >
                          <ul className="p-2 pt-1">
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(false);
                                  setMoreMobileOpen(false);
                                  onSettings();
                                }}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                              >
                                <span className="flex items-center gap-2"><Settings className="w-4 h-4" />{copy.settings}</span>
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(false);
                                  setMoreMobileOpen(false);
                                  onNavigate('roadmap');
                                }}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                              >
                                <span className="flex items-center gap-2"><Milestone className="w-4 h-4" />{copy.roadmap}</span>
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(false);
                                  setMoreMobileOpen(false);
                                  onNavigate('feedback');
                                }}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                              >
                                <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />{copy.feedback}</span>
                              </button>
                            </li>
                            
                            <li>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpen(false);
                                  setMoreMobileOpen(false);
                                  onNavigate('about');
                                }}
                                className="w-full text-left px-3 py-2 rounded-md hover:bg-[var(--color-surface-hover)]"
                              >
                                <span className="flex items-center gap-2"><Info className="w-4 h-4" />{copy.aboutLink}</span>
                              </button>
                            </li>
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
    className="px-2 py-1.5 rounded-lg border btn-tonal surface-hover text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
    title={label}
    aria-label={label}
  >
    <span aria-hidden>{children}</span>
  </button>
));

IconButton.displayName = 'IconButton';
