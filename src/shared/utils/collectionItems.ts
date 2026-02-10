export type CollectionItemType = 'technique' | 'glossary' | 'exercise';

type SwapDirection = 'backward' | 'forward';

const toNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const createCollectionItemId = (type: CollectionItemType, id: string): string =>
  `${type}:${id}`;

export const sanitizeCollectionItemIds = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<string>();
  const sanitized: string[] = [];

  raw.forEach((value) => {
    const normalized = toNonEmptyString(value);
    if (!normalized || unique.has(normalized)) return;
    unique.add(normalized);
    sanitized.push(normalized);
  });

  return sanitized;
};

export const normalizeCollectionItemIds = (
  storedItemIds: string[],
  presentItemIds: string[],
  missingAppendOrder?: string[],
): string[] => {
  const presentSet = new Set(presentItemIds);
  const next: string[] = [];
  const seen = new Set<string>();

  storedItemIds.forEach((itemId) => {
    if (!presentSet.has(itemId) || seen.has(itemId)) return;
    seen.add(itemId);
    next.push(itemId);
  });

  const appendSource = missingAppendOrder ?? presentItemIds;
  appendSource.forEach((itemId) => {
    if (!presentSet.has(itemId) || seen.has(itemId)) return;
    seen.add(itemId);
    next.push(itemId);
  });

  return next;
};

export const swapCollectionItemIds = (
  itemIds: string[],
  index: number,
  direction: SwapDirection,
): string[] => {
  const delta = direction === 'backward' ? -1 : 1;
  const targetIndex = index + delta;

  if (index < 0 || targetIndex < 0 || index >= itemIds.length || targetIndex >= itemIds.length) {
    return itemIds;
  }

  const next = [...itemIds];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
};
