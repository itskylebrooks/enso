import { useMotionPreferences } from '@shared/components/ui/motion';
import type { Copy } from '@shared/constants/i18n';
import { useSmartSticky } from '@shared/hooks/useSmartSticky';
import { getSectionForRoute, type AppSection } from '@shared/navigation/appRoutes';
import type { AppRoute } from '@shared/types';
import { Bookmark, Compass, LibraryBig, School, type LucideIcon } from 'lucide-react';
import { LayoutGroup, motion, type Transition } from 'motion/react';
import type { ReactElement } from 'react';

type MobileTabBarProps = {
  copy: Copy;
  route: AppRoute;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
};

export const MobileTabBar = ({ copy, route, onNavigate }: MobileTabBarProps): ReactElement => {
  const { prefersReducedMotion } = useMotionPreferences();
  const { isVisible, isMobile } = useSmartSticky(route);
  const isCompact = isMobile && !isVisible;
  const dims = isCompact
    ? { width: 52, gap: 4, paddingX: 4, paddingY: 6, height: 44 }
    : { width: 72, gap: 6, paddingX: 6, paddingY: 8, height: 56 };
  const activeSection = getSectionForRoute(route);

  const tabs: Array<{
    id: AppSection;
    route: AppRoute;
    label: string;
    icon: LucideIcon;
    tourTarget: string;
  }> = [
    {
      id: 'guide',
      route: 'guide',
      label: copy.guideLink,
      icon: Compass,
      tourTarget: 'nav-guide',
    },
    {
      id: 'library',
      route: 'library',
      label: copy.library,
      icon: LibraryBig,
      tourTarget: 'nav-library',
    },
    {
      id: 'study',
      route: 'study',
      label: copy.study,
      icon: Bookmark,
      tourTarget: 'nav-study',
    },
    {
      id: 'teach',
      route: 'teach',
      label: copy.teach,
      icon: School,
      tourTarget: 'nav-teach',
    },
  ];

  const springExpand: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', damping: 22, stiffness: 280, mass: 0.8 };
  const springLabel: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring', damping: 18, stiffness: 240, mass: 0.6 };

  return (
    <div
      className="fixed left-1/2 z-30 w-max -translate-x-1/2 pb-[env(safe-area-inset-bottom)] md:hidden no-select"
      style={{ bottom: '1rem' }}
    >
      <motion.div
        className="w-max"
        initial={false}
        animate={{ y: isCompact ? 4 : -4 }}
        transition={springExpand}
        aria-label="Primary navigation"
      >
        <LayoutGroup id="mobile-tab-bar">
          <motion.div
            className="mobile-tab-bar relative inline-flex items-center rounded-full border surface-border surface panel-shadow"
            initial={false}
            animate={{
              gap: dims.gap,
              paddingLeft: dims.paddingX,
              paddingRight: dims.paddingX,
              paddingTop: dims.paddingY,
              paddingBottom: dims.paddingY,
            }}
            transition={springExpand}
          >
            {tabs.map((tab) => {
              const isActive = activeSection === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  data-tour-target={tab.tourTarget}
                  onClick={() => {
                    if (isActive) return;
                    onNavigate(tab.route);
                  }}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative z-10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  <motion.div
                    className="relative flex flex-col items-center justify-center rounded-full px-1 text-center font-medium leading-tight"
                    initial={false}
                    animate={{
                      height: dims.height,
                      width: dims.width,
                      paddingTop: isCompact ? 4 : 6,
                      paddingBottom: isCompact ? 4 : 6,
                      paddingLeft: 6,
                      paddingRight: 6,
                    }}
                    transition={springExpand}
                  >
                    {isActive && (
                      <motion.span
                        className="absolute inset-0 rounded-full bg-[var(--color-text)]"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={springExpand}
                      />
                    )}

                    <div className="relative z-10 flex h-full w-full items-center justify-center">
                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-[var(--color-bg)]"
                        initial={false}
                        animate={{ opacity: isActive ? 1 : 0 }}
                        transition={springExpand}
                      >
                        <motion.span
                          className="flex shrink-0 items-center justify-center"
                          initial={false}
                          animate={{ scale: isCompact ? 1.05 : 1 }}
                          transition={springExpand}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </motion.span>
                        <motion.span
                          aria-hidden
                          className="block overflow-hidden whitespace-nowrap text-center"
                          initial={false}
                          animate={{
                            opacity: isCompact ? 0 : 1,
                            height: isCompact ? 0 : 14,
                            marginTop: isCompact ? 0 : 4,
                            scaleY: isCompact ? 0.5 : 1,
                          }}
                          transition={springLabel}
                          style={{ fontSize: '11px', transformOrigin: 'top center' }}
                        >
                          {tab.label}
                        </motion.span>
                      </motion.span>

                      <motion.span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-[var(--color-text)]"
                        initial={false}
                        animate={{ opacity: isActive ? 0 : 1 }}
                        transition={springExpand}
                      >
                        <motion.span
                          className="flex shrink-0 items-center justify-center"
                          initial={false}
                          animate={{ scale: isCompact ? 1.05 : 1 }}
                          transition={springExpand}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </motion.span>
                        <motion.span
                          aria-hidden
                          className="block overflow-hidden whitespace-nowrap text-center"
                          initial={false}
                          animate={{
                            opacity: isCompact ? 0 : 1,
                            height: isCompact ? 0 : 14,
                            marginTop: isCompact ? 0 : 4,
                            scaleY: isCompact ? 0.5 : 1,
                          }}
                          transition={springLabel}
                          style={{ fontSize: '11px', transformOrigin: 'top center' }}
                        >
                          {tab.label}
                        </motion.span>
                      </motion.span>
                    </div>
                  </motion.div>
                </button>
              );
            })}
          </motion.div>
        </LayoutGroup>
      </motion.div>
    </div>
  );
};
