import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, PinOff } from 'lucide-react';
import {
  ContextPanelRail,
  ContextPanelRailProvider,
  useContextSidebarPinState,
  type ContextPanelRailValue,
  type ContextPanelRailProps,
} from './ContextPanelRail';
import { useMotionPreferences } from './motion';

const PinnedSidebarSectionContext = createContext(false);

export const usePinnedSidebarSection = (): boolean => useContext(PinnedSidebarSectionContext);

type ContextSidebarLayoutProps = Pick<
  ContextPanelRailProps,
  'label' | 'icon' | 'tourTargetId' | 'forceOpen' | 'sideRailAfter'
> & {
  sidebar: ReactNode;
  children: ReactNode;
};

const useReservedSidebarViewport = (): boolean => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1280px)').matches;
  });

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1280px)');
    const handleChange = () => setMatches(query.matches);

    handleChange();
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return matches;
};

export const ContextSidebarLayout = ({
  sidebar,
  children,
  label,
  icon,
  tourTargetId,
  forceOpen = false,
  sideRailAfter,
}: ContextSidebarLayoutProps): ReactElement => {
  const pinState = useContextSidebarPinState();
  const hasReservedSidebar = useReservedSidebarViewport();
  const [hasMounted, setHasMounted] = useState(false);
  const [isPinnedSidebarExiting, setIsPinnedSidebarExiting] = useState(false);
  const previousReserveSidebarRef = useRef(false);
  const { prefersReducedMotion } = useMotionPreferences();
  const sidebarTransition = prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };
  const shouldReserveSidebar = pinState.isPinned && hasReservedSidebar;
  const isStartingPinnedSidebarExit = previousReserveSidebarRef.current && !shouldReserveSidebar;
  const shouldRenderPinnedSidebar =
    shouldReserveSidebar || isPinnedSidebarExiting || isStartingPinnedSidebarExit;
  const shouldRenderCompactRail = !shouldReserveSidebar;
  const shouldShowPinnedSidebarTools = shouldReserveSidebar;
  const transitionClass =
    hasMounted && !prefersReducedMotion
      ? 'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]'
      : '';
  const sidebarInitial =
    !hasMounted || prefersReducedMotion
      ? false
      : { opacity: 0, x: -18 };
  const sidebarAnimate = shouldReserveSidebar
    ? prefersReducedMotion
      ? { opacity: 1 }
      : { opacity: 1, x: 0 }
    : prefersReducedMotion
      ? { opacity: 0 }
      : { opacity: 0, x: -18 };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (previousReserveSidebarRef.current && !shouldReserveSidebar) {
      setIsPinnedSidebarExiting(true);
    }

    if (shouldReserveSidebar) {
      setIsPinnedSidebarExiting(false);
    }

    previousReserveSidebarRef.current = shouldReserveSidebar;
  }, [shouldReserveSidebar]);

  return (
    <ContextPanelRailPinnedProvider pinState={pinState}>
      <div className="relative w-full">
        {shouldRenderCompactRail && (
          <ContextPanelRail
            label={label}
            icon={icon}
            tourTargetId={tourTargetId}
            forceOpen={forceOpen}
            sideRailAfter={sideRailAfter}
            pinState={pinState}
          >
            {sidebar}
          </ContextPanelRail>
        )}

        <div className="absolute left-[calc(50%-35.25rem)] top-0 w-64">
          <AnimatePresence initial={false}>
            {shouldRenderPinnedSidebar && (
              <motion.aside
                key="pinned-sidebar"
                className="sticky top-20 z-30 w-64"
                initial={sidebarInitial}
                animate={sidebarAnimate}
                exit={sidebarAnimate}
                transition={sidebarTransition}
                onAnimationComplete={() => {
                  if (!shouldReserveSidebar) {
                    setIsPinnedSidebarExiting(false);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={pinState.togglePin}
                  className="mb-4 inline-flex items-center justify-center rounded-xl border surface surface-border p-2 shadow-sm hover:bg-[var(--color-surface-hover)] transition-colors text-subtle hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  aria-label="Unpin panel"
                  title="Unpin panel"
                >
                  <PinOff className="w-4 h-4" aria-hidden />
                </button>
                <PinnedSidebarSection label={label} tourTargetId={tourTargetId} defaultOpen>
                  {sidebar}
                </PinnedSidebarSection>
                {shouldShowPinnedSidebarTools && sideRailAfter && (
                  <div className="mt-4 w-64">{sideRailAfter}</div>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        <div
          className={`relative mx-auto w-full max-w-[53rem] ${transitionClass}`}
          style={{ transform: shouldReserveSidebar ? 'translateX(8.75rem)' : 'translateX(0rem)' }}
        >
          <div className="min-w-0 w-full">{children}</div>
        </div>
      </div>
    </ContextPanelRailPinnedProvider>
  );
};

const ContextPanelRailPinnedProvider = ({
  pinState,
  children,
}: {
  pinState: ContextPanelRailValue;
  children: ReactNode;
}): ReactElement => <ContextPanelRailProvider value={pinState}>{children}</ContextPanelRailProvider>;

const PinnedSidebarSection = ({
  label,
  tourTargetId,
  defaultOpen = false,
  children,
}: {
  label?: string;
  tourTargetId?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}): ReactElement => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { prefersReducedMotion } = useMotionPreferences();

  return (
    <div
      data-tour-target={tourTargetId}
      className="w-64 overflow-hidden rounded-xl border surface surface-border no-select"
    >
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="px-3 py-2 flex w-full items-center gap-2 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-text)]"
      >
        <span className="text-xs font-medium tracking-wider uppercase text-subtle">
          {label}
        </span>
        <motion.span
          aria-hidden
          className="ml-auto text-subtle"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.4, 0, 0.2, 1] }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="pinned-sidebar-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.05 : 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t surface-border p-3 max-h-[calc(100vh-10rem)] overflow-y-auto">
              <PinnedSidebarSectionContext.Provider value>
                {children}
              </PinnedSidebarSectionContext.Provider>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
