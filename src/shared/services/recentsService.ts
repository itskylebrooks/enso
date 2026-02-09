import { RECENTS_STORAGE_KEY } from '@shared/constants/storage';
import type { EntryMode } from '@shared/types';

export type RecentItemType = 'technique' | 'term' | 'exercise';

export type RecentItem = {
  type: RecentItemType;
  slug: string;
  lastOpenedAt: number;
  entry?: EntryMode;
};

export type RecentItemInput = {
  type: RecentItemType;
  slug: string;
  lastOpenedAt?: number;
  entry?: EntryMode;
};

const MAX_RECENTS = 20;

const isBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const toValidTimestamp = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return value;
};

const normalizeEntry = (value: unknown): RecentItem | null => {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<RecentItem>;
  const type = candidate.type;
  if (type !== 'technique' && type !== 'term' && type !== 'exercise') return null;

  const slug = typeof candidate.slug === 'string' ? candidate.slug.trim() : '';
  if (slug.length === 0) return null;

  const timestamp = toValidTimestamp(candidate.lastOpenedAt);
  if (!timestamp) return null;

  const entry =
    candidate.entry === 'irimi' ||
    candidate.entry === 'tenkan' ||
    candidate.entry === 'omote' ||
    candidate.entry === 'ura'
      ? candidate.entry
      : undefined;

  return {
    type,
    slug,
    lastOpenedAt: timestamp,
    entry,
  };
};

const dedupeAndSort = (entries: RecentItem[]): RecentItem[] => {
  const byKey = new Map<string, RecentItem>();

  entries.forEach((entry) => {
    const key = `${entry.type}:${entry.slug}`;
    const existing = byKey.get(key);
    if (!existing || entry.lastOpenedAt > existing.lastOpenedAt) {
      byKey.set(key, entry);
    }
  });

  return [...byKey.values()]
    .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
    .slice(0, MAX_RECENTS);
};

const readRecents = (): RecentItem[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(RECENTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is RecentItem => entry !== null);

    return dedupeAndSort(normalized);
  } catch {
    return [];
  }
};

const writeRecents = (entries: RecentItem[]): void => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // noop
  }
};

export const getRecents = (): RecentItem[] => readRecents();

export const addRecent = (item: RecentItemInput): void => {
  if (!isBrowser()) return;

  const slug = item.slug.trim();
  if (slug.length === 0) return;

  const now = toValidTimestamp(item.lastOpenedAt) ?? Date.now();
  const nextEntry: RecentItem = {
    type: item.type,
    slug,
    lastOpenedAt: now,
    entry: item.entry,
  };

  const current = readRecents();
  const filtered = current.filter(
    (entry) => !(entry.type === nextEntry.type && entry.slug === nextEntry.slug),
  );
  writeRecents(dedupeAndSort([nextEntry, ...filtered]));
};

export const clearRecents = (): void => {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(RECENTS_STORAGE_KEY);
  } catch {
    // noop
  }
};
