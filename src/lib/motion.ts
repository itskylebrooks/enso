import type { Transition, Variants } from 'motion/react'

export const defaultEase = [0.16, 1, 0.3, 1] as const
export const springTransition: Transition = { type: 'spring', damping: 20, stiffness: 300 }

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
}

export const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const pageTransition: Transition = { duration: 0.25, ease: defaultEase }
export const reducedPageTransition: Transition = { duration: 0.05 }

export const backdropVariants: Variants = {
  initial: { opacity: 0, backdropFilter: 'blur(0px)' },
  animate: { opacity: 1, backdropFilter: 'blur(8px)' },
  exit: { opacity: 0, backdropFilter: 'blur(0px)' }
}

export const reducedBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const panelVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 }
}

export const reducedPanelVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.02, delayChildren: 0 }
  }
}

export const reducedStaggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0 }
  }
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 }
}

export const reducedStaggerItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
}

export const collapseVariants: Variants = {
  open: { opacity: 1, height: 'auto', overflow: 'hidden' },
  closed: { opacity: 0, height: 0, overflow: 'hidden' }
}

export const reducedCollapseVariants: Variants = {
  open: { opacity: 1, height: 'auto' },
  closed: { opacity: 0, height: 0 }
}

export const closeButtonVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 }
}

export const reducedCloseButtonVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const mediaVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
}

export const reducedMediaVariants = mediaVariants

export const toggleTransition: Transition = { duration: 0.15, ease: defaultEase }
export const chipTransition: Transition = { duration: 0.12, ease: defaultEase }
