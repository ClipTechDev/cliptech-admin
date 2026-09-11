import { queryOptions, useQuery } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import type { AdminDashboardResponse } from "@/schemas/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  admin: () => [...dashboardKeys.all, "admin"] as const,
};

/**
 * GET /v1/admin/dashboard - the operations overview.
 *
 * Behind the admin cookie but no particular role: every figure on it is a
 * count the admin could reach through their own listings anyway, so it is the
 * one screen the whole team shares.
 *
 * The numbers move as work happens elsewhere in the app, so they are given a
 * short staleness rather than none - long enough that flipping between tabs
 * doesn't refetch, short enough that the landing screen isn't lying.
 */
export function adminDashboardOptions(fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: dashboardKeys.admin(),
    queryFn: () => fetcher<AdminDashboardResponse>("/admin/dashboard"),
    select: (response: AdminDashboardResponse) => response.dashboard,
    staleTime: 60 * 1000,
  });
}

export function useAdminDashboardQuery() {
  return useQuery(adminDashboardOptions());
}
