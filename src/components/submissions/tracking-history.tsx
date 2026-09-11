"use client";

import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { useSubmissionLogsQuery } from "@/hooks/use-submissions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryState } from "@/components/shared/query-state";
import { ViewLogChart } from "@/components/submissions/view-log-chart";

/**
 * The poll history: the chart for the shape, the table for the numbers.
 *
 * Both are always present - the table is what makes every value the chart
 * shows reachable without hovering, and it is the only place a fetch error's
 * text appears.
 */
export function TrackingHistory({ submissionId }: { submissionId: string }) {
  const { data, isLoading, error, refetch } = useSubmissionLogsQuery(submissionId, 1, 50);
  const logs = data?.logs ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={logs.length === 0}
      emptyMessage="This post hasn't been polled yet."
      onRetry={() => void refetch()}
    >
      <div className="space-y-4">
        <ViewLogChart logs={logs} />

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracked</TableHead>
                <TableHead className="text-right">Raw</TableHead>
                <TableHead className="text-right">Payable</TableHead>
                <TableHead className="text-right">Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDateTime(log.tracked_at)}
                    {log.fetch_error && (
                      <span className="text-destructive block text-xs">{log.fetch_error}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(log.raw_views)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(log.payable_views)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(log.earnings)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data && data.pagination.total > logs.length && (
          <p className="text-muted-foreground text-xs">
            Showing the {logs.length} most recent of {formatNumber(data.pagination.total)}{" "}
            readings.
          </p>
        )}
      </div>
    </QueryState>
  );
}
