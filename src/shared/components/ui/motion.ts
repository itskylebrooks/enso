import { useMemo, useCallback, useSyncExternalStore } from 'react';
import { useReducedMotion, type Transition, type Variants } from 'motion/react';

type AnimationPreferenceListener = () => void;

let animationsDisabledState = false;
const animationListeners = new Set<AnimationPreferenceListener>();

const subscribeToAnimationsDisabled = (listener: AnimationPreferenceListener): (() => void) => {
  animationListeners.add(listener);
  return () => {
    animationListeners.delete(listener);
  };
};

export const getAnimationsDisabled = (): boolean => animationsDisabledState;

export const setAnimationsDisabled = (value: boolean): void => {
  if (animationsDisabledState === value) return;
  animationsDisabledState = value;
  animationListeners.forEach((listener) => listener());
};

const useAnimationsDisabled = (): boolean =>
  useSyncExternalStore(subscribeToAnimationsDisabled, getAnimationsDisabled, getAnimationsDisabled);

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

const zeroTransition: Transition = { duration: 0 };

export const useMotionPreferences = () => {
  const animationsDisabled = useAnimationsDisabled();
  const prefersReducedMotionRaw = useReducedMotion();
  const prefersReducedMotion = animationsDisabled || Boolean(prefersReducedMotionRaw);

  const pageMotion = useMemo(
    () => ({
      variants: prefersReducedMotion ? reducedPageVariants : pageVariants,
      transition: animationsDisabled
        ? zeroTransition
        : prefersReducedMotion
        ? reducedPageTransition
        : pageTransition,
    }),
    [animationsDisabled, prefersReducedMotion],
  );

  // Lightweight runtime UA check to detect Android devices. We only use this
  // to pick cheaper variants for Android; keep reduced-motion preference
  // authoritative first.
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  const overlayMotion = useMemo(() => {
    // Keep blur even when animations are disabled by using the full backdrop
    // variants with zero-duration transitions. Only switch to the reduced
    // backdrop when the user explicitly prefers reduced motion.
    const backdrop = prefersReducedMotion && !animationsDisabled
      ? reducedBackdropVariants
      : isAndroid
      ? androidBackdropVariants
      : backdropVariants;
    const panel = prefersReducedMotion ? reducedPanelVariants : panelVariants;
    const transition = animationsDisabled
      ? zeroTransition
      : prefersReducedMotion
      ? reducedPageTransition
      : pageTransition;
    const panelTransition = animationsDisabled
      ? zeroTransition
      : prefersReducedMotion
      ? reducedPageTransition
      : springEase;
    const closeButton = prefersReducedMotion ? reducedCloseButtonVariants : closeButtonVariants;

    return {
      backdrop,
      panel,
      transition,
      panelTransition,
      closeButton,
    };
  }, [animationsDisabled, prefersReducedMotion, isAndroid]);

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
      transition: animationsDisabled
        ? zeroTransition
        : prefersReducedMotion
        ? reducedPageTransition
        : pageTransition,
    }),
    [animationsDisabled, prefersReducedMotion],
  );

  const collapseMotion = useMemo(
    () => ({
      // Use the same collapse animation across platforms so mobile panels
      // behave consistently. Only the backdrop animation is platform-specific.
      variants: prefersReducedMotion ? reducedCollapseVariants : reducedCollapseVariants,
      transition: animationsDisabled
        ? zeroTransition
        : prefersReducedMotion
        ? reducedPageTransition
        : { duration: 0.25, ease: defaultEase },
    }),
    [animationsDisabled, prefersReducedMotion],
  );

  const getItemTransition = useCallback(
    (index: number): Transition => {
      if (animationsDisabled) {
        return zeroTransition;
      }
      if (prefersReducedMotion) {
        return { duration: 0.05 };
      }
      return { delay: Math.min(index, 9) * 0.02, duration: 0.2, ease: defaultEase };
    },
    [animationsDisabled, prefersReducedMotion],
  );

  const toggleTransition: Transition = animationsDisabled
    ? zeroTransition
    : prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.15, ease: defaultEase };

  const chipTransition: Transition = animationsDisabled
    ? zeroTransition
    : prefersReducedMotion
    ? { duration: 0.05 }
    : { duration: 0.12, ease: defaultEase };

  return {
    animationsDisabled,
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
