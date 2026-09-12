"use client";

import * as React from "react";

import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { useCampaignSnapshotsQuery } from "@/hooks/use-campaigns";
import type { Snapshot } from "@/schemas/payout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryState } from "@/components/shared/query-state";
import { RefreshButton } from "@/components/shared/refresh-button";
import { SimplePagination } from "@/components/shared/simple-pagination";
import { SnapshotEntries } from "@/components/campaigns/snapshot-entries";

/**
 * The campaign's payout history: each time its spend crossed a threshold and
 * what was credited to creators at that point.
 *
 * This is the campaign-level counterpart to a submission's poll log - the
 * moments money actually moved, rather than the readings that accrued it.
 *
 * Each row opens its own entries - who was paid what at that threshold -
 * which is the only route from a campaign to the individual credits behind
 * one of its payouts.
 */
export function CampaignSnapshots({ campaignId }: { campaignId: string }) {
  const [page, setPage] = React.useState(1);
  const [openSnapshot, setOpenSnapshot] = React.useState<Snapshot | null>(null);
  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } =
    useCampaignSnapshotsQuery(campaignId, page);

  const snapshots = data?.snapshots ?? [];
  const meta = data?.pagination;

  return (
    <QueryState
      isLoading={isLoading && !data}
      error={error}
      isEmpty={snapshots.length === 0}
      emptyMessage="No payout thresholds have been crossed yet."
      onRetry={() => void refetch()}
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <RefreshButton
            onRefresh={() => void refetch()}
            isRefreshing={isFetching}
            updatedAt={dataUpdatedAt}
          />
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reached</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead className="text-right">Credited</TableHead>
                <TableHead className="text-right">Spend after</TableHead>
                <TableHead className="text-right">Posts</TableHead>
                <TableHead className="text-right">Payable views</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshots.map((snapshot) => (
                <TableRow
                  key={snapshot.id}
                  onClick={() => setOpenSnapshot(snapshot)}
                  className="hover:bg-muted/50 cursor-pointer"
                >
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(snapshot.reached_at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {snapshot.threshold_percent}%
                    {snapshot.is_marker && (
                      // A marker records the campaign passing a threshold with
                      // no money attached - worth distinguishing from a payout
                      // that happened to credit nothing.
                      <Badge variant="outline" className="ml-2">
                        Marker
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(snapshot.amount_credited)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(snapshot.spent_after)}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({Math.round(snapshot.spent_percent)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(snapshot.submission_count)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(snapshot.total_payable_views)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <SimplePagination meta={meta} onPageChange={setPage} noun="payouts" />
      </div>

      <SnapshotEntries
        snapshot={openSnapshot}
        onOpenChange={(open) => !open && setOpenSnapshot(null)}
      />
    </QueryState>
  );
}
