import { describe, expect, it } from 'vitest';
import {
  getActiveTourSegment,
  isTourSegmentAligned,
  normalizeTourSegmentIndex,
  shouldShowHomeOnboardingCard,
} from '../src/shared/app/onboardingModel';

describe('onboarding model', () => {
  it('clamps tour segment indexes into the known tour range', () => {
    expect(normalizeTourSegmentIndex(null)).toBe(0);
    expect(normalizeTourSegmentIndex(Number.NaN)).toBe(0);
    expect(normalizeTourSegmentIndex(-1)).toBe(0);
    expect(normalizeTourSegmentIndex(2.8)).toBe(2);
    expect(normalizeTourSegmentIndex(99)).toBe(8);
  });

  it('derives the active segment and homepage card visibility', () => {
    expect(getActiveTourSegment(false, 0)).toBeNull();
    expect(getActiveTourSegment(true, 0)?.id).toBe('guide-tab');
    expect(getActiveTourSegment(true, 99)?.id).toBe('search-input');

    expect(
      shouldShowHomeOnboardingCard({
        tourOpen: false,
        onboardingDismissed: false,
        onboardingCompleted: false,
      }),
    ).toBe(true);
    expect(
      shouldShowHomeOnboardingCard({
        tourOpen: true,
        onboardingDismissed: false,
        onboardingCompleted: false,
      }),
    ).toBe(false);
    expect(
      shouldShowHomeOnboardingCard({
        tourOpen: false,
        onboardingDismissed: true,
        onboardingCompleted: false,
      }),
    ).toBe(false);
  });

  it('reports alignment for tab, detail, bookmarks, and search tour steps', () => {
    expect(
      isTourSegmentAligned({
        segmentIndex: 0,
        route: 'guide',
        activeSlug: null,
        searchOpen: false,
        isTechniqueDetailOpen: false,
      }),
    ).toBe(true);
    expect(
      isTourSegmentAligned({
        segmentIndex: 1,
        route: 'libraryTechniques',
        activeSlug: null,
        searchOpen: false,
        isTechniqueDetailOpen: false,
      }),
    ).toBe(true);
    expect(
      isTourSegmentAligned({
        segmentIndex: 1,
        route: 'libraryTechniques',
        activeSlug: 'ikkyo',
        searchOpen: false,
        isTechniqueDetailOpen: true,
      }),
    ).toBe(false);
    expect(
      isTourSegmentAligned({
        segmentIndex: 5,
        route: 'libraryTechniques',
        activeSlug: 'ikkyo',
        searchOpen: false,
        isTechniqueDetailOpen: true,
      }),
    ).toBe(true);
    expect(
      isTourSegmentAligned({
        segmentIndex: 7,
        route: 'study',
        activeSlug: null,
        searchOpen: false,
        isTechniqueDetailOpen: false,
      }),
    ).toBe(true);
    expect(
      isTourSegmentAligned({
        segmentIndex: 8,
        route: 'study',
        activeSlug: null,
        searchOpen: true,
        isTechniqueDetailOpen: false,
      }),
    ).toBe(true);
  });
});
