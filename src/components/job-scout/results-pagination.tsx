"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type ResultsPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * Results pagination, mounted at every breakpoint.
 *
 * The primitive renders anchors, so the disabled edges are taken out of the tab
 * order rather than only having pointer events removed — `pointer-events-none`
 * stops the mouse but not the keyboard. The current-page indicator is inert
 * text, not a link that goes nowhere.
 */
export function ResultsPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: ResultsPaginationProps) {
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  return (
    <Pagination
      className={cn("justify-start", className)}
      data-testid="results-pagination"
    >
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={atStart}
            tabIndex={atStart ? -1 : undefined}
            className={atStart ? "pointer-events-none opacity-50" : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (!atStart) onPageChange(page - 1);
            }}
          />
        </PaginationItem>
        <PaginationItem>
          <span
            data-testid="results-pagination-status"
            className="px-3 text-sm font-medium text-foreground tabular-nums"
          >
            <span aria-hidden="true">
              {page} / {totalPages}
            </span>
            <span className="sr-only">
              Page {page} of {totalPages}
            </span>
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={atEnd}
            tabIndex={atEnd ? -1 : undefined}
            className={atEnd ? "pointer-events-none opacity-50" : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (!atEnd) onPageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
