import { loadFilterPanelPinned, saveFilterPanelPinned } from '@shared/services/storageService';
import { Pin, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useMotionPreferences } from './motion';

export type ContextPanelRailProps = {
  children: ReactNode;
  label?: string;
  icon?: LucideIcon;
  tourTargetId?: string;
  forceOpen?: boolean;
  sideRailAfter?: ReactNode;
  pinState?: ContextPanelRailValue;
};

export type ContextPanelRailValue = {
  isPinned: boolean;
  togglePin: () => void;
};

const ContextPanelRailContext = createContext<ContextPanelRailValue | null>(null);

export const useContextPanelPinButton = (): ContextPanelRailValue | null => {
  return useContext(ContextPanelRailContext);
};

export const ContextPanelRailProvider = ({
  value,
  children,
}: {
  value: ContextPanelRailValue;
  children: ReactNode;
}): ReactNode => {
  return (
    <ContextPanelRailContext.Provider value={value}>{children}</ContextPanelRailContext.Provider>
  );
};

export const useContextSidebarPinState = (): ContextPanelRailValue => {
  const [isPinned, setIsPinned] = useState(() => loadFilterPanelPinned());

  useEffect(() => {
    const checkViewportWidth = () => {
      const minWidth = 900;
      const viewportWidth = window.innerWidth;

      if (viewportWidth < minWidth && isPinned) {
        setIsPinned(false);
      }
    };

    checkViewportWidth();

    window.addEventListener('resize', checkViewportWidth);
    return () => {
      window.removeEventListener('resize', checkViewportWidth);
    };
  }, [isPinned]);

  useEffect(() => {
    saveFilterPanelPinned(isPinned);
    window.dispatchEvent(new CustomEvent('filter-panel-pin-changed', { detail: { isPinned } }));
  }, [isPinned]);

  useEffect(() => {
    const handlePinChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ isPinned: boolean }>;
      setIsPinned(customEvent.detail.isPinned);
    };

    window.addEventListener('filter-panel-pin-changed', handlePinChange);
    return () => {
      window.removeEventListener('filter-panel-pin-changed', handlePinChange);
    };
  }, []);

  const togglePin = useCallback(() => {
    setIsPinned((prev) => !prev);
  }, []);

  return { isPinned, togglePin };
};

export const ContextPanelRail = ({
  pinState,
  ...props
}: ContextPanelRailProps): ReactNode => {
  if (pinState) {
    return <ContextPanelRailInner {...props} pinState={pinState} />;
  }

  return <ContextPanelRailWithInternalState {...props} />;
};

const ContextPanelRailWithInternalState = (props: Omit<ContextPanelRailProps, 'pinState'>) => {
  const pinState = useContextSidebarPinState();
  return <ContextPanelRailInner {...props} pinState={pinState} />;
};

const ContextPanelRailInner = ({
  children,
  label = 'Filters',
  icon: Icon = SlidersHorizontal,
  tourTargetId,
  forceOpen = false,
  sideRailAfter,
  pinState,
}: Omit<ContextPanelRailProps, 'pinState'> & {
  pinState: ContextPanelRailValue;
}): ReactNode => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { prefersReducedMotion } = useMotionPreferences();

  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsExpanded(true);
    }
  }, [forceOpen]);

  const effectiveExpanded = forceOpen || isExpanded;

  return (
    <ContextPanelRailProvider value={pinState}>
      <AnimatePresence mode="wait" initial={!isInitialMount}>
        <motion.aside
          key="unpinned"
          className="hidden lg:block sticky top-20 z-30 float-left -ml-16"
          style={{ left: '-3.5rem' }}
          initial={isInitialMount ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={pinState.togglePin}
              className="surface border surface-border rounded-xl p-2.5 shadow-sm hover:bg-[var(--color-surface-hover)] transition-colors text-subtle hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
              aria-label="Pin panel"
              title="Pin panel"
            >
              <Pin className="w-4 h-4" aria-hidden />
            </button>
            <div
              className="relative"
              onMouseEnter={() => {
                if (!forceOpen) setIsExpanded(true);
              }}
              onMouseLeave={() => {
                if (!forceOpen) setIsExpanded(false);
              }}
            >
              <div
                data-tour-target={tourTargetId}
                className={`transition-all duration-300 ${
                  effectiveExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <div className="surface border surface-border rounded-xl px-2.5 py-4 flex flex-col items-center gap-3 shadow-sm cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                  <Icon className="w-4 h-4 text-subtle" aria-hidden />
                  <div className="writing-mode-vertical text-xs font-medium tracking-wider uppercase text-subtle">
                    {label}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {effectiveExpanded && (
                  <motion.div
                    data-tour-target={tourTargetId}
                    data-tour-panel="true"
                    className="absolute left-0 top-0 w-64 surface border surface-border rounded-2xl p-3 panel-shadow max-h-[calc(100vh-7rem)] overflow-y-auto no-select"
                    initial={{ opacity: 0, scale: 0.95, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -10 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.2,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    {children}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div
              className={`transition-opacity duration-200 ${
                effectiveExpanded ? 'pointer-events-none opacity-0' : 'opacity-100'
              }`}
            >
              {sideRailAfter}
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>
    </ContextPanelRailProvider>
  );
};
