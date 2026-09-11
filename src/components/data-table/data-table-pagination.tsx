"use client";

import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { PAGE_SIZE_OPTIONS } from "@/lib/list-params";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Server-driven paging, shaped after shared.PageMeta plus the two callbacks
 * that write the change back to the URL. `page` is 1-based, matching the API
 * rather than TanStack's 0-based pageIndex - the conversion is done once,
 * here, instead of at every call site.
 */
export type ServerPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  serverPagination?: ServerPagination;
}

export function DataTablePagination<TData>({
  table,
  serverPagination,
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // In server mode the table only holds the current page, so the honest total
  // is the one the API reported, not the row count in memory.
  const totalCount = serverPagination?.total ?? table.getFilteredRowModel().rows.length;
  const page = serverPagination?.page ?? table.getState().pagination.pageIndex + 1;
  const pageSize = serverPagination?.limit ?? table.getState().pagination.pageSize;
  const pageCount = Math.max(serverPagination?.totalPages ?? table.getPageCount(), 1);

  const canPrev = serverPagination ? serverPagination.hasPrev : table.getCanPreviousPage();
  const canNext = serverPagination ? serverPagination.hasNext : table.getCanNextPage();

  const goTo = (nextPage: number) =>
    serverPagination
      ? serverPagination.onPageChange(nextPage)
      : table.setPageIndex(nextPage - 1);

  const setPageSize = (size: number) =>
    serverPagination ? serverPagination.onLimitChange(size) : table.setPageSize(size);

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
      <div className="text-muted-foreground text-sm">
        {selectedCount > 0
          ? `${selectedCount} of ${totalCount} row(s) selected.`
          : `${totalCount} row(s) total.`}
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center text-sm font-medium">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden lg:flex"
            onClick={() => goTo(1)}
            disabled={!canPrev}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goTo(page - 1)}
            disabled={!canPrev}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => goTo(page + 1)}
            disabled={!canNext}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden lg:flex"
            onClick={() => goTo(pageCount)}
            disabled={!canNext}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
