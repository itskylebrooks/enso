import { useMotionPreferences } from '@shared/components/ui/motion';
import type { LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactElement, type ReactNode } from 'react';

type ContextExtensionToolProps = {
  label: string;
  icon: LucideIcon;
  count?: number;
  disabled?: boolean;
  children: ReactNode;
};

export const ContextExtensionTool = ({
  label,
  icon: Icon,
  count,
  disabled = false,
  children,
}: ContextExtensionToolProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { prefersReducedMotion } = useMotionPreferences();
  const effectiveExpanded = !disabled && isExpanded;

  return (
    <motion.div
      className="relative z-20"
      onMouseEnter={() => {
        if (!disabled) setIsExpanded(true);
      }}
      onMouseLeave={() => setIsExpanded(false)}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
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
            className="absolute left-0 top-0 z-30 w-64 surface border surface-border rounded-2xl p-3 panel-shadow max-h-[calc(100vh-10rem)] overflow-y-auto no-select"
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-subtle">
                {label}
              </h2>
              {count != null && <span className="text-xs text-subtle">{count}</span>}
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
