import { describe, expect, it } from 'vitest';
import {
  buildPreferenceHomepageState,
  buildPreferenceSettingsState,
} from '../src/shared/app/preferencesModel';

describe('preferences model', () => {
  it('uses a null theme preference when system theme is selected', () => {
    expect(
      buildPreferenceSettingsState({
        theme: 'dark',
        hasManualTheme: false,
        locale: 'en',
        filters: { category: 'throws' },
        filterPanelPinned: true,
      }),
    ).toEqual({
      themePreference: null,
      locale: 'en',
      filters: { category: 'throws' },
      filterPanelPinned: true,
    });
  });

  it('preserves homepage preferences and passed onboarding state', () => {
    expect(
      buildPreferenceHomepageState({
        pinnedBeltGrade: 'kyu4',
        beltPromptDismissed: true,
        onboardingDismissed: false,
        onboardingCompleted: true,
        onboardingStep: 3,
      }),
    ).toEqual({
      pinnedBeltGrade: 'kyu4',
      beltPromptDismissed: true,
      onboardingDismissed: false,
      onboardingCompleted: true,
      onboardingStep: 3,
    });
  });
});
