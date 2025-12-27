import { useCallback, useEffect, useMemo, useState } from 'react';

type IncrementalListOptions = {
  pageSize?: number;
  resetKey?: string;
};

type IncrementalListResult<T> = {
  visibleItems: T[];
  hasMore: boolean;
  loadMore: () => void;
};

export const useIncrementalList = <T>(
  items: T[],
  { pageSize = 18, resetKey }: IncrementalListOptions = {},
): IncrementalListResult<T> => {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(pageSize, items.length));

  useEffect(() => {
    setVisibleCount(Math.min(pageSize, items.length));
  }, [items.length, pageSize, resetKey]);

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  }, [items.length, pageSize]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  return { visibleItems, hasMore: visibleCount < items.length, loadMore };
};
