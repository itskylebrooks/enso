import type { EntryMode } from '@shared/types';
import { DEFAULT_ENTRY_MODE, isEntryMode } from '@shared/constants/entryModes';

// Storage keys
const ENTRY_KEY = 'enso:entryMode';
const TECHNIQUE_ENTRY_PREFIX = 'enso:entryMode:';

/**
 * Gets the global entry mode preference from localStorage.
 * @returns EntryMode - defaults to 'irimi' if not found or invalid
 */
export function getGlobalEntryPref(): EntryMode {
  try {
    const stored = localStorage.getItem(ENTRY_KEY);
    if (isEntryMode(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read global entry preference from localStorage:', error);
  }
  return DEFAULT_ENTRY_MODE;
}

/**
 * Sets the global entry mode preference in localStorage.
 * @param mode - The entry mode to save
 */
export function setGlobalEntryPref(mode: EntryMode): void {
  try {
    localStorage.setItem(ENTRY_KEY, mode);
  } catch (error) {
    console.warn('Failed to save global entry preference to localStorage:', error);
  }
}

/**
 * Gets the per-technique entry mode preference from localStorage.
 * @param techniqueId - The ID of the technique
 * @returns EntryMode | null - null if not found or invalid
 */
export function getTechniqueEntryPref(techniqueId: string): EntryMode | null {
  try {
    const stored = localStorage.getItem(TECHNIQUE_ENTRY_PREFIX + techniqueId);
    if (isEntryMode(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read technique entry preference from localStorage:', error);
  }
  return null;
}

/**
 * Sets the per-technique entry mode preference in localStorage.
 * @param techniqueId - The ID of the technique
 * @param mode - The entry mode to save
 */
export function setTechniqueEntryPref(techniqueId: string, mode: EntryMode): void {
  try {
    localStorage.setItem(TECHNIQUE_ENTRY_PREFIX + techniqueId, mode);
  } catch (error) {
    console.warn('Failed to save technique entry preference to localStorage:', error);
  }
}

/**
 * Parses the entry mode from URL search parameters.
 * @param search - The URL search string (e.g., "?entry=irimi&other=value")
 * @returns EntryMode | null - null if not found or invalid
 */
export function parseEntryFromURL(search: string): EntryMode | null {
  try {
    const params = new URLSearchParams(search);
    const entry = params.get('entry');
    if (isEntryMode(entry)) {
      return entry;
    }
  } catch (error) {
    console.warn('Failed to parse entry from URL:', error);
  }
  return null;
}

/**
 * Adds or updates the entry parameter in a URL.
 * @param url - The base URL
 * @param mode - The entry mode to set
 * @returns string - The updated URL with the entry parameter
 */
export function withEntryInURL(url: string, mode: EntryMode): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('entry', mode);
    return urlObj.pathname + urlObj.search;
  } catch (error) {
    console.warn('Failed to update URL with entry parameter:', error);
    return url;
  }
}

/**
 * Updates the current browser URL with the entry parameter without scrolling.
 * @param mode - The entry mode to set in the URL
 */
export function updateURLEntry(mode: EntryMode): void {
  try {
    const newUrl = withEntryInURL(window.location.href, mode);
    window.history.replaceState(null, '', newUrl);
  } catch (error) {
    console.warn('Failed to update URL with entry parameter:', error);
  }
}

/**
 * Derives the current entry mode based on the priority:
 * 1. URL parameter
 * 2. Per-technique preference
 * 3. Global preference
 * 4. Default 'irimi'
 *
 * @param search - The URL search string
 * @param techniqueId - The ID of the technique
 * @returns EntryMode - The resolved entry mode
 */
export function deriveEntryMode(search: string, techniqueId: string): EntryMode {
  // 1. Try URL parameter first
  const urlEntry = parseEntryFromURL(search);
  if (urlEntry) {
    return urlEntry;
  }

  // 2. Try per-technique preference
  const techniqueEntry = getTechniqueEntryPref(techniqueId);
  if (techniqueEntry) {
    return techniqueEntry;
  }

  // 3. Fall back to global preference
  return getGlobalEntryPref();
}
