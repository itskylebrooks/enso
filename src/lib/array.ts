export const unique = (values: string[]): string[] => Array.from(new Set(values));

export const upsert = <T>(items: T[], predicate: (candidate: T) => boolean, value: T): T[] => {
  const index = items.findIndex(predicate);
  if (index === -1) {
    return [...items, value];
  }

  const next = items.slice();
  next[index] = { ...(items[index] as object), ...(value as object) } as T;
  return next;
};
