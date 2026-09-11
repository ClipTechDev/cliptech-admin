import { queryOptions, useQuery } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import type { SocialHealthResponse } from "@/schemas/social-health";

export const socialHealthKeys = {
  all: ["social-health"] as const,
  platforms: () => [...socialHealthKeys.all, "platforms"] as const,
};

/**
 * GET /v1/admin/social/health - super admin only, like the system status page
 * and for the same reason: it is a monitoring surface for whoever runs the
 * integrations, not any one role's daily work.
 *
 * Polled, not fetched once. A token quietly expiring or a provider starting to
 * reject auth is exactly what this page exists to catch, and one you must
 * reload to notice that doesn't. Sixty seconds is ample for a surface that
 * shifts over hours.
 */
export function socialHealthOptions(fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: socialHealthKeys.platforms(),
    queryFn: () => fetcher<SocialHealthResponse>("/admin/social/health"),
    select: (response: SocialHealthResponse) => response.platforms,
    refetchInterval: 60 * 1000,
    // Keep polling in the background: an admin who left this on a second
    // screen is watching it precisely because it is idle.
    refetchIntervalInBackground: true,
  });
}

export function useSocialHealthQuery() {
  return useQuery(socialHealthOptions());
}
