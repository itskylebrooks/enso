import { useMotionPreferences } from '@shared/components/ui/motion';
import { useFocusTrap } from '@shared/hooks/useFocusTrap';
import type { AppRoute, Locale } from '@shared/types';
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

type TourSegmentId =
  | 'guide-tab'
  | 'techniques-tab'
  | 'techniques-filters'
  | 'terms-tab'
  | 'exercises-tab'
  | 'detail-study-status'
  | 'detail-bookmarks-collections'
  | 'bookmarks-collections'
  | 'search-input';

type LocalizedText = {
  en: string;
  de: string;
};

export type OnboardingTourSegment = {
  id: TourSegmentId;
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  targetSelectors: string[];
  title: LocalizedText;
  description: LocalizedText;
  spotlightOffsetY?: number;
  preferredPanelSide?: 'right' | 'auto';
};

export const ONBOARDING_TOUR_STEP_COUNT = 7;

export const ONBOARDING_TOUR_SEGMENTS: OnboardingTourSegment[] = [
  {
    id: 'guide-tab',
    stepNumber: 1,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-guide"]',
      '[data-tour-target="nav-guide"]',
    ],
    title: {
      en: 'Guide',
      de: 'Guide',
    },
    description: {
      en: 'The Guide is your map. Use it to navigate belt programs, exam tables, and structured overviews so you always know what to practice next.',
      de: 'Der Guide ist deine Karte. Hier findest du Gürtelprogramme, Prüfungstabellen und Übersichten, damit du immer weißt, was als Nächstes dran ist.',
    },
  },
  {
    id: 'techniques-tab',
    stepNumber: 2,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-techniques"]',
      '[data-tour-target="nav-techniques"]',
    ],
    title: {
      en: 'Techniques',
      de: 'Techniken',
    },
    description: {
      en: 'Browse technique pages with clear variants and media. Each technique has its own URL, so you can return to it anytime.',
      de: 'Entdecke Technikseiten mit Varianten und Medien. Jede Technik hat eine eigene URL — so kannst du jederzeit zurückkehren.',
    },
  },
  {
    id: 'techniques-filters',
    stepNumber: 3,
    targetSelectors: ['[data-tour-target="techniques-filters-trigger"]'],
    title: {
      en: 'Filters',
      de: 'Filter',
    },
    description: {
      en: 'Use filters to narrow down the list — for example by belt level, direction, stance, or other technique attributes.',
      de: 'Nutze Filter, um die Liste einzugrenzen — zum Beispiel nach Gürtelstufe, Richtung, Stand oder anderen Merkmalen.',
    },
  },
  {
    id: 'terms-tab',
    stepNumber: 4,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-terms"]',
      '[data-tour-target="nav-terms"]',
    ],
    title: {
      en: 'Terms',
      de: 'Begriffe',
    },
    description: {
      en: 'Terms are short definitions for dojo language. Use them to build clarity around what you hear in training.',
      de: 'Begriffe sind kurze Erklärungen für die Sprache im Dōjō. Sie helfen dir, das Gehörte im Training besser einzuordnen.',
    },
  },
  {
    id: 'exercises-tab',
    stepNumber: 5,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-exercises"]',
      '[data-tour-target="nav-exercises"]',
    ],
    title: {
      en: 'Exercises',
      de: 'Übungen',
    },
    description: {
      en: 'Exercises support your training outside the dojo — mobility, strength, balance, coordination, power, and recovery.',
      de: 'Übungen unterstützen dein Training außerhalb des Dōjō — Mobilität, Kraft, Balance, Koordination, Explosivität und Regeneration.',
    },
  },
  {
    id: 'detail-study-status',
    stepNumber: 6,
    targetSelectors: ['[data-tour-target="detail-study-status"]'],
    title: {
      en: 'Study status',
      de: 'Lernstatus',
    },
    description: {
      en: 'Mark an item as None, Practice, or Stable. This is separate from bookmarks and helps you track your study progress locally.',
      de: 'Markiere einen Eintrag als Kein Status, Üben oder Stabil. Das ist getrennt von Lesezeichen und hilft dir, deinen Lernfortschritt lokal zu verfolgen.',
    },
  },
  {
    id: 'detail-bookmarks-collections',
    stepNumber: 6,
    targetSelectors: ['[data-tour-target="detail-bookmarks-collections"]'],
    title: {
      en: 'Bookmarks and collections',
      de: 'Lesezeichen und Sammlungen',
    },
    description: {
      en: 'Bookmark items you want to keep close, and organize them into collections that match your personal study paths.',
      de: 'Speichere wichtige Einträge als Lesezeichen und ordne sie in Sammlungen, die zu deinem persönlichen Lernweg passen.',
    },
  },
  {
    id: 'bookmarks-collections',
    stepNumber: 7,
    targetSelectors: ['[data-tour-target="bookmarks-collections-sidebar"]'],
    preferredPanelSide: 'right',
    title: {
      en: 'Bookmarks',
      de: 'Lesezeichen',
    },
    description: {
      en: 'Your bookmarks are your study space. Create collections to group techniques, terms, and exercises the way you train.',
      de: 'Lesezeichen sind dein Lernbereich. Erstelle Sammlungen und gruppiere Techniken, Begriffe und Übungen so, wie du trainierst.',
    },
  },
  {
    id: 'search-input',
    stepNumber: 7,
    targetSelectors: ['[data-tour-target="search-input"]'],
    title: {
      en: 'Search shortcuts',
      de: 'Suchkürzel',
    },
    description: {
      en: 'Search everything from one place. Tip: press Tab after typing a filter token — T for techniques, E for exercises, G for terms. Belt filters also work: 1K–5K.',
      de: 'Suche alles an einem Ort. Tipp: Drücke Tab nach einem Filterkürzel — T für Techniken, U/Ü für Übungen, B für Begriffe. Gürtel-Filter funktionieren auch: 1K–5K.',
    },
  },
];

const SEGMENT_BY_ID = ONBOARDING_TOUR_SEGMENTS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<TourSegmentId, OnboardingTourSegment>,
);

type OnboardingTourOverlayProps = {
  locale: Locale;
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

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

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
  locale,
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
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [geometrySegmentId, setGeometrySegmentId] = useState<TourSegmentId>('guide-tab');
  const [panelLayout, setPanelLayout] = useState<PanelLayout>({
    style: { width: 'min(360px, calc(100vw - 32px))', left: '16px', top: '16px' },
  });

  const segment = ONBOARDING_TOUR_SEGMENTS[clamp(segmentIndex, 0, ONBOARDING_TOUR_SEGMENTS.length - 1)];
  const isLastSegment = segmentIndex >= ONBOARDING_TOUR_SEGMENTS.length - 1;
  const isSegmentAligned = useMemo(
    () => getSegmentAligned(segment, route, isTechniqueDetailOpen, searchOpen),
    [isTechniqueDetailOpen, route, searchOpen, segment],
  );
  const geometrySegment = SEGMENT_BY_ID[geometrySegmentId] ?? segment;

  const labels = useMemo(
    () =>
      locale === 'de'
        ? {
            step: 'Schritt',
            of: 'von',
            back: 'Zurück',
            next: 'Weiter',
            finish: 'Fertig',
            skip: 'Tour überspringen',
            returnPrompt: 'Du hast diese Tour-Stufe verlassen.',
            returnButton: 'Zur Tour-Stufe zurück',
            completionTitle: 'Du bist bereit.',
            completionBody:
              'Enso ist local-first und datenschutzfreundlich. Du kannst deine Daten jederzeit in den Einstellungen exportieren oder löschen.',
            goHome: 'Zur Startseite',
            settings: 'Einstellungen',
          }
        : {
            step: 'Step',
            of: 'of',
            back: 'Back',
            next: 'Next',
            finish: 'Finish',
            skip: 'Skip tour',
            returnPrompt: 'You moved away from this step.',
            returnButton: 'Return to tour step',
            completionTitle: 'You’re ready.',
            completionBody:
              'Enso is local-first and privacy-friendly. You can export or erase your data anytime in Settings.',
            goHome: 'Go to Home',
            settings: 'Settings',
          },
    [locale],
  );

  useFocusTrap(isOpen, panelRef, onSkip);

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
    if (!isOpen || completionVisible || !isSegmentAligned) {
      return;
    }

    const target = findVisibleTarget(segment.targetSelectors);
    if (!target) {
      return;
    }

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
    completionVisible,
    isOpen,
    isSegmentAligned,
    prefersReducedMotion,
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

  const spotlightRect = useMemo(() => {
    if (!targetRect || completionVisible) return null;
    const viewportWidth = typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerWidth;
    const viewportHeight =
      typeof window === 'undefined' ? Number.POSITIVE_INFINITY : window.innerHeight;
    const padding = 8;
    const top = Math.max(8, targetRect.top - padding);
    const left = Math.max(8, targetRect.left - padding);
    const offsetY = geometrySegment.spotlightOffsetY ?? 0;
    const width = Math.min(viewportWidth - left - 8, targetRect.width + padding * 2);
    const height = Math.min(viewportHeight - top - 8, targetRect.height + padding * 2);

    return { top: top + offsetY, left, width, height };
  }, [completionVisible, geometrySegment.spotlightOffsetY, targetRect]);

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
      const comfortMaxTop =
        spotlightRect.top > viewportHeight * 0.6
          ? Math.min(maxTop, centeredTop + 40)
          : maxTop;

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
      return;
    }

    const gap = 14;
    const minPadding = 12;

    const canPlaceRight =
      spotlightRect.left + spotlightRect.width + gap + panelWidth <= viewportWidth - minPadding;
    const canPlaceLeft = spotlightRect.left - gap - panelWidth >= minPadding;
    const canPlaceBottom = spotlightRect.top + spotlightRect.height + gap + panelHeight <= viewportHeight - minPadding;
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
  }, [completionVisible, geometrySegment.preferredPanelSide, isOpen, spotlightRect, segmentIndex]);

  if (!isOpen) return null;

  const stepLabel = `${labels.step} ${segment.stepNumber} ${labels.of} ${ONBOARDING_TOUR_STEP_COUNT}`;
  const title = segment.title[locale];
  const description = segment.description[locale];
  const nextLabel = isLastSegment ? labels.finish : labels.next;
  const panelPosition = {
    top: panelLayout.style.top ?? '16px',
    left: panelLayout.style.left ?? '16px',
    width: panelLayout.style.width ?? 'min(360px, calc(100vw - 32px))',
    right: 'unset',
    bottom: 'unset',
    height: 'auto',
  };

  return (
    <div className="fixed inset-0 z-[70]">
      {!completionVisible && spotlightRect ? (
        <motion.div
          initial={false}
          className="pointer-events-none absolute rounded-2xl"
          animate={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { type: 'spring', stiffness: 260, damping: 30, mass: 0.95 }
          }
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.68)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {!completionVisible && spotlightRect && (
        <motion.div
          initial={false}
          className="pointer-events-none absolute rounded-2xl border border-white/70"
          animate={{
            top: spotlightRect.top - 2,
            left: spotlightRect.left - 2,
            width: spotlightRect.width + 4,
            height: spotlightRect.height + 4,
            opacity: 0.9,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : { type: 'spring', stiffness: 260, damping: 30, mass: 0.95 }
          }
          style={{
            boxShadow: '0 0 22px rgba(255, 255, 255, 0.2)',
          }}
        />
      )}

      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto absolute rounded-2xl border surface-border surface panel-shadow p-4 md:p-5 space-y-4 max-h-[calc(100vh-24px)] overflow-y-auto"
          style={{ position: 'absolute' }}
          initial={false}
          animate={{
            ...(panelPosition as Record<string, string | number>),
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : {
                  type: 'spring',
                  stiffness: 280,
                  damping: 32,
                  mass: 0.9,
                }
          }
        >
          {completionVisible ? (
            <>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold leading-tight">{labels.completionTitle}</h2>
                <p className="text-sm text-subtle">{labels.completionBody}</p>
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="px-4 py-2 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  >
                    {labels.settings}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onGoHome}
                  className="px-4 py-2 rounded-lg border btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  {labels.goHome}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-subtle">{stepLabel}</p>
                <h2 className="text-lg font-semibold leading-tight">{title}</h2>
                <p className="text-sm text-subtle line-clamp-3 md:line-clamp-none">{description}</p>
              </div>

              {!isSegmentAligned && (
                <div className="rounded-xl border surface-border bg-[var(--color-surface-hover)] px-3 py-2 text-xs text-subtle space-y-2">
                  <p>{labels.returnPrompt}</p>
                  <button
                    type="button"
                    onClick={onReturnToStep}
                    className="px-3 py-1.5 rounded-lg border btn-tonal surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                  >
                    {labels.returnButton}
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
                  {labels.back}
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="justify-self-center text-sm text-subtle underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
                >
                  {labels.skip}
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  className="justify-self-end px-3 py-2 rounded-lg border btn-contrast focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
                >
                  {nextLabel}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
