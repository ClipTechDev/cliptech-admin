"use client";

import { formatDateTime } from "@/lib/format";
import { useSocialHealthQuery } from "@/hooks/use-social-health";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryState } from "@/components/shared/query-state";
import { PlatformHealthCard } from "@/components/social/platform-health-card";

/**
 * OAuth standing of every platform integration, polled every sixty seconds -
 * a screen you must reload to see a token expire is not a monitor.
 */
export function SocialHealthPanel() {
  const { data, isLoading, error, refetch, dataUpdatedAt } = useSocialHealthQuery();

  return (
    <QueryState
      isLoading={isLoading && !data}
      loadingFallback={<HealthSkeleton />}
      error={error}
      onRetry={() => void refetch()}
    >
      {data && (
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {data.map((row) => (
              <PlatformHealthCard key={row.platform} row={row} />
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            Refreshed automatically every 60 seconds
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

function HealthSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-56 rounded-lg" />
      ))}
    </div>
  );
}
