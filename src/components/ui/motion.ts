import { useMemo, useCallback } from 'react';
import { useReducedMotion, type Transition, type Variants } from 'motion/react';

export const defaultEase = [0.16, 1, 0.3, 1] as const; // Custom cubic-bezier for smoother motion
export const springEase = { type: 'spring', damping: 20, stiffness: 300 } as const;

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const pageTransition: Transition = { duration: 0.25, ease: defaultEase };
export const reducedPageTransition: Transition = { duration: 0.05 };

// Enhanced backdrop with synchronized blur animation
export const backdropVariants: Variants = {
  initial: { 
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  animate: { 
    opacity: 1,
    backdropFilter: 'blur(8px)',
  },
  exit: { 
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
};

export const reducedBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Improved panel animation with spring physics for smoothness
export const panelVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
};

export const reducedPanelVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const listContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.02, delayChildren: 0 },
  },
};

export const reducedListContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0 },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

export const reducedListItemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const collapseVariants: Variants = {
  open: {
    opacity: 1,
    height: 'auto',
    overflow: 'hidden',
  },
  closed: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
  },
};

export const reducedCollapseVariants: Variants = {
  open: { opacity: 1, height: 'auto' },
  closed: { opacity: 0, height: 0 },
};

export const closeButtonVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const reducedCloseButtonVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const mediaVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

export const reducedMediaVariants = mediaVariants;

export const useMotionPreferences = () => {
  const prefersReducedMotionRaw = useReducedMotion();
  const prefersReducedMotion = Boolean(prefersReducedMotionRaw);

  const pageMotion = useMemo(
    () => ({
      variants: prefersReducedMotion ? reducedPageVariants : pageVariants,
      transition: prefersReducedMotion ? reducedPageTransition : pageTransition,
    }),
    [prefersReducedMotion],
  );

  const overlayMotion = useMemo(
    () => ({
      backdrop: prefersReducedMotion ? reducedBackdropVariants : backdropVariants,
      panel: prefersReducedMotion ? reducedPanelVariants : panelVariants,
      transition: prefersReducedMotion ? reducedPageTransition : pageTransition,
      panelTransition: prefersReducedMotion ? reducedPageTransition : springEase,
      closeButton: prefersReducedMotion ? reducedCloseButtonVariants : closeButtonVariants,
    }),
    [prefersReducedMotion],
  );

  const listMotion = useMemo(
    () => ({
      container: prefersReducedMotion ? reducedListContainerVariants : listContainerVariants,
      item: prefersReducedMotion ? reducedListItemVariants : listItemVariants,
    }),
    [prefersReducedMotion],
  );

  const mediaMotion = useMemo(
    () => ({
      variants: prefersReducedMotion ? reducedMediaVariants : mediaVariants,
      transition: prefersReducedMotion ? reducedPageTransition : pageTransition,
    }),
    [prefersReducedMotion],
  );

  const collapseMotion = useMemo(
    () => ({
      variants: prefersReducedMotion ? reducedCollapseVariants : collapseVariants,
      transition: prefersReducedMotion ? reducedPageTransition : { duration: 0.25, ease: defaultEase },
    }),
    [prefersReducedMotion],
  );

  const getItemTransition = useCallback(
    (index: number): Transition =>
      prefersReducedMotion
        ? { duration: 0.05 }
        : { delay: Math.min(index, 9) * 0.02, duration: 0.2, ease: defaultEase },
    [prefersReducedMotion],
  );

  const toggleTransition: Transition = prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.15, ease: defaultEase };
  const chipTransition: Transition = prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.12, ease: defaultEase };

  return {
    prefersReducedMotion,
    pageMotion,
    overlayMotion,
    listMotion,
    mediaMotion,
    collapseMotion,
    getItemTransition,
    toggleTransition,
    chipTransition,
  } as const;
};
