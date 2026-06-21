import { ONBOARDING_TOUR_SEGMENTS } from '@features/onboarding/constants';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SyncHomepageState } from '../../lib/supabase/types';
import {
  loadOnboardingCompleted,
  loadOnboardingDismissed,
  loadOnboardingStep,
  saveOnboardingCompleted,
  saveOnboardingDismissed,
  saveOnboardingStep,
} from '../services/storageService';
import type { AppRoute, TechniqueVariantKey } from '../types';
import {
  getActiveTourSegment,
  isTourSegmentAligned,
  normalizeTourSegmentIndex,
  shouldShowHomeOnboardingCard,
} from './onboardingModel';

type OpenTechniqueForOnboarding = (
  slug: string,
  trainerId?: string,
  entry?: undefined,
  skipExistenceCheck?: boolean,
  options?: { originRoute?: AppRoute },
  bookmarkedVariant?: TechniqueVariantKey,
) => void;

export type OnboardingSyncController = {
  applySyncedOnboarding: (
    homepage: Pick<
      SyncHomepageState,
      'onboardingDismissed' | 'onboardingCompleted' | 'onboardingStep'
    >,
  ) => void;
};

type LastAppliedHomepageSnapshot = {
  homepage?: string;
};

type UseOnboardingControllerParams = {
  route: AppRoute;
  activeSlug: string | null;
  searchOpen: boolean;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
  navigateTo: (route: AppRoute, options?: { replace?: boolean; sourceRoute?: AppRoute }) => void;
  openTechnique: OpenTechniqueForOnboarding;
  tourTechniqueSlug: string | null;
  isTechniqueDetailOpen: boolean;
  markHomepageChanged: () => void;
  syncPauseAutoPushRef: MutableRefObject<boolean>;
  lastAppliedSyncSnapshotRef: MutableRefObject<LastAppliedHomepageSnapshot>;
  getCurrentHomepageSyncSnapshot: () => string;
  prefersReducedMotion: boolean;
};

export const useOnboardingController = ({
  route,
  activeSlug,
  searchOpen,
  setSearchOpen,
  navigateTo,
  openTechnique,
  tourTechniqueSlug,
  isTechniqueDetailOpen,
  markHomepageChanged,
  syncPauseAutoPushRef,
  lastAppliedSyncSnapshotRef,
  getCurrentHomepageSyncSnapshot,
  prefersReducedMotion,
}: UseOnboardingControllerParams) => {
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(() =>
    loadOnboardingDismissed(),
  );
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() =>
    loadOnboardingCompleted(),
  );
  const [onboardingStep, setOnboardingStep] = useState<number | null>(() => loadOnboardingStep());
  const [tourOpen, setTourOpen] = useState(false);
  const [tourSegmentIndex, setTourSegmentIndex] = useState<number>(() =>
    normalizeTourSegmentIndex(loadOnboardingStep()),
  );
  const [tourCompletionVisible, setTourCompletionVisible] = useState(false);
  const [showTourCompletionConfetti, setShowTourCompletionConfetti] = useState(false);

  const onboardingDismissedPersistedRef = useRef(false);
  const onboardingCompletedPersistedRef = useRef(false);

  const syncTourSegment = useCallback(
    (segmentIndex: number): void => {
      const segment = ONBOARDING_TOUR_SEGMENTS[normalizeTourSegmentIndex(segmentIndex)];
      if (!segment) return;

      if (segment.id !== 'search-input' && searchOpen) {
        setSearchOpen(false);
      }

      switch (segment.id) {
        case 'exams-tab': {
          if (route !== 'exams' || activeSlug) {
            navigateTo('exams');
          }
          return;
        }
        case 'techniques-tab':
        case 'techniques-filters': {
          if (route !== 'libraryTechniques' || activeSlug) {
            navigateTo('libraryTechniques');
          }
          return;
        }
        case 'terms-tab': {
          if (route !== 'study' || activeSlug) {
            navigateTo('study');
          }
          return;
        }
        case 'exercises-tab': {
          if (route !== 'teach' || activeSlug) {
            navigateTo('teach');
          }
          return;
        }
        case 'detail-study-status':
        case 'detail-bookmarks-collections': {
          if (!tourTechniqueSlug) return;
          if (activeSlug !== tourTechniqueSlug) {
            openTechnique(tourTechniqueSlug, undefined, undefined, false, {
              originRoute: 'libraryTechniques',
            });
          }
          return;
        }
        case 'bookmarks-collections': {
          if (route !== 'study' || activeSlug) {
            navigateTo('study');
          }
          return;
        }
        case 'search-input': {
          if (route !== 'study' || activeSlug) {
            navigateTo('study');
            if (!searchOpen && typeof window !== 'undefined') {
              window.setTimeout(() => {
                setSearchOpen(true);
              }, 0);
            }
            return;
          }
          if (!searchOpen) {
            setSearchOpen(true);
          }
          return;
        }
      }
    },
    [activeSlug, navigateTo, openTechnique, route, searchOpen, setSearchOpen, tourTechniqueSlug],
  );

  const markHomepageChangedIfNeeded = useCallback(() => {
    if (syncPauseAutoPushRef.current) {
      return;
    }

    if (lastAppliedSyncSnapshotRef.current.homepage === getCurrentHomepageSyncSnapshot()) {
      return;
    }

    markHomepageChanged();
  }, [
    getCurrentHomepageSyncSnapshot,
    lastAppliedSyncSnapshotRef,
    markHomepageChanged,
    syncPauseAutoPushRef,
  ]);

  useEffect(() => {
    saveOnboardingDismissed(onboardingDismissed);

    if (!onboardingDismissedPersistedRef.current) {
      onboardingDismissedPersistedRef.current = true;
      return;
    }

    markHomepageChangedIfNeeded();
  }, [markHomepageChangedIfNeeded, onboardingDismissed]);

  useEffect(() => {
    saveOnboardingCompleted(onboardingCompleted);

    if (!onboardingCompletedPersistedRef.current) {
      onboardingCompletedPersistedRef.current = true;
      return;
    }

    markHomepageChangedIfNeeded();
  }, [markHomepageChangedIfNeeded, onboardingCompleted]);

  const handleSkipOnboarding = useCallback((): void => {
    setTourOpen(false);
    setTourCompletionVisible(false);
    setSearchOpen(false);
    setOnboardingDismissed(true);
    setOnboardingStep(null);
    saveOnboardingStep(null);
    if (!syncPauseAutoPushRef.current) {
      markHomepageChanged();
    }
  }, [markHomepageChanged, setSearchOpen, syncPauseAutoPushRef]);

  const handleStartOnboardingTour = useCallback((): void => {
    const nextSegment = 0;
    setTourSegmentIndex(nextSegment);
    setTourCompletionVisible(false);
    setSearchOpen(false);
    setTourOpen(true);
    setOnboardingDismissed(false);
    setOnboardingCompleted(false);
    setOnboardingStep(nextSegment);
    saveOnboardingStep(nextSegment);
    if (!syncPauseAutoPushRef.current) {
      markHomepageChanged();
    }
  }, [markHomepageChanged, setSearchOpen, syncPauseAutoPushRef]);

  const aligned = useMemo(
    () =>
      isTourSegmentAligned({
        segmentIndex: tourSegmentIndex,
        route,
        activeSlug,
        searchOpen,
        isTechniqueDetailOpen,
      }),
    [activeSlug, isTechniqueDetailOpen, route, searchOpen, tourSegmentIndex],
  );

  const handleTourBack = useCallback(() => {
    if (tourCompletionVisible) {
      setTourCompletionVisible(false);
      return;
    }
    setTourSegmentIndex((current) => normalizeTourSegmentIndex(current - 1));
  }, [tourCompletionVisible]);

  const handleTourNext = useCallback(() => {
    if (!aligned) {
      syncTourSegment(tourSegmentIndex);
      return;
    }

    const lastIndex = ONBOARDING_TOUR_SEGMENTS.length - 1;
    if (tourSegmentIndex >= lastIndex) {
      setTourCompletionVisible(true);
      setOnboardingCompleted(true);
      setOnboardingDismissed(false);
      setOnboardingStep(null);
      saveOnboardingStep(null);
      if (!syncPauseAutoPushRef.current) {
        markHomepageChanged();
      }
      return;
    }

    setTourSegmentIndex((current) => normalizeTourSegmentIndex(current + 1));
  }, [aligned, markHomepageChanged, syncPauseAutoPushRef, syncTourSegment, tourSegmentIndex]);

  const handleTourGoHome = useCallback(() => {
    setTourOpen(false);
    setTourCompletionVisible(false);
    setSearchOpen(false);
    navigateTo('home');
    if (!prefersReducedMotion) {
      setShowTourCompletionConfetti(true);
    }
  }, [navigateTo, prefersReducedMotion, setSearchOpen]);

  useEffect(() => {
    if (!tourOpen || tourCompletionVisible) return;
    const normalized = normalizeTourSegmentIndex(tourSegmentIndex);
    setOnboardingStep(normalized);
    saveOnboardingStep(normalized);
    if (!syncPauseAutoPushRef.current) {
      markHomepageChanged();
    }
    syncTourSegment(normalized);
  }, [
    markHomepageChanged,
    syncPauseAutoPushRef,
    syncTourSegment,
    tourCompletionVisible,
    tourOpen,
    tourSegmentIndex,
  ]);

  useEffect(() => {
    if (!showTourCompletionConfetti) return;
    const timeoutId = window.setTimeout(() => {
      setShowTourCompletionConfetti(false);
    }, 2200);
    return () => window.clearTimeout(timeoutId);
  }, [showTourCompletionConfetti]);

  const closeTourForSettings = useCallback(() => {
    setTourOpen(false);
    setTourCompletionVisible(false);
  }, []);

  const applySyncedOnboarding = useCallback(
    (
      homepage: Pick<
        SyncHomepageState,
        'onboardingDismissed' | 'onboardingCompleted' | 'onboardingStep'
      >,
    ) => {
      setOnboardingDismissed(homepage.onboardingDismissed);
      setOnboardingCompleted(homepage.onboardingCompleted);
      setOnboardingStep(homepage.onboardingStep);
      saveOnboardingStep(homepage.onboardingStep);
      setTourSegmentIndex(normalizeTourSegmentIndex(homepage.onboardingStep));
    },
    [],
  );

  const activeTourSegment = getActiveTourSegment(tourOpen, tourSegmentIndex);
  const showHomeOnboardingCard = shouldShowHomeOnboardingCard({
    tourOpen,
    onboardingDismissed,
    onboardingCompleted,
  });

  return {
    state: {
      onboardingDismissed,
      onboardingCompleted,
      onboardingStep,
      tourOpen,
      tourSegmentIndex,
      tourCompletionVisible,
      showTourCompletionConfetti,
      activeTourSegment,
      showHomeOnboardingCard,
    },
    actions: {
      handleStartOnboardingTour,
      handleSkipOnboarding,
      handleTourBack,
      handleTourNext,
      handleTourGoHome,
      syncTourSegment,
      closeTourForSettings,
    },
    sync: {
      applySyncedOnboarding,
    },
  };
};
