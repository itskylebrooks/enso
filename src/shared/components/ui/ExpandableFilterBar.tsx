import { loadFilterPanelPinned, saveFilterPanelPinned } from '@shared/services/storageService';
import { SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useMotionPreferences } from './motion';

type ExpandableFilterBarProps = {
  children: ReactNode;
  label?: string;
  tourTargetId?: string;
  forceOpen?: boolean;
};

type FilterBarContextValue = {
  isPinned: boolean;
  togglePin: () => void;
};

const FilterBarContext = createContext<FilterBarContextValue | null>(null);

export const usePinButton = (): FilterBarContextValue | null => {
  return useContext(FilterBarContext);
};

export const ExpandableFilterBar = ({
  children,
  label = 'Filters',
  tourTargetId,
  forceOpen = false,
}: ExpandableFilterBarProps): ReactNode => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(() => loadFilterPanelPinned());
  const [isInitialMount, setIsInitialMount] = useState(true);
  const { prefersReducedMotion } = useMotionPreferences();

  // Mark initial mount as complete after first render
  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  // Check viewport width and auto-unpin if panel doesn't fit
  useEffect(() => {
    const checkViewportWidth = () => {
      // Panel width is 16rem (256px), we need at least ~900px to comfortably fit it
      // with content (accounting for margins and content area)
      const minWidth = 900;
      const viewportWidth = window.innerWidth;

      if (viewportWidth < minWidth && isPinned) {
        setIsPinned(false);
      }
    };

    // Check on mount
    checkViewportWidth();

    // Check on resize
    window.addEventListener('resize', checkViewportWidth);
    return () => {
      window.removeEventListener('resize', checkViewportWidth);
    };
  }, [isPinned]);

  // Save pinned state to localStorage when it changes
  useEffect(() => {
    saveFilterPanelPinned(isPinned);
    // Dispatch a custom event to notify other instances
    window.dispatchEvent(new CustomEvent('filter-panel-pin-changed', { detail: { isPinned } }));
  }, [isPinned]);

  // Listen for pin state changes from other instances
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

  // Synchronize expanded state with forceOpen
  useEffect(() => {
    if (forceOpen) {
      setIsExpanded(true);
    }
  }, [forceOpen]);

  const togglePin = () => {
    setIsPinned((prev) => !prev);
  };
  const effectiveExpanded = forceOpen || isExpanded;

  return (
    <FilterBarContext.Provider value={{ isPinned, togglePin }}>
      <AnimatePresence mode="wait" initial={!isInitialMount}>
        {isPinned ? (
          /* Pinned Panel - Always visible, right edge aligned with filter button's right edge */
          <aside
            key="pinned"
            className="hidden lg:block sticky top-20 z-30 float-left -ml-16"
            style={{ left: '-3.5rem' }}
          >
            {/* Invisible spacer to match the collapsed button size */}
            <div className="opacity-0 pointer-events-none surface border surface-border rounded-xl px-2.5 py-4 flex flex-col items-center gap-3">
              <SlidersHorizontal className="w-4 h-4" aria-hidden />
              <div className="writing-mode-vertical text-xs font-medium tracking-wider uppercase">
                {label}
              </div>
            </div>
            {/* Pinned panel overlaying - right edge aligned with animation */}
            <motion.div
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
          /* Collapsed Bar - sticky positioning to stay visible during scroll */
          <motion.aside
            key="unpinned"
            className="hidden lg:block sticky top-20 z-30 float-left -ml-16"
            style={{ left: '-3.5rem' }}
            onMouseEnter={() => {
              if (!forceOpen) setIsExpanded(true);
            }}
            onMouseLeave={() => {
              if (!forceOpen) setIsExpanded(false);
            }}
            initial={isInitialMount ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Vertical Tab */}
            <div
              data-tour-target={tourTargetId}
              className={`transition-all duration-300 ${
                effectiveExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <div className="surface border surface-border rounded-xl px-2.5 py-4 flex flex-col items-center gap-3 shadow-sm cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors">
                <SlidersHorizontal className="w-4 h-4 text-subtle" aria-hidden />
                <div className="writing-mode-vertical text-xs font-medium tracking-wider uppercase text-subtle">
                  {label}
                </div>
              </div>
            </div>

            {/* Expanded Panel - Rectangle popup matching original design */}
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
          </motion.aside>
        )}
      </AnimatePresence>
    </FilterBarContext.Provider>
  );
};
