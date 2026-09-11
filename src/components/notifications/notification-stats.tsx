"use client";

import { formatDateTime, formatNumber } from "@/lib/format";
import { useNotificationStatsQuery } from "@/hooks/use-notifications";
import { QueryState } from "@/components/shared/query-state";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The state of the whole outbox, above the table it does not move with.
 *
 * Four figures chosen for one question - is delivery working - rather than
 * everything the rollup carries. The two "gave up" counts lead because they
 * are the only ones nobody will retry, and the oldest queued row is the
 * number that says whether the dispatch worker is draining at all: a backlog
 * hours deep looks identical to a healthy queue in every other figure here.
 */
export function NotificationStats() {
  const { data, isLoading, error, refetch } = useNotificationStatsQuery();
  const stats = data?.stats;

  return (
    <QueryState
      isLoading={isLoading}
      loadingFallback={
        <StatGrid>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-[92px] rounded-lg" />
          ))}
        </StatGrid>
      }
      error={error}
      onRetry={() => void refetch()}
    >
      {stats && (
        <StatGrid>
          <StatCard
            label="Waiting"
            value={formatNumber(stats.push_queued + stats.email_queued)}
            hint={`${formatNumber(stats.push_queued)} push, ${formatNumber(stats.email_queued)} email`}
          />
          <StatCard
            label="Gave up"
            value={formatNumber(stats.push_failed + stats.email_failed)}
            hint={`After ${data.max_delivery_attempts} attempts on a channel`}
          />
          <StatCard
            label="Oldest waiting"
            value={stats.oldest_queued_at ? formatDateTime(stats.oldest_queued_at) : "Nothing"}
            tone={stats.oldest_queued_at ? "default" : "muted"}
            hint="If this is old, the dispatch worker is not draining"
          />
          <StatCard
            label="Unread"
            value={formatNumber(stats.unread)}
            tone="muted"
            hint={`Of ${formatNumber(stats.total)} raised`}
          />
        </StatGrid>
      )}
    </QueryState>
  );
}
