import { queryOptions, useQuery } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import type { SystemStatusResponse } from "@/schemas/system";

export const systemKeys = {
  all: ["system"] as const,
  status: () => [...systemKeys.all, "status"] as const,
};

/**
 * GET /v1/admin/system/status - super admin only, like the settings API and
 * for the same reason: the people who can change how the jobs run are the
 * ones who need to see what they did.
 *
 * Polled rather than fetched once. This is a monitoring screen, and a page
 * that has to be reloaded to notice a job start failing is not one. Thirty
 * seconds is well under the shortest job interval, so a run cannot come and
 * go between two reads.
 */
export function systemStatusOptions(fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: systemKeys.status(),
    queryFn: () => fetcher<SystemStatusResponse>("/admin/system/status"),
    select: (response: SystemStatusResponse) => response.status,
    refetchInterval: 30 * 1000,
    // Keep polling while the tab is in the background: an admin who left this
    // open on a second monitor is watching it precisely because it is idle.
    refetchIntervalInBackground: true,
  });
}

export function useSystemStatusQuery() {
  return useQuery(systemStatusOptions());
}
