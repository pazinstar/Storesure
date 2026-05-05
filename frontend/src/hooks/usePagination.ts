import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], defaultPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  const setPageSize = (n: number) => {
    setPageSizeRaw(n);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(
    () => items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [items, clampedPage, pageSize]
  );

  const from = items.length === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const to = Math.min(clampedPage * pageSize, items.length);

  return {
    page: clampedPage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems,
    from,
    to,
    total: items.length,
  };
}
