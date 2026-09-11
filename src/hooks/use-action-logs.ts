import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { listParamsToQuery, type ListParams } from "@/lib/list-params";
import type { ActionLogsResponse } from "@/schemas/action-log";

/** The filters `/v1/admin/action-logs` accepts beyond search and the dates. */
export const ACTION_LOG_FILTER_KEYS = ["action", "admin_id"] as const;

export const actionLogsKeys = {
  all: ["action-logs"] as const,
  lists: () => [...actionLogsKeys.all, "list"] as const,
  list: (params: ListParams) =>
    [...actionLogsKeys.lists(), listParamsToQuery(params)] as const,
};

/**
 * GET /v1/admin/action-logs - super admin only.
 *
 * Not because the log is more sensitive than the screens it describes, but
 * because reading what your colleagues have done is a different grant from
 * being able to act. A non-super admin gets a 403 here, which QueryState
 * renders as "You don't have access to this".
 */
export function actionLogsListOptions(params: ListParams, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: actionLogsKeys.list(params),
    queryFn: () =>
      fetcher<ActionLogsResponse>("/admin/action-logs", { query: listParamsToQuery(params) }),
    placeholderData: keepPreviousData,
  });
}

export function useActionLogsQuery(params: ListParams) {
  return useQuery(actionLogsListOptions(params));
}
