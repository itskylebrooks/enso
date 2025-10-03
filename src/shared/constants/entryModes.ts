import type { EntryMode } from '../types';

export const ENTRY_MODE_ORDER: EntryMode[] = ['irimi', 'omote', 'tenkan', 'ura'];

export const DEFAULT_ENTRY_MODE: EntryMode = 'irimi';

export const isEntryMode = (value: unknown): value is EntryMode =>
  typeof value === 'string' && (ENTRY_MODE_ORDER as ReadonlyArray<string>).includes(value);
