import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ACTION_LOG_FILTER_KEYS, actionLogsListOptions } from "@/hooks/use-action-logs";
import { serverFetch } from "@/lib/api-server";
import { parseListParams } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { ActionLogsTable } from "@/components/action-logs/action-logs-table";

/**
 * The audit trail — super admin only.
 *
 * Not because the log is more sensitive than the screens it describes, but
 * because reading what your colleagues have done is a different grant from
 * being able to act.
 */
export default async function ActionLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, ACTION_LOG_FILTER_KEYS);

  const queryClient = getQueryClient();
  await queryClient
    .prefetchQuery(actionLogsListOptions(params, serverFetch))
    .catch(() => undefined);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Action log"
        description="Every change an admin has made, in the words of the handler that recorded it."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ActionLogsTable />
      </HydrationBoundary>
    </div>
  );
}
