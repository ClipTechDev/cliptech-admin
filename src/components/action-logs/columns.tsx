"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { formatDateTime, humanise } from "@/lib/format";
import type { ActionLog, AdminAction } from "@/schemas/action-log";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { IdLink } from "@/components/shared/id-link";

const variants: Record<AdminAction, "default" | "secondary" | "destructive" | "outline"> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
};

/**
 * Columns for the audit trail.
 *
 * `summary` is prose the handler that wrote the entry already formatted - it
 * is rendered as it was stored, not re-templated here, because the whole
 * point of the log is that it says what was recorded at the time.
 */
export const actionLogColumns: ColumnDef<ActionLog>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="When" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "action",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
    cell: ({ row }) => (
      <Badge variant={variants[row.original.action] ?? "secondary"}>
        {humanise(row.original.action)}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "summary",
    header: ({ column }) => <DataTableColumnHeader column={column} title="What changed" />,
    cell: ({ row }) => (
      <p className="max-w-2xl text-sm break-words">{row.original.summary}</p>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "admin_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="By" />,
    cell: ({ row }) => (
      <IdLink
        href={`/admins/${row.original.admin_id}`}
        id={row.original.admin_id}
      />
    ),
    enableSorting: false,
  },
];
