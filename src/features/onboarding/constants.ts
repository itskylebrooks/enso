export type TourSegmentId =
  | 'guide-tab'
  | 'techniques-tab'
  | 'techniques-filters'
  | 'terms-tab'
  | 'exercises-tab'
  | 'detail-study-status'
  | 'detail-bookmarks-collections'
  | 'bookmarks-collections'
  | 'search-input';

export type OnboardingTourSegment = {
  id: TourSegmentId;
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  targetSelectors: string[];
  spotlightOffsetY?: number;
  spotlightHeightOffset?: number;
  preferredPanelSide?: 'right' | 'auto';
};

export const ONBOARDING_TOUR_STEP_COUNT = 8;

export const ONBOARDING_TOUR_SEGMENTS: OnboardingTourSegment[] = [
  {
    id: 'guide-tab',
    stepNumber: 1,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-guide"]',
      '[data-tour-target="nav-guide"]',
    ],
  },
  {
    id: 'techniques-tab',
    stepNumber: 2,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-techniques"]',
      '[data-tour-target="nav-techniques"]',
    ],
  },
  {
    id: 'techniques-filters',
    stepNumber: 3,
    targetSelectors: [
      '[data-tour-target="techniques-filters-trigger"][data-tour-panel="true"]',
      '[data-tour-target="techniques-filters-trigger"]',
    ],
    spotlightHeightOffset: 30,
  },
  {
    id: 'terms-tab',
    stepNumber: 4,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-terms"]',
      '[data-tour-target="nav-terms"]',
    ],
  },
  {
    id: 'exercises-tab',
    stepNumber: 5,
    targetSelectors: [
      '.mobile-tab-bar [data-tour-target="nav-exercises"]',
      '[data-tour-target="nav-exercises"]',
    ],
  },
  {
    id: 'detail-study-status',
    stepNumber: 6,
    targetSelectors: ['[data-tour-target="detail-study-status"]'],
  },
  {
    id: 'detail-bookmarks-collections',
    stepNumber: 6,
    targetSelectors: ['[data-tour-target="detail-bookmarks-collections"]'],
  },
  {
    id: 'bookmarks-collections',
    stepNumber: 7,
    targetSelectors: [
      '[data-tour-target="bookmarks-collections-sidebar"][data-tour-panel="true"]',
      '[data-tour-target="bookmarks-collections-sidebar"]',
    ],
    spotlightHeightOffset: 30,
    preferredPanelSide: 'right',
  },
  {
    id: 'search-input',
    stepNumber: 8,
    targetSelectors: ['[data-tour-target="search-input"]'],
  },
];

