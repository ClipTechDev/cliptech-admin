"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTablePagination,
  type ServerPagination,
} from "@/components/data-table/data-table-pagination";

export type { ServerPagination };

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Rendered above the table - search input, filters, view options, actions. */
  toolbar?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode;
  /** First load: rows are replaced by skeletons. */
  isLoading?: boolean;
  /** Background refetch: rows stay, the table dims. */
  isFetching?: boolean;
  emptyMessage?: string;
  /**
   * Present = the server owns paging (and filtering/sorting with it), so the
   * in-memory row models are switched off and the footer drives the URL
   * instead of the table's own state. Absent = everything happens in memory.
   */
  serverPagination?: ServerPagination;
  /** Stable row identity across pages, so selection survives a refetch. */
  getRowId?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
}

/**
 * One TanStack Table wrapper for every listing in the app, in either of two
 * modes.
 *
 * cliptech-api paginates, searches and filters server-side and caps a page at
 * 100 rows, so any real listing has to be server-driven; but small embedded
 * tables (a creator's connected accounts, say) come back whole and are better
 * off filtering in memory. Rather than two components that drift apart, the
 * presence of `serverPagination` picks the mode.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  isLoading,
  isFetching,
  emptyMessage = "No results.",
  serverPagination,
  getRowId,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      // Server mode mirrors the API's page into the table so the footer and
      // any page-scoped selection agree with what was actually fetched.
      ...(serverPagination
        ? {
            pagination: {
              pageIndex: serverPagination.page - 1,
              pageSize: serverPagination.limit,
            },
          }
        : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // In server mode the in-memory row models would re-filter and re-slice a
    // page the API has already narrowed, hiding rows that belong to it.
    ...(serverPagination
      ? {
          manualPagination: true,
          manualFiltering: true,
          pageCount: Math.max(serverPagination.totalPages, 1),
        }
      : {
          getFilteredRowModel: getFilteredRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
        }),
  });

  const visibleColumnCount = table.getVisibleFlatColumns().length || columns.length;

  return (
    <div className="flex flex-col gap-4">
      {toolbar?.(table)}
      <div
        className={cn(
          "overflow-x-auto rounded-lg border transition-opacity",
          // Dim rather than blank: the previous page stays readable while the
          // next one loads, which is why the queries use keepPreviousData.
          isFetching && !isLoading && "opacity-60"
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton rows keep the table at roughly its loaded height, so
              // the page doesn't jump when data lands.
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={`skeleton-${rowIndex}`}>
                  {Array.from({ length: visibleColumnCount }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "hover:bg-muted/50 cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className="text-muted-foreground h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} serverPagination={serverPagination} />
    </div>
  );
}
