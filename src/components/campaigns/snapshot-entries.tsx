"use client";

import * as React from "react";
import Link from "next/link";

import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { useSnapshotEntriesQuery } from "@/hooks/use-snapshots";
import type { Snapshot } from "@/schemas/payout";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DetailList } from "@/components/shared/detail-list";
import { QueryState } from "@/components/shared/query-state";
import { SimplePagination } from "@/components/shared/simple-pagination";

/**
 * Who was paid what, the moment a campaign crossed a payout threshold.
 *
 * The snapshot row above says how much moved; this says where it went. It is
 * the only screen that reaches individual ledger entries from the campaign
 * side, which is what makes a creator's "why was I paid this" answerable
 * without going through their account.
 */
export function SnapshotEntries({
  snapshot,
  onOpenChange,
}: {
  snapshot: Snapshot | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [page, setPage] = React.useState(1);

  // Each snapshot is a fresh listing, so opening a different one starts at
  // page one rather than at whatever page the last one was left on.
  const snapshotId = snapshot?.id ?? null;
  const [lastId, setLastId] = React.useState(snapshotId);
  if (snapshotId !== lastId) {
    setLastId(snapshotId);
    setPage(1);
  }

  const { data, isLoading, error, refetch } = useSnapshotEntriesQuery(snapshotId, page);

  const entries = data?.entries ?? [];
  const meta = data?.pagination;

  return (
    <Sheet open={Boolean(snapshot)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            Payout at {snapshot?.threshold_percent}%
            {snapshot?.is_marker && <Badge variant="outline">Marker</Badge>}
          </SheetTitle>
          <SheetDescription>
            {snapshot
              ? `${formatCurrency(snapshot.amount_credited)} credited on ${formatDateTime(
                  snapshot.reached_at
                )}`
              : "Loading the entries behind this payout."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 space-y-6 p-4">
          {snapshot && (
            <DetailList
              items={[
                { label: "Credited", value: formatCurrency(snapshot.amount_credited) },
                {
                  label: "Spend after",
                  value: `${formatCurrency(snapshot.spent_after)} of ${formatCurrency(
                    snapshot.total_budget
                  )}`,
                },
                { label: "Posts", value: formatNumber(snapshot.submission_count) },
                {
                  label: "Payable views",
                  value: formatNumber(snapshot.total_payable_views),
                },
              ]}
            />
          )}

          <QueryState
            isLoading={isLoading && !data}
            error={error}
            isEmpty={entries.length === 0}
            emptyMessage={
              snapshot?.is_marker
                ? "A marker records the threshold being crossed with no money attached, so there is nothing to break down."
                : "No creator earned anything at this threshold."
            }
            onRetry={() => void refetch()}
          >
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Creator</TableHead>
                      <TableHead className="text-right">Payable views</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                      <TableHead className="text-right">Credited</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Link
                            href={`/users/${entry.user_id}`}
                            className="text-xs hover:underline"
                          >
                            <code>{entry.user_id.slice(0, 8)}</code>
                          </Link>
                          {/* A missing transaction id means the entry was
                              recorded but no money moved for it - worth
                              seeing, because it is the difference between
                              "earned nothing" and "was not paid". */}
                          {!entry.transaction_id && (
                            <Badge variant="outline" className="ml-2">
                              No transaction
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(entry.payable_views)}
                          <span className="text-muted-foreground ml-1 text-xs">
                            of {formatNumber(entry.raw_views)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(entry.earnings_total)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(entry.amount_credited)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <SimplePagination meta={meta} onPageChange={setPage} noun="creators" />
            </div>
          </QueryState>
        </div>
      </SheetContent>
    </Sheet>
  );
}
