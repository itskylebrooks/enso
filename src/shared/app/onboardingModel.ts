import {
  ONBOARDING_TOUR_SEGMENTS,
  type OnboardingTourSegment,
} from '@features/onboarding/constants';
import type { AppRoute } from '../types';

export const normalizeTourSegmentIndex = (value: number | null | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const maxIndex = ONBOARDING_TOUR_SEGMENTS.length - 1;
  if (value < 0) return 0;
  if (value > maxIndex) return maxIndex;
  return Math.trunc(value);
};

export const getActiveTourSegment = (
  tourOpen: boolean,
  tourSegmentIndex: number,
): OnboardingTourSegment | null =>
  tourOpen ? (ONBOARDING_TOUR_SEGMENTS[normalizeTourSegmentIndex(tourSegmentIndex)] ?? null) : null;

export const shouldShowHomeOnboardingCard = ({
  tourOpen,
  onboardingDismissed,
  onboardingCompleted,
}: {
  tourOpen: boolean;
  onboardingDismissed: boolean;
  onboardingCompleted: boolean;
}): boolean => !tourOpen && !onboardingDismissed && !onboardingCompleted;

export const isTourSegmentAligned = ({
  segmentIndex,
  route,
  activeSlug,
  searchOpen,
  isTechniqueDetailOpen,
}: {
  segmentIndex: number;
  route: AppRoute;
  activeSlug: string | null;
  searchOpen: boolean;
  isTechniqueDetailOpen: boolean;
}): boolean => {
  const segment = ONBOARDING_TOUR_SEGMENTS[normalizeTourSegmentIndex(segmentIndex)];
  if (!segment) return false;

  switch (segment.id) {
    case 'exams-tab':
      return route === 'exams';
    case 'techniques-tab':
    case 'techniques-filters':
      return route === 'libraryTechniques' && !activeSlug;
    case 'terms-tab':
      return route === 'study';
    case 'exercises-tab':
      return route === 'teach';
    case 'detail-study-status':
    case 'detail-bookmarks-collections':
      return isTechniqueDetailOpen;
    case 'bookmarks-collections':
      return route === 'study' && !searchOpen;
    case 'search-input':
      return route === 'study' && searchOpen;
    default:
      return false;
  }
};
