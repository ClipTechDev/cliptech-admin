"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

import { formatCurrency, formatDateTime, formatNumber, platformLabel } from "@/lib/format";
import type { Submission } from "@/schemas/submission";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";

type CreatorLookup = Map<string, { name: string; email: string }>;

/**
 * Columns for the submissions table.
 *
 * A factory rather than a constant because the creator column needs the
 * name lookup resolved by the table - submissions carry only a user id, and
 * threading the map through the column definition keeps the cell a pure
 * render of data the parent already has.
 *
 * Sorting is display-only: the API orders these itself and takes no sort
 * parameter, so a sortable header would reorder one page and misstate the rest.
 */
export function submissionColumns(creators: CreatorLookup): ColumnDef<Submission>[] {
  return [
    {
      accessorKey: "user_id",
      header: "Creator",
      cell: ({ row }) => {
        const creator = creators.get(row.original.user_id);
        return creator ? (
          <div className="min-w-0">
            <p className="truncate font-medium">{creator.name || "Unnamed"}</p>
            <p className="text-muted-foreground truncate text-xs">{creator.email}</p>
          </div>
        ) : (
          // Falls back to the id: the name lookup needs the "users" role, and
          // an admin without it should still get a usable table.
          <code className="text-muted-foreground text-xs">
            {row.original.user_id.slice(0, 12)}…
          </code>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "campaign_name",
      header: "Campaign",
      cell: ({ row }) => (
        <p className="max-w-[18ch] truncate">
          {row.original.campaign_name || (
            <code className="text-muted-foreground text-xs">
              {row.original.campaign_id.slice(0, 12)}…
            </code>
          )}
        </p>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => (
        <a
          href={row.original.post_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 whitespace-nowrap hover:underline"
        >
          {platformLabel(row.original.platform)}
          <ExternalLink className="size-3" />
        </a>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <SubmissionStatusBadge status={row.original.status} />,
      enableSorting: false,
    },
    {
      accessorKey: "raw_views",
      header: () => <span className="block text-right">Raw views</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">
          {formatNumber(row.original.raw_views)}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "payable_views",
      header: () => <span className="block text-right">Payable</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">
          {formatNumber(row.original.payable_views)}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "earnings",
      header: () => <span className="block text-right">Earned</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">
          {formatCurrency(row.original.earnings)}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "pending_amount",
      header: () => <span className="block text-right">Pending</span>,
      cell: ({ row }) => (
        <span className="text-muted-foreground block text-right tabular-nums">
          {formatCurrency(row.original.pending_amount)}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "last_tracked_at",
      header: "Last tracked",
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDateTime(row.original.last_tracked_at)}
        </span>
      ),
      enableSorting: false,
    },
  ];
}
