"use client";

import { formatDateTime } from "@/lib/format";
import { useSystemStatusQuery } from "@/hooks/use-system";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryState } from "@/components/shared/query-state";
import { JobsTable } from "@/components/system/jobs-table";
import { StatusBanner } from "@/components/system/status-banner";

/**
 * What the background workers have been doing.
 *
 * Polled every thirty seconds rather than fetched once - a monitoring screen
 * that has to be reloaded to notice a job start failing is not one.
 */
export function SystemStatusPanel() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useSystemStatusQuery();

  return (
    <QueryState
      isLoading={isLoading && !data}
      loadingFallback={<StatusSkeleton />}
      error={error}
      onRetry={() => void refetch()}
    >
      {data && (
        <div className="flex min-w-0 flex-col gap-6">
          <StatusBanner status={data} />
          <JobsTable jobs={data.jobs} />
          <p className="text-muted-foreground text-xs">
            Refreshed automatically every 30 seconds
            {dataUpdatedAt
              ? ` · last read ${formatDateTime(new Date(dataUpdatedAt).toISOString())}`
              : ""}
            .
          </p>
        </div>
      )}
    </QueryState>
  );
}

function StatusSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-[5.5rem] rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
