import type { ReactElement } from 'react';
import { BookOpenText, Compass, LibraryBig } from 'lucide-react';
import { motion, type Transition } from 'motion/react';
import type { AppRoute } from '@shared/types';
import type { Copy } from '@shared/constants/i18n';
import { classNames } from '@shared/utils/classNames';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { useSmartSticky } from '@shared/hooks/useSmartSticky';

type MobileTab = 'guide' | 'library' | 'glossary';

type MobileTabBarProps = {
  copy: Copy;
  route: AppRoute;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
};

export const MobileTabBar = ({ copy, route, onNavigate }: MobileTabBarProps): ReactElement => {
  const { prefersReducedMotion } = useMotionPreferences();
  const { isVisible, isMobile } = useSmartSticky();
  const isCompact = isMobile && !isVisible;
  const isGuideActive = route === 'guide' || route === 'guideAdvanced' || route === 'guideDan';
  const activeTab: MobileTab | null = isGuideActive ? 'guide' : route === 'library' ? 'library' : route === 'glossary' ? 'glossary' : null;

  const tabs: Array<{ id: MobileTab; label: string; icon: ReactElement }> = [
    {
      id: 'guide',
      label: copy.guideLink,
      icon: <Compass className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'library',
      label: copy.library,
      icon: <LibraryBig className="h-5 w-5" aria-hidden />,
    },
    {
      id: 'glossary',
      label: copy.glossary,
      icon: <BookOpenText className="h-5 w-5" aria-hidden />,
    },
  ];

  const springLayout: Transition = { type: 'spring', damping: 14, stiffness: 230, mass: 0.7 };
  const springLabel: Transition = { type: 'spring', damping: 16, stiffness: 210, mass: 0.6 };
  const springPill: Transition = { type: 'spring', damping: 12, stiffness: 320, mass: 0.6 };

  const layoutTransition: Transition = prefersReducedMotion ? { duration: 0 } : springLayout;
  const labelTransition: Transition = prefersReducedMotion ? { duration: 0 } : springLabel;
  const pillTransition: Transition = prefersReducedMotion ? { duration: 0 } : springPill;

  return (
    <motion.nav
      className="fixed left-0 right-0 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] md:hidden"
      animate={{ bottom: isCompact ? '0.75rem' : '1.25rem' }}
      initial={false}
      transition={layoutTransition}
      aria-label="Primary navigation"
    >
      <motion.div
        layout
        className={classNames(
          'flex items-center rounded-full border surface-border surface panel-shadow',
          isCompact ? 'gap-1.5 px-2 py-1' : 'gap-2 px-2 py-2',
        )}
        transition={layoutTransition}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              layout
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={classNames(
                'relative flex flex-col items-center justify-center rounded-full px-2 font-medium leading-tight text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
                isCompact ? 'h-11 w-14 gap-0.5 py-1 text-[10px]' : 'h-14 w-20 gap-1 py-1.5 text-[11px]',
              )}
              style={{ transform: 'translate3d(0, 0, 0)', willChange: 'transform' }}
              transition={layoutTransition}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-pill"
                  className="absolute inset-0 rounded-full bg-[var(--color-text)]"
                  transition={pillTransition}
                />
              )}
              <motion.span
                layout="position"
                className={classNames(
                  'relative z-10 flex h-full flex-col items-center justify-center transition-colors',
                  isCompact ? 'gap-0' : 'gap-1',
                  isActive ? 'text-[var(--color-surface)]' : 'text-[var(--color-text)]',
                )}
                transition={layoutTransition}
              >
                <motion.span
                  layout="position"
                  className="flex h-5 w-5 items-center justify-center"
                  style={{
                    transform: 'translate3d(0, 0, 0)',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform',
                  }}
                  transition={layoutTransition}
                >
                  {tab.icon}
                </motion.span>
                <motion.span
                  aria-hidden
                  className="block overflow-hidden"
                  initial={false}
                  animate={{
                    opacity: isCompact ? 0 : 1,
                    height: isCompact ? 0 : 14,
                    marginTop: isCompact ? 0 : 2,
                    scaleY: isCompact ? 0.6 : 1,
                  }}
                  transition={labelTransition}
                  style={{ transformOrigin: 'top' }}
                >
                  {tab.label}
                </motion.span>
              </motion.span>
            </motion.button>
          );
        })}
      </motion.div>
    </motion.nav>
  );
};
