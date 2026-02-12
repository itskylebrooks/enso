import { useMotionPreferences } from '@shared/components/ui/motion';
import type { Copy } from '@shared/constants/i18n';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import type { AppRoute } from '@shared/types';
import { motion } from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react';
import {
  ONBOARDING_TOUR_SEGMENTS,
  ONBOARDING_TOUR_STEP_COUNT,
  type OnboardingTourSegment,
  type TourSegmentId,
} from '../constants';

const SEGMENT_BY_ID = ONBOARDING_TOUR_SEGMENTS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<TourSegmentId, OnboardingTourSegment>,
);

type OnboardingTourOverlayProps = {
  copy: Copy;
  isOpen: boolean;
  segmentIndex: number;
  route: AppRoute;
  isTechniqueDetailOpen: boolean;
  searchOpen: boolean;
  completionVisible: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onReturnToStep: () => void;
  onGoHome: () => void;
  onOpenSettings?: () => void;
};

type PanelLayout = {
  style: CSSProperties;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const isElementVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

const isAnchoredToViewport = (element: HTMLElement): boolean => {
  let current: HTMLElement | null = element;
  while (current) {
    const position = window.getComputedStyle(current).position;
    if (position === 'fixed' || position === 'sticky') {
      return true;
    }
    current = current.parentElement;
  }
  return false;
};

const findVisibleTarget = (selectors: string[]): HTMLElement | null => {
  for (const selector of selectors) {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(selector));
    for (const candidate of candidates) {
      if (isElementVisible(candidate)) {
        return candidate;
      }
    }
  }
  return null;
};

const getSegmentAligned = (
  segment: OnboardingTourSegment,
  route: AppRoute,
  isTechniqueDetailOpen: boolean,
  searchOpen: boolean,
): boolean => {
  switch (segment.id) {
    case 'guide-tab':
      return route === 'guide';
    case 'techniques-tab':
    case 'techniques-filters':
      return route === 'techniques' && !isTechniqueDetailOpen;
    case 'terms-tab':
      return route === 'terms';
    case 'exercises-tab':
      return route === 'exercises';
    case 'detail-study-status':
    case 'detail-bookmarks-collections':
      return isTechniqueDetailOpen;
    case 'bookmarks-collections':
      return route === 'bookmarks' && !searchOpen;
    case 'search-input':
      return route === 'bookmarks' && searchOpen;
    default:
      return false;
  }
};

export const OnboardingTourOverlay = ({
  copy,
  isOpen,
  segmentIndex,
  route,
  isTechniqueDetailOpen,
  searchOpen,
  completionVisible,
  onBack,
  onNext,
  onSkip,
  onReturnToStep,
  onGoHome,
  onOpenSettings,
}: OnboardingTourOverlayProps): ReactElement | null => {
  const { prefersReducedMotion } = useMotionPreferences();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrolledSegmentsRef = useRef<Set<TourSegmentId>>(new Set());
  const clearTargetTimeoutRef = useRef<number | null>(null);
  const wasOpenRef = useRef(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [geometrySegmentId, setGeometrySegmentId] = useState<TourSegmentId>('guide-tab');
  const [isEntering, setIsEntering] = useState(false);
  const segmentEntryRef = useRef<{ id: TourSegmentId; enteredAt: number }>({
    id: 'guide-tab',
    enteredAt: Date.now(),
  });
  const [panelLayout, setPanelLayout] = useState<PanelLayout>({
    style: { width: 'min(360px, calc(100vw - 32px))', left: '16px', top: '16px' },
  });

  const segment =
    ONBOARDING_TOUR_SEGMENTS[clamp(segmentIndex, 0, ONBOARDING_TOUR_SEGMENTS.length - 1)];
  const isLastSegment = segmentIndex >= ONBOARDING_TOUR_SEGMENTS.length - 1;
  const isSegmentAligned = useMemo(
    () => getSegmentAligned(segment, route, isTechniqueDetailOpen, searchOpen),
    [isTechniqueDetailOpen, route, searchOpen, segment],
  );
  if (segmentEntryRef.current.id !== segment.id) {
    segmentEntryRef.current = { id: segment.id, enteredAt: Date.now() };
  }
  const geometrySegment = SEGMENT_BY_ID[geometrySegmentId] ?? segment;
  const tourCopy = copy.onboarding.tour;

  const clearScheduledTargetClear = useCallback(() => {
    if (clearTargetTimeoutRef.current) {
      window.clearTimeout(clearTargetTimeoutRef.current);
      clearTargetTimeoutRef.current = null;
    }
  }, []);

  const scheduleTargetClear = useCallback(() => {
    if (clearTargetTimeoutRef.current) return;
    clearTargetTimeoutRef.current = window.setTimeout(() => {
      setTargetElement(null);
      setTargetRect(null);
      clearTargetTimeoutRef.current = null;
    }, prefersReducedMotion ? 80 : 320);
  }, [prefersReducedMotion]);

  useFocusTrap(isOpen, panelRef, onSkip);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      clearScheduledTargetClear();
      setIsEntering(true);
      setTargetElement(null);
      setTargetRect(null);
      segmentEntryRef.current = { id: segment.id, enteredAt: Date.now() };
      scrolledSegmentsRef.current.clear();
      wasOpenRef.current = true;
      return undefined;
    }

    if (!isOpen && wasOpenRef.current) {
      clearScheduledTargetClear();
      setIsEntering(false);
      setTargetElement(null);
      setTargetRect(null);
      wasOpenRef.current = false;
    }

    return undefined;
  }, [clearScheduledTargetClear, isOpen, segment.id]);

  useEffect(
    () => () => {
      clearScheduledTargetClear();
    },
    [clearScheduledTargetClear],
  );

  useEffect(() => {
    if (!isEntering) return undefined;
    const timeoutId = window.setTimeout(
      () => setIsEntering(false),
      prefersReducedMotion ? 16 : 220,
    );
    return () => window.clearTimeout(timeoutId);
  }, [isEntering, prefersReducedMotion]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onSkip();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onSkip]);

  const measureTarget = useCallback(() => {
    if (!isOpen || completionVisible) {
      scheduleTargetClear();
      return;
    }
    if (!isSegmentAligned) {
      return;
    }

    const panelSelector = segment.targetSelectors.find((selector) =>
      selector.includes('[data-tour-panel="true"]'),
    );
    const shouldPreferExpandedPanel =
      (segment.id === 'techniques-filters' || segment.id === 'bookmarks-collections') &&
      Boolean(panelSelector);
    let target: HTMLElement | null = null;

    if (shouldPreferExpandedPanel && panelSelector) {
      target = findVisibleTarget([panelSelector]);
      if (!target) {
        const elapsed = Date.now() - segmentEntryRef.current.enteredAt;
        const expandedPanelWaitMs = prefersReducedMotion ? 120 : 420;
        if (elapsed < expandedPanelWaitMs) {
          clearScheduledTargetClear();
          return;
        }
      }
    }

    if (!target) {
      target = findVisibleTarget(segment.targetSelectors);
    }

    if (!target) {
      scheduleTargetClear();
      return;
    }
    clearScheduledTargetClear();
    setTargetElement(target);

    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const offscreen =
      rect.top < 12 ||
      rect.left < 12 ||
      rect.bottom > viewportHeight - 12 ||
      rect.right > viewportWidth - 12;
    const farOffscreen =
      rect.bottom <= 0 ||
      rect.top >= viewportHeight ||
      rect.right <= 0 ||
      rect.left >= viewportWidth;
    const nearBottomOnMobile =
      viewportWidth < 768 && rect.bottom > viewportHeight - 220 && !isAnchoredToViewport(target);

    if (farOffscreen) {
      if (!scrolledSegmentsRef.current.has(segment.id)) {
        scrolledSegmentsRef.current.add(segment.id);
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
      return;
    }

    clearScheduledTargetClear();
    setTargetRect(rect);
    setGeometrySegmentId(segment.id);

    if (scrolledSegmentsRef.current.has(segment.id)) {
      return;
    }

    if (offscreen || nearBottomOnMobile) {
      scrolledSegmentsRef.current.add(segment.id);
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [
    clearScheduledTargetClear,
    completionVisible,
    isOpen,
    isSegmentAligned,
    prefersReducedMotion,
    scheduleTargetClear,
    segment.id,
    segment.targetSelectors,
  ]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    measureTarget();
    const timeoutIds = [60, 180, 320].map((delay) => window.setTimeout(measureTarget, delay));

    let rafId = 0;
    const handleViewportChange = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(measureTarget);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, measureTarget, segmentIndex]);

  useLayoutEffect(() => {
    if (!isOpen || !targetElement || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      measureTarget();
    });
    observer.observe(targetElement);
    return () => observer.disconnect();
  }, [isOpen, measureTarget, targetElement]);

  const spotlightRect = useMemo(() => {
    if (!targetRect || completionVisible) return null;
    const viewportWidth =
      typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerWidth;
    const viewportHeight =
      typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerHeight;
    const minInset = 8;
    const preferredPadding = 8;
    const availableLeft = Math.max(0, targetRect.left - minInset);
    const availableRight = Math.max(0, viewportWidth - minInset - targetRect.right);
    const availableTop = Math.max(0, targetRect.top - minInset);
    const availableBottom = Math.max(0, viewportHeight - minInset - targetRect.bottom);
    const paddingX = Math.min(preferredPadding, availableLeft, availableRight);
    const paddingY = Math.min(preferredPadding, availableTop, availableBottom);
    const spotlightWidth = Math.min(targetRect.width + paddingX * 2, viewportWidth - minInset * 2);
    const isMobile = viewportWidth < 768;
    const applyMobilePanelOffsets =
      isMobile &&
      (geometrySegment.id === 'techniques-filters' || geometrySegment.id === 'bookmarks-collections');
    const heightOffset = applyMobilePanelOffsets ? (geometrySegment.spotlightHeightOffset ?? 0) : 0;
    const spotlightHeight = Math.min(
      targetRect.height + paddingY * 2 + heightOffset,
      viewportHeight - minInset * 2,
    );
    const unclampedLeft = targetRect.left - paddingX;
    const offsetY = applyMobilePanelOffsets ? (geometrySegment.spotlightOffsetY ?? 0) : 0;
    const unclampedTop = targetRect.top - paddingY + offsetY - heightOffset;
    const left = clamp(unclampedLeft, minInset, viewportWidth - spotlightWidth - minInset);
    const top = clamp(unclampedTop, minInset, viewportHeight - spotlightHeight - minInset);

    return { top, left, width: spotlightWidth, height: spotlightHeight };
  }, [
    completionVisible,
    geometrySegment.id,
    geometrySegment.spotlightOffsetY,
    geometrySegment.spotlightHeightOffset,
    targetRect,
  ]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = Math.min(360, viewportWidth - 32);
    const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 220;
    const isMobile = viewportWidth < 768;

    if (completionVisible) {
      if (isMobile) {
        const mobileBottomClearance = 104;
        const centeredTop = clamp(
          Math.round((viewportHeight - panelHeight) / 2),
          12,
          Math.max(12, viewportHeight - panelHeight - mobileBottomClearance),
        );
        setPanelLayout({
          style: {
            width: `${panelWidth}px`,
            left: `${Math.round((viewportWidth - panelWidth) / 2)}px`,
            top: `${centeredTop}px`,
          },
        });
        return;
      }

      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round((viewportWidth - panelWidth) / 2)}px`,
          top: `${Math.round(Math.max(16, (viewportHeight - panelHeight) / 2))}px`,
        },
      });
      return;
    }

    if (isMobile) {
      const mobileTopPadding = 12;
      const mobileBottomClearance = 104;
      const gap = 12;
      const centeredTop = clamp(
        Math.round((viewportHeight - panelHeight) / 2),
        mobileTopPadding,
        Math.max(mobileTopPadding, viewportHeight - panelHeight - mobileBottomClearance),
      );

      if (!spotlightRect) {
        setPanelLayout({
          style: {
            width: `${panelWidth}px`,
            left: `${Math.round((viewportWidth - panelWidth) / 2)}px`,
            top: `${centeredTop}px`,
          },
        });
        return;
      }

      const belowTop = spotlightRect.top + spotlightRect.height + gap;
      const aboveTop = spotlightRect.top - panelHeight - gap;
      const maxTop = viewportHeight - panelHeight - mobileBottomClearance;
      const preferBelowFallback = geometrySegment.id === 'techniques-filters';
      const comfortMaxTop =
        spotlightRect.top > viewportHeight * 0.6 ? Math.min(maxTop, centeredTop + 40) : maxTop;

      if (preferBelowFallback) {
        // Keep step 3 attached under the filter panel. If it overflows, choose the lowest valid top.
        const top = clamp(belowTop, mobileTopPadding, Math.max(mobileTopPadding, maxTop));
        setPanelLayout({
          style: {
            width: `${panelWidth}px`,
            left: `${Math.round((viewportWidth - panelWidth) / 2)}px`,
            top: `${Math.round(top)}px`,
          },
        });
        return;
      }

      let top = centeredTop;
      if (belowTop <= maxTop) {
        top = belowTop;
      } else if (aboveTop >= mobileTopPadding) {
        top = aboveTop;
      }

      top = clamp(top, mobileTopPadding, Math.max(mobileTopPadding, comfortMaxTop));

      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round((viewportWidth - panelWidth) / 2)}px`,
          top: `${Math.round(top)}px`,
        },
      });
      return;
    }
    if (!spotlightRect) {
      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round((viewportWidth - panelWidth) / 2)}px`,
          top: `${Math.round(Math.max(16, (viewportHeight - panelHeight) / 2))}px`,
        },
      });
      return;
    }

    const gap = 14;
    const minPadding = 12;

    const canPlaceRight =
      spotlightRect.left + spotlightRect.width + gap + panelWidth <= viewportWidth - minPadding;
    const canPlaceLeft = spotlightRect.left - gap - panelWidth >= minPadding;
    const canPlaceBottom =
      spotlightRect.top + spotlightRect.height + gap + panelHeight <= viewportHeight - minPadding;
    const canPlaceTop = spotlightRect.top - gap - panelHeight >= minPadding;

    if (geometrySegment.preferredPanelSide === 'right' && canPlaceRight) {
      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round(spotlightRect.left + spotlightRect.width + gap)}px`,
          top: `${Math.round(
            clamp(spotlightRect.top - 8, minPadding, viewportHeight - panelHeight - minPadding),
          )}px`,
        },
      });
      return;
    }

    if (canPlaceRight) {
      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round(spotlightRect.left + spotlightRect.width + gap)}px`,
          top: `${Math.round(clamp(spotlightRect.top - 8, minPadding, viewportHeight - panelHeight - minPadding))}px`,
        },
      });
      return;
    }

    if (canPlaceLeft) {
      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round(spotlightRect.left - panelWidth - gap)}px`,
          top: `${Math.round(clamp(spotlightRect.top - 8, minPadding, viewportHeight - panelHeight - minPadding))}px`,
        },
      });
      return;
    }

    if (canPlaceBottom) {
      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round(clamp(spotlightRect.left, minPadding, viewportWidth - panelWidth - minPadding))}px`,
          top: `${Math.round(spotlightRect.top + spotlightRect.height + gap)}px`,
        },
      });
      return;
    }

    if (canPlaceTop) {
      setPanelLayout({
        style: {
          width: `${panelWidth}px`,
          left: `${Math.round(clamp(spotlightRect.left, minPadding, viewportWidth - panelWidth - minPadding))}px`,
          top: `${Math.round(spotlightRect.top - panelHeight - gap)}px`,
        },
      });
      return;
    }

    const fallbackTop = Math.round(Math.max(minPadding, viewportHeight - panelHeight - minPadding));
    setPanelLayout({
      style: {
        width: `${panelWidth}px`,
        left: `${Math.round((viewportWidth - panelWidth) / 2)}px`,
        top: `${fallbackTop}px`,
      },
    });
  }, [
    completionVisible,
    geometrySegment.id,
    geometrySegment.preferredPanelSide,
    isOpen,
    spotlightRect,
    segmentIndex,
  ]);

  if (!isOpen) return null;

  const segmentCopy = tourCopy.segments[segment.id];
  const stepLabel = `${tourCopy.step} ${segment.stepNumber} ${tourCopy.of} ${ONBOARDING_TOUR_STEP_COUNT}`;
  const nextLabel = isLastSegment ? tourCopy.finish : tourCopy.next;
  const progressWidth = `${Math.round((segment.stepNumber / ONBOARDING_TOUR_STEP_COUNT) * 100)}%`;
  const isGuideStepEntering = isEntering && segment.id === 'guide-tab';
  const panelPosition = {
    top: panelLayout.style.top ?? '16px',
    left: panelLayout.style.left ?? '16px',
    width: panelLayout.style.width ?? 'min(360px, calc(100vw - 32px))',
    right: 'unset',
    bottom: 'unset',
    height: 'auto',
  };
  const spotlightTransition = prefersReducedMotion
    ? ({ duration: 0.01 } as const)
    : isGuideStepEntering
      ? ({
          top: { duration: 0 },
          left: { duration: 0 },
          width: { duration: 0 },
          height: { duration: 0 },
          opacity: { duration: 0.28, ease: 'easeOut' },
        } as const)
    : isEntering
      ? ({
          top: { duration: 0 },
          left: { duration: 0 },
          width: { duration: 0 },
          height: { duration: 0 },
          opacity: { duration: 0.14, ease: 'easeOut' },
        } as const)
      : ({ duration: 0.2, ease: [0.22, 1, 0.36, 1] } as const);
  const panelTransition = prefersReducedMotion
    ? ({ duration: 0.01 } as const)
    : isGuideStepEntering
      ? ({
          top: { duration: 0 },
          left: { duration: 0 },
          width: { duration: 0 },
          y: { duration: 0 },
          scale: { duration: 0 },
          opacity: { duration: 0.28, ease: 'easeOut' },
        } as const)
    : isEntering
      ? ({
          top: { duration: 0 },
          left: { duration: 0 },
          width: { duration: 0 },
          y: { duration: 0 },
          scale: { duration: 0 },
          opacity: { duration: 0.12, ease: 'easeOut' },
        } as const)
      : ({ duration: 0.2, ease: [0.22, 1, 0.36, 1] } as const);
  const dialogTitleId = completionVisible
    ? 'onboarding-tour-complete-title'
    : `onboarding-tour-${segment.id}-title`;
  const dialogDescriptionId = completionVisible
    ? 'onboarding-tour-complete-description'
    : `onboarding-tour-${segment.id}-description`;

  return (
    <div className="fixed inset-0 z-[70]">
      {!completionVisible && spotlightRect ? (
        <motion.div
          initial={isEntering ? { opacity: 0 } : false}
          className="pointer-events-none absolute rounded-2xl"
          animate={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            opacity: 1,
          }}
          transition={spotlightTransition}
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.68)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {!completionVisible && spotlightRect && (
        <motion.div
          initial={isEntering ? { opacity: 0 } : false}
          className="pointer-events-none absolute rounded-2xl border border-white/70"
          animate={{
            top: spotlightRect.top - 2,
            left: spotlightRect.left - 2,
            width: spotlightRect.width + 4,
            height: spotlightRect.height + 4,
            opacity: 0.9,
          }}
          transition={spotlightTransition}
          style={{
            boxShadow: '0 0 22px rgba(255, 255, 255, 0.2)',
          }}
        />
      )}
      {!completionVisible && spotlightRect && !prefersReducedMotion && (
        <motion.div
          initial={isGuideStepEntering ? { opacity: 0 } : false}
          className="pointer-events-none absolute rounded-2xl border border-white/35"
          style={{
            top: spotlightRect.top - 5,
            left: spotlightRect.left - 5,
            width: spotlightRect.width + 10,
            height: spotlightRect.height + 10,
          }}
          animate={
            isGuideStepEntering
              ? { opacity: [0, 0.18, 0.38, 0.18], scale: [1, 1, 1.03, 1] }
              : { opacity: [0.18, 0.38, 0.18], scale: [1, 1.03, 1] }
          }
          transition={{
            duration: isGuideStepEntering ? 2.0 : 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescriptionId}
          className="pointer-events-auto absolute rounded-2xl border surface-border surface panel-shadow p-4 md:p-5 space-y-4 max-h-[calc(100vh-24px)] overflow-y-auto"
          style={{ position: 'absolute' }}
          initial={isEntering ? { opacity: 0, y: 0, scale: 1 } : false}
          animate={{
            ...(panelPosition as Record<string, string | number>),
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={panelTransition}
        >
          {completionVisible ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 id={dialogTitleId} className="text-lg font-semibold leading-tight">
                  {tourCopy.completionTitle}
                </h2>
                <p id={dialogDescriptionId} className="text-sm text-subtle">
                  {tourCopy.completionBody}
                </p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="px-4 py-2 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  >
                    {tourCopy.settings}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onGoHome}
                  className="px-4 py-2 rounded-lg border btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  {tourCopy.goHome}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-text)]"
                  initial={false}
                  animate={{ width: progressWidth }}
                  transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.24 }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-subtle">{stepLabel}</p>
                <h2 id={dialogTitleId} className="text-lg font-semibold leading-tight">
                  {segmentCopy.title}
                </h2>
                <p id={dialogDescriptionId} className="text-sm text-subtle line-clamp-3 md:line-clamp-none">
                  {segmentCopy.description}
                </p>
              </div>

              {!isSegmentAligned && (
                <div className="rounded-xl border surface-border bg-[var(--color-surface-hover)] px-3 py-2 text-xs text-subtle space-y-2">
                  <p>{tourCopy.returnPrompt}</p>
                  <button
                    type="button"
                    onClick={onReturnToStep}
                    className="px-3 py-1.5 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  >
                    {tourCopy.returnButton}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 items-center gap-2">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={segmentIndex === 0}
                  className="justify-self-start px-3 py-2 rounded-lg border btn-tonal surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  {tourCopy.back}
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="justify-self-center text-sm text-subtle underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
                >
                  {tourCopy.skip}
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="justify-self-end px-3 py-2 rounded-lg border btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  {nextLabel}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
