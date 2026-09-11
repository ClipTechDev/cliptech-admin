"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { formatDateTime, humanise } from "@/lib/format";
import type { AdminNotification } from "@/schemas/notification";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { IdLink } from "@/components/shared/id-link";
import { DeliveryBadge } from "@/components/notifications/delivery-badge";

/**
 * Columns for the outbox.
 *
 * Sorting is display-only, as everywhere else in this app: the API orders by
 * `created_at DESC` and takes no sort parameter, so enabling per-column sort
 * would reorder the current page and lie about the rest.
 *
 * The two channels get a column each rather than one combined "delivered"
 * state, because they fail independently and the difference is the whole
 * diagnosis - a row pushed but not emailed is a mail problem, not an outbox
 * one. The copy is next to them so a stuck row can be read without opening it.
 */
export const notificationColumns: ColumnDef<AdminNotification>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Raised" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap">{humanise(row.original.type)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Message" />,
    cell: ({ row }) => (
      <div className="min-w-0 max-w-md">
        <p className="truncate text-sm font-medium">{row.original.title}</p>
        <p className="text-muted-foreground line-clamp-1 text-xs break-words">
          {row.original.body}
        </p>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "push",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Push" />,
    cell: ({ row }) => <DeliveryBadge state={row.original.push} />,
    enableSorting: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <DeliveryBadge state={row.original.email} />,
    enableSorting: false,
  },
  {
    accessorKey: "read",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Opened" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {/* The one delivery fact the two channels cannot report: whether the
            creator actually looked at it. */}
        {row.original.read ? formatDateTime(row.original.read_at) : "Not yet"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "user_id",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creator" />,
    cell: ({ row }) => (
      <IdLink href={`/users/${row.original.user_id}`} id={row.original.user_id} />
    ),
    enableSorting: false,
  },
];
