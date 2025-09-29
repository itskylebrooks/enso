import { AnimatePresence, motion } from 'motion/react'
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from 'react'

import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  className?: string
  panelClassName?: string
  trapFocus?: boolean
  closeOnBackdropClick?: boolean
  hideBackdrop?: boolean
  ariaDescribedBy?: string
}

export const Modal = ({
  isOpen,
  onClose,
  labelledBy,
  children,
  className,
  panelClassName,
  trapFocus = true,
  closeOnBackdropClick = true,
  hideBackdrop = false,
  ariaDescribedBy,
}: ModalProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { overlayMotion, prefersReducedMotion } = useMotionPreferences()

  useFocusTrap(trapFocus && isOpen, containerRef, onClose)
  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen || !trapFocus) return
    const node = containerRef.current
    if (!node) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (node && !node.contains(previouslyFocused ?? null)) {
      const focusable = node.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus({ preventScroll: true })
    }
  }, [isOpen, trapFocus])

  const overlayStyle = hideBackdrop
    ? undefined
    : {
        backgroundColor: 'rgba(0,0,0,0.45)',
        backdropFilter: prefersReducedMotion ? undefined : 'blur(8px)',
      } as const

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={
            hideBackdrop
              ? className
              : ['fixed inset-0 z-50 flex items-center justify-center px-4', className]
                  .filter(Boolean)
                  .join(' ')
          }
          variants={hideBackdrop ? undefined : overlayMotion.backdrop}
          initial={hideBackdrop ? undefined : 'initial'}
          animate={hideBackdrop ? undefined : 'animate'}
          exit={hideBackdrop ? undefined : 'exit'}
          transition={overlayMotion.transition}
          onClick={closeOnBackdropClick ? onClose : undefined}
          style={overlayStyle}
        >
          <motion.div
            ref={containerRef}
            className={['w-full max-w-lg', panelClassName].filter(Boolean).join(' ')}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={ariaDescribedBy}
            onClick={(event) => event.stopPropagation()}
            variants={overlayMotion.panel}
            initial={hideBackdrop ? undefined : 'initial'}
            animate={hideBackdrop ? undefined : 'animate'}
            exit={hideBackdrop ? undefined : 'exit'}
            transition={overlayMotion.panelTransition}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
