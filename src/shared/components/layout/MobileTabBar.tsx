import type { ReactElement } from 'react';
import { BookOpenText, Compass, LibraryBig } from 'lucide-react';
import { motion } from 'motion/react';
import type { AppRoute } from '@shared/types';
import type { Copy } from '@shared/constants/i18n';
import { classNames } from '@shared/utils/classNames';
import { springEase, useMotionPreferences } from '@shared/components/ui/motion';

type MobileTab = 'guide' | 'library' | 'glossary';

type MobileTabBarProps = {
  copy: Copy;
  route: AppRoute;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
};

export const MobileTabBar = ({ copy, route, onNavigate }: MobileTabBarProps): ReactElement => {
  const { prefersReducedMotion } = useMotionPreferences();
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

  return (
    <nav
      className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Primary navigation"
    >
      <div className="flex items-center gap-2 rounded-full border surface-border surface px-2 py-2 panel-shadow">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={classNames(
                'relative flex h-14 w-20 flex-col items-center justify-center gap-1 rounded-full px-2 py-1.5 text-[11px] font-medium leading-tight text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-tab-pill"
                  className="absolute inset-0 rounded-full bg-[var(--color-text)]"
                  transition={prefersReducedMotion ? { duration: 0 } : springEase}
                />
              )}
              <span
                className={classNames(
                  'relative z-10 flex flex-col items-center gap-1 transition-colors',
                  isActive ? 'text-[var(--color-surface)]' : 'text-[var(--color-text)]',
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center">{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
