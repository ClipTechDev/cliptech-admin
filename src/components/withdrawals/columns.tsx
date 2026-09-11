"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { formatCurrency, formatDateTime, humanise, orDash } from "@/lib/format";
import type { Withdrawal } from "@/schemas/withdrawal";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { IdLink } from "@/components/shared/id-link";
import { WithdrawalStatusBadge } from "@/components/withdrawals/withdrawal-status-badge";

/**
 * Columns for the payout queue.
 *
 * Sorting is display-only, as everywhere else in this app: cliptech-api orders
 * withdrawals by `requested_at DESC` and takes no sort parameter, so enabling
 * per-column sort would reorder the current page and lie about the rest.
 *
 * The creator is a user id rather than a name: the withdrawals endpoint needs
 * the "withdrawals" role, and resolving names needs "users" - which an admin
 * working the payout queue may not hold. The id is linked anyway, so anyone
 * with both roles is one click from the account.
 */
export const withdrawalColumns: ColumnDef<Withdrawal>[] = [
  {
    accessorKey: "requested_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Requested" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.requested_at)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">{formatCurrency(row.original.amount)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <WithdrawalStatusBadge status={row.original.status} />,
    enableSorting: false,
  },
  {
    accessorKey: "method",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Method" />,
    cell: ({ row }) => <span>{humanise(row.original.method)}</span>,
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
  {
    accessorKey: "provider_reference",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {orDash(row.original.provider_reference)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "completed_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Completed" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.completed_at)}
      </span>
    ),
    enableSorting: false,
  },
];
