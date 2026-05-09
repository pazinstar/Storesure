import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, totalPages, from, to, total, onPageChange }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const disabledPrev = page <= 1;
  const disabledNext = page >= totalPages;

  const rawPages = getPageNumbers(page, totalPages);
  const pages = sanitizePageList(rawPages, totalPages);

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href={disabledPrev ? undefined : '#'}
              aria-disabled={disabledPrev}
              tabIndex={disabledPrev ? -1 : 0}
              onClick={(e) => { e.preventDefault(); if (!disabledPrev) onPageChange(page - 1); }}
              className={disabledPrev ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {pages.map((p, i) =>
            p === "..." ? (
              <PaginationItem key={`e-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href={p === page ? undefined : '#'}
                  isActive={p === page}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={(e) => { e.preventDefault(); if (p !== page) onPageChange(p as number); }}
                  className={p === page ? "pointer-events-none" : "cursor-pointer"}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href={disabledNext ? undefined : '#'}
              aria-disabled={disabledNext}
              tabIndex={disabledNext ? -1 : 0}
              onClick={(e) => { e.preventDefault(); if (!disabledNext) onPageChange(page + 1); }}
              className={disabledNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

function sanitizePageList(list: (number | "...")[], total: number): (number | "...")[] {
  const out: (number | "...")[] = [];
  let lastWasEllipsis = false;
  const seen = new Set<number>();

  for (const item of list) {
    if (item === "...") {
      if (!lastWasEllipsis) {
        out.push(item);
        lastWasEllipsis = true;
      }
      continue;
    }
    lastWasEllipsis = false;
    const n = item as number;
    if (n < 1 || n > total) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }

  return out;
}
