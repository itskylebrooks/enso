import { useCallback, useMemo } from 'react'
import { useReducedMotion, type Transition } from 'motion/react'

import {
  backdropVariants,
  chipTransition,
  closeButtonVariants,
  collapseVariants,
  defaultEase,
  mediaVariants,
  pageTransition,
  pageVariants,
  panelVariants,
  reducedBackdropVariants,
  reducedCloseButtonVariants,
  reducedCollapseVariants,
  reducedMediaVariants,
  reducedPageTransition,
  reducedPageVariants,
  reducedPanelVariants,
  reducedStaggerContainer,
  reducedStaggerItem,
  springTransition,
  staggerContainer,
  staggerItem,
  toggleTransition,
} from '@/lib/motion'

export type MotionPreferences = {
  prefersReducedMotion: boolean
  pageMotion: {
    variants: typeof pageVariants
    transition: Transition
  }
  overlayMotion: {
    backdrop: typeof backdropVariants
    panel: typeof panelVariants
    transition: Transition
    panelTransition: Transition
    closeButton: typeof closeButtonVariants
  }
  listMotion: {
    container: typeof staggerContainer
    item: typeof staggerItem
  }
  mediaMotion: {
    variants: typeof mediaVariants
    transition: Transition
  }
  collapseMotion: {
    variants: typeof collapseVariants
    transition: Transition
  }
  getItemTransition: (index: number) => Transition
  toggleTransition: Transition
  chipTransition: Transition
}

export const useMotionPreferences = (): MotionPreferences => {
  const prefersReducedMotion = Boolean(useReducedMotion())

  const pageMotion = useMemo(
    () => ({
      variants: prefersReducedMotion ? reducedPageVariants : pageVariants,
      transition: prefersReducedMotion ? reducedPageTransition : pageTransition,
    }),
    [prefersReducedMotion],
  )

  const overlayMotion = useMemo(
    () => ({
      backdrop: prefersReducedMotion ? reducedBackdropVariants : backdropVariants,
      panel: prefersReducedMotion ? reducedPanelVariants : panelVariants,
      transition: prefersReducedMotion ? reducedPageTransition : pageTransition,
      panelTransition: prefersReducedMotion ? reducedPageTransition : springTransition,
      closeButton: prefersReducedMotion ? reducedCloseButtonVariants : closeButtonVariants,
    }),
    [prefersReducedMotion],
  )

  const listMotion = useMemo(
    () => ({
      container: prefersReducedMotion ? reducedStaggerContainer : staggerContainer,
      item: prefersReducedMotion ? reducedStaggerItem : staggerItem,
    }),
    [prefersReducedMotion],
  )

  const mediaMotion = useMemo(
    () => ({
      variants: prefersReducedMotion ? reducedMediaVariants : mediaVariants,
      transition: prefersReducedMotion ? reducedPageTransition : pageTransition,
    }),
    [prefersReducedMotion],
  )

  const collapseMotion = useMemo(
    () => ({
      variants: prefersReducedMotion ? reducedCollapseVariants : collapseVariants,
      transition: prefersReducedMotion ? reducedPageTransition : { duration: 0.25, ease: defaultEase },
    }),
    [prefersReducedMotion],
  )

  const getItemTransition = useCallback(
    (index: number): Transition =>
      prefersReducedMotion
        ? { duration: 0.05 }
        : { delay: Math.min(index, 9) * 0.02, duration: 0.2, ease: defaultEase },
    [prefersReducedMotion],
  )

  return {
    prefersReducedMotion,
    pageMotion,
    overlayMotion,
    listMotion,
    mediaMotion,
    collapseMotion,
    getItemTransition,
    toggleTransition: prefersReducedMotion ? { duration: 0.05 } : toggleTransition,
    chipTransition: prefersReducedMotion ? { duration: 0.05 } : chipTransition,
  }
}
