import { describe, expect, it } from 'vitest';
import { getCopy } from '../src/shared/constants/i18n';

describe('UI i18n navigation labels', () => {
  it('uses required EN navigation labels', () => {
    const copy = getCopy('en');
    expect(copy.guideLink).toBe('Guide');
    expect(copy.library).toBe('Techniques');
    expect(copy.glossary).toBe('Terms');
    expect(copy.practice).toBe('Exercises');
  });

  it('uses required DE navigation labels', () => {
    const copy = getCopy('de');
    expect(copy.guideLink).toBe('Guide');
    expect(copy.library).toBe('Techniken');
    expect(copy.glossary).toBe('Begriffe');
    expect(copy.practice).toBe('Übungen');
  });

  it('defines onboarding copy for EN and DE', () => {
    const copyEn = getCopy('en');
    const copyDe = getCopy('de');

    expect(copyEn.onboarding.homeCard.title).toBeTruthy();
    expect(copyDe.onboarding.homeCard.title).toBeTruthy();
    expect(copyEn.onboarding.tour.segments['guide-tab'].description).toBeTruthy();
    expect(copyDe.onboarding.tour.segments['guide-tab'].description).toBeTruthy();
    expect(copyEn.onboarding.tour.segments['search-input'].title).toBeTruthy();
    expect(copyDe.onboarding.tour.segments['search-input'].title).toBeTruthy();
  });
});
