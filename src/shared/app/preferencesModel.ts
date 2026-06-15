import { buildHomepageState, buildSettingsState } from '../../lib/backend/syncMerge';
import type { SyncHomepageState, SyncSettingsState } from '../../lib/supabase/types';
import type { Filters, Grade, Locale, Theme } from '../types';

export const defaultFilters: Filters = {};

export type HomepageSnapshotInput = {
  pinnedBeltGrade: Grade | null;
  beltPromptDismissed: boolean;
  onboardingDismissed: boolean;
  onboardingCompleted: boolean;
  onboardingStep: number | null;
};

export const buildPreferenceSettingsState = (params: {
  theme: Theme;
  hasManualTheme: boolean;
  locale: Locale;
  filters: Filters;
  filterPanelPinned: boolean;
}): SyncSettingsState =>
  buildSettingsState({
    themePreference: params.hasManualTheme ? params.theme : null,
    locale: params.locale,
    filters: params.filters,
    filterPanelPinned: params.filterPanelPinned,
  });

export const buildPreferenceHomepageState = (params: HomepageSnapshotInput): SyncHomepageState =>
  buildHomepageState({
    pinnedBeltGrade: params.pinnedBeltGrade,
    beltPromptDismissed: params.beltPromptDismissed,
    onboardingDismissed: params.onboardingDismissed,
    onboardingCompleted: params.onboardingCompleted,
    onboardingStep: params.onboardingStep,
  });
