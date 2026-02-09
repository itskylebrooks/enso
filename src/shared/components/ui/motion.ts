import { useReducedMotion, type Transition, type Variants } from 'motion/react';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

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

export const defaultEase = [0.2, 0.8, 0.2, 1] as const;
export const pageEase = [0.4, 0, 0.2, 1] as const;
export const springEase = { type: 'spring', stiffness: 700, damping: 30, mass: 0.6 } as const;

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export const reducedPageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const pageTransition: Transition = { duration: 0.22 };
export const reducedPageTransition: Transition = { duration: 0.06 };

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

// Android-optimized backdrop: Remove blur entirely for maximum performance.
// Uses a darker semi-transparent background that visually approximates the
// blur effect while being much cheaper to composite during animations.
export const androidBackdropVariants: Variants = {
  initial: {
    opacity: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  animate: {
    opacity: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  exit: {
    opacity: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
};

export const reducedBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const panelVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

// Android-optimized panel: Simpler animation without scale transforms
// which can cause expensive repaints when combined with backdrop effects.
export const androidPanelVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Hint that transforms and opacity will change to allow the browser to
// promote the element to its own layer on some platforms.
export const panelVariantsWithHints: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98, willChange: 'transform, opacity' },
  animate: { opacity: 1, y: 0, scale: 1, willChange: 'transform, opacity' },
  exit: { opacity: 0, y: -8, scale: 0.98, willChange: 'transform, opacity' },
};

export const reducedPanelVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const listContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0 },
  },
};

export const reducedListContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0 },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 1 },
  show: { opacity: 1 },
};

export const reducedListItemVariants: Variants = {
  hidden: { opacity: 1 },
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

  const overlayMotion = useMemo(() => {
    const backdrop = prefersReducedMotion ? reducedBackdropVariants : backdropVariants;
    const panel = prefersReducedMotion ? reducedPanelVariants : panelVariants;
    const transition = animationsDisabled
      ? zeroTransition
      : prefersReducedMotion
        ? reducedPageTransition
        : { duration: 0.18, ease: defaultEase };
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
  }, [animationsDisabled, prefersReducedMotion]);

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_index: number): Transition => {
      if (animationsDisabled) {
        return zeroTransition;
      }
      if (prefersReducedMotion) {
        return { duration: 0.05 };
      }
      return { duration: 0.18, ease: defaultEase };
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
