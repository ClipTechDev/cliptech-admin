import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import {
  NOTIFICATION_FILTER_KEYS,
  notificationsListOptions,
  notificationStatsOptions,
} from "@/hooks/use-notifications";
import { serverFetch } from "@/lib/api-server";
import { parseListParams } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { NotificationStats } from "@/components/notifications/notification-stats";
import { NotificationsBrowser } from "@/components/notifications/notifications-browser";

/**
 * The notification outbox - one row for everything a creator should have been
 * told, and how far it got.
 *
 * Read-only, because the outbox is: rows are written by the events that cause
 * them, inside those events' own transactions, and drained later by the
 * dispatch worker. What an admin needs here is the answer to "why was this
 * person not told", which is the attempt counters and the error text.
 *
 * Both queries are prefetched. The rollup is the reason the page is opened at
 * all - it is where "is anything stuck" is answered - so it should be in the
 * first paint rather than a moment behind the table.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, NOTIFICATION_FILTER_KEYS);

  const queryClient = getQueryClient();
  await Promise.all([
    queryClient
      .prefetchQuery(notificationsListOptions(params, serverFetch))
      .catch(() => undefined),
    queryClient.prefetchQuery(notificationStatsOptions(serverFetch)).catch(() => undefined),
  ]);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Notifications"
        description="What creators were told, by push and by email, and what came back."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NotificationStats />
        {/* The browser reads ?notification= to decide which row is open. */}
        <Suspense fallback={null}>
          <NotificationsBrowser />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
