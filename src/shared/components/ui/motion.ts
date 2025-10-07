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

// Android-friendly backdrop: avoid backdrop-filter (expensive) and animate
// backgroundColor opacity instead. This keeps visual separation but is much
// cheaper on many Android devices.
export const androidBackdropVariants: Variants = {
  initial: {
    opacity: 0,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  animate: {
    opacity: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    willChange: 'background-color, opacity',
  },
  exit: {
    opacity: 0,
    backgroundColor: 'rgba(0,0,0,0)',
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

// Hint that transforms and opacity will change to allow the browser to
// promote the element to its own layer on some platforms.
export const panelVariantsWithHints: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95, willChange: 'transform, opacity' },
  animate: { opacity: 1, y: 0, scale: 1, willChange: 'transform, opacity' },
  exit: { opacity: 0, y: -10, scale: 0.98, willChange: 'transform, opacity' },
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
    // animating to height: 'auto' can be very expensive on Android; prefer
    // animating scaleY with transformOrigin set to the top to create a
    // visually similar collapse/expand that is cheaper to composite.
    opacity: 1,
    scaleY: 1,
    transformOrigin: 'top',
    overflow: 'hidden',
    willChange: 'transform, opacity',
  },
  closed: {
    opacity: 0,
    scaleY: 0,
    transformOrigin: 'top',
    overflow: 'hidden',
    willChange: 'transform, opacity',
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

  // Lightweight runtime UA check to detect Android devices. We only use this
  // to pick cheaper variants for Android; keep reduced-motion preference
  // authoritative first.
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const overlayMotion = useMemo(
    () => ({
      backdrop: prefersReducedMotion
        ? reducedBackdropVariants
        : isAndroid
        ? androidBackdropVariants
        : backdropVariants,
      // Use panel variants with will-change/transform hints on Android for
      // better compositing performance there.
      panel: prefersReducedMotion ? reducedPanelVariants : isAndroid ? panelVariantsWithHints : panelVariants,
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
      // Prefer height-based collapse (height: 0 / auto) for most platforms so
      // closed panels don't leave a static visual height in the layout. On
      // Android we keep the scaleY-based variants which are cheaper to
      // composite and avoid animating height:auto there. Respect reduced-motion first.
      variants: prefersReducedMotion ? reducedCollapseVariants : isAndroid ? collapseVariants : reducedCollapseVariants,
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
