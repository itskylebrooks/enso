import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal } from 'lucide-react';

type ExpandableFilterBarProps = {
  children: ReactNode;
  label?: string;
};

export const ExpandableFilterBar = ({ children, label = 'Filters' }: ExpandableFilterBarProps): ReactNode => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Collapsed Bar - sticky positioning to stay visible during scroll */}
      <motion.aside
        className="hidden md:block sticky top-24 z-30 float-left -ml-16"
        style={{ left: '-3.5rem' }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        initial={false}
      >
        {/* Vertical Tab */}
        <div
          className={`transition-all duration-300 ${
            isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
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
          {isExpanded && (
            <motion.div
              className="absolute left-0 top-0 w-64 surface border surface-border rounded-2xl p-3 shadow-xl max-h-[calc(100vh-7rem)] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.95, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
};
