import { loadFilterPanelPinned, saveFilterPanelPinned } from '@shared/services/storageService';
import { SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useMotionPreferences } from './motion';

type ContextPanelRailProps = {
  children: ReactNode;
  label?: string;
  icon?: LucideIcon;
  tourTargetId?: string;
  forceOpen?: boolean;
  sideRailAfter?: ReactNode;
};

type ContextPanelRailValue = {
  isPinned: boolean;
  togglePin: () => void;
};

const ContextPanelRailContext = createContext<ContextPanelRailValue | null>(null);

export const useContextPanelPinButton = (): ContextPanelRailValue | null => {
  return useContext(ContextPanelRailContext);
};

export const ContextPanelRail = ({
  children,
  label = 'Filters',
  icon: Icon = SlidersHorizontal,
  tourTargetId,
  forceOpen = false,
  sideRailAfter,
}: ContextPanelRailProps): ReactNode => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(() => loadFilterPanelPinned());
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [pinnedPanelHeight, setPinnedPanelHeight] = useState<number | null>(null);
  const pinnedPanelRef = useRef<HTMLDivElement | null>(null);
  const { prefersReducedMotion } = useMotionPreferences();

  useEffect(() => {
    setIsInitialMount(false);
  }, []);

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

  useEffect(() => {
    if (forceOpen) {
      setIsExpanded(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!isPinned) {
      setPinnedPanelHeight(null);
      return;
    }

    const panel = pinnedPanelRef.current;
    if (!panel) return;

    const updatePinnedPanelHeight = () => {
      setPinnedPanelHeight(panel.getBoundingClientRect().height);
    };

    updatePinnedPanelHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updatePinnedPanelHeight);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [children, isPinned]);

  const togglePin = () => {
    setIsPinned((prev) => !prev);
  };
  const effectiveExpanded = forceOpen || isExpanded;

  return (
    <ContextPanelRailContext.Provider value={{ isPinned, togglePin }}>
      <AnimatePresence mode="wait" initial={!isInitialMount}>
        {isPinned ? (
          <aside
            key="pinned"
            className="hidden lg:block sticky top-20 z-30 float-left -ml-16"
            style={{ left: '-3.5rem' }}
          >
            <div className="flex flex-col items-start gap-4">
              <div
                className="opacity-0 pointer-events-none surface border surface-border rounded-xl px-2.5 py-4 flex flex-col items-center gap-3"
                style={pinnedPanelHeight == null ? undefined : { height: pinnedPanelHeight }}
              >
                <Icon className="w-4 h-4" aria-hidden />
                <div className="writing-mode-vertical text-xs font-medium tracking-wider uppercase">
                  {label}
                </div>
              </div>
              <div className="transition-opacity duration-200 opacity-100">
                {sideRailAfter}
              </div>
            </div>
            <motion.div
              ref={pinnedPanelRef}
              data-tour-target={tourTargetId}
              className="absolute right-0 top-0 w-64 surface border surface-border rounded-2xl p-3 panel-shadow max-h-[calc(100vh-7rem)] overflow-y-auto no-select"
              initial={isInitialMount ? false : { opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </aside>
        ) : (
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
        )}
      </AnimatePresence>
    </ContextPanelRailContext.Provider>
  );
};
