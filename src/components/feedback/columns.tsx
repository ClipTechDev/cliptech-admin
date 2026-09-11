"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ImageIcon } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import type { Feedback } from "@/schemas/feedback";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { IdLink } from "@/components/shared/id-link";

/**
 * Columns for the support inbox.
 *
 * The description is the row - it is the whole reason the entry exists - so it
 * takes the width and is clamped to two lines rather than truncated to one.
 * The full text is a click away in the sheet.
 */
export const feedbackColumns: ColumnDef<Feedback>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Received" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "description",
    header: ({ column }) => <DataTableColumnHeader column={column} title="What they said" />,
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-xl text-sm break-words whitespace-pre-wrap">
        {row.original.description}
      </p>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "screenshot_url",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Shot" />,
    cell: ({ row }) =>
      row.original.screenshot_url ? (
        <ImageIcon className="text-muted-foreground size-4" aria-label="Has a screenshot" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    enableSorting: false,
  },
  {
    accessorKey: "user_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creator" />,
    cell: ({ row }) => (
      <IdLink
        href={`/users/${row.original.user_id}`}
        id={row.original.user_id}
      />
    ),
    enableSorting: false,
  },
];
