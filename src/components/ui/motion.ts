import { useMemo, useCallback } from 'react';
import { useReducedMotion, type Transition, type Variants } from 'motion/react';

export const defaultEase = 'easeOut' as const;

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

export const pageTransition: Transition = { duration: 0.18, ease: defaultEase };
export const reducedPageTransition: Transition = { duration: 0.05 };

export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const reducedBackdropVariants = backdropVariants;

export const panelVariants: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
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

  const getItemTransition = useCallback(
    (index: number): Transition =>
      prefersReducedMotion
        ? { duration: 0.05 }
        : { delay: Math.min(index, 9) * 0.02, duration: 0.2, ease: defaultEase },
    [prefersReducedMotion],
  );

  const toggleTransition: Transition = prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.12, ease: defaultEase };
  const chipTransition: Transition = prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.1, ease: defaultEase };

  return {
    prefersReducedMotion,
    pageMotion,
    overlayMotion,
    listMotion,
    mediaMotion,
    getItemTransition,
    toggleTransition,
    chipTransition,
  } as const;
};
