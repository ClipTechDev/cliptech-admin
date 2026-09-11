"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { formatCurrency, formatDate, platformLabel } from "@/lib/format";
import { budgetUsedPercent, committed, type Campaign } from "@/schemas/campaign";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";

/**
 * Columns for the campaigns listing. Sorting is display-only: the API orders
 * by `created_at DESC` and takes no sort parameter.
 */
export const campaignColumns: ColumnDef<Campaign>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Campaign" />,
    cell: ({ row }) => (
      <Link
        href={`/campaigns/${row.original.id}`}
        className="font-medium hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {row.original.name}
      </Link>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <CampaignStatusBadge status={row.original.status} />,
    enableSorting: false,
  },
  {
    id: "budget",
    header: () => <span className="block text-right">Budget used</span>,
    cell: ({ row }) => {
      const campaign = row.original;
      const used = budgetUsedPercent(campaign);
      return (
        <div className="min-w-32 text-right">
          <p className="tabular-nums">
            {formatCurrency(committed(campaign))}
            <span className="text-muted-foreground"> / {formatCurrency(campaign.total_budget)}</span>
          </p>
          {/* A meter, not a chart: it repeats the number beside it as length,
              which is the one thing a row of figures can't show at a glance. */}
          <div className="bg-muted mt-1 h-1 w-full overflow-hidden rounded-full">
            <div className="bg-primary h-full" style={{ width: `${used}%` }} />
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "cpm",
    header: () => <span className="block text-right">CPM</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">{formatCurrency(row.original.cpm)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "allowed_platforms",
    header: "Platforms",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">
        {row.original.allowed_platforms.map(platformLabel).join(", ")}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "ends_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Ends" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.ends_at)}
      </span>
    ),
    enableSorting: false,
  },
];
