import { useEffect, useMemo, useState } from 'react';

/**
 * Client-side pagination helper.
 * - `page` is always 1-based for the UI
 * - 0-based offset is derived in exactly one place (`offset` / `slice`)
 * - When filters, totals, or pageSize change: recompute totalPages and clamp `page`
 */
export function usePagination({
  items = [],
  pageSize = 5,
  resetKey
}) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  // Filter change → start at page 1
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  // Totals / page size change → recompute range and clamp current page
  useEffect(() => {
    setPage((current) => Math.min(Math.max(1, current), totalPages));
  }, [total, pageSize, totalPages]);

  // Single conversion: 1-based page → 0-based offset
  const offset = (page - 1) * pageSize;

  const pageItems = useMemo(
    () => items.slice(offset, offset + pageSize),
    [items, offset, pageSize]
  );

  return {
    page,
    setPage,
    pageSize,
    total,
    totalPages,
    offset,
    pageItems,
    canPrevious: page > 1,
    canNext: page < totalPages
  };
}
