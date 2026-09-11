import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { systemKeys } from "@/hooks/use-system";
import type { SettingsResponse } from "@/schemas/settings";

export const settingsKeys = {
  all: ["settings"] as const,
  current: () => [...settingsKeys.all, "current"] as const,
};

/**
 * GET /v1/admin/settings - super admin only, through RequireSuperAdmin rather
 * than a role named for it: these values change how every background job
 * behaves for everybody.
 *
 * The response carries the live settings, the defaults each field would
 * revert to, and the path of the file on the box - so the form can show what
 * a value used to be without keeping a second copy of the defaults here.
 */
export function settingsOptions(fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: settingsKeys.current(),
    queryFn: () => fetcher<SettingsResponse>("/admin/settings"),
    select: (response: SettingsResponse) => response.settings,
  });
}

export function useSettingsQuery() {
  return useQuery(settingsOptions());
}

/**
 * PATCH /v1/admin/settings with only the sections and fields that changed -
 * see settingsFormDiff for why sending the whole form would be wrong.
 *
 * The saved values take effect from the next tick of each job, so the system
 * status screen is invalidated alongside: its paused flag and every interval
 * it reports come from exactly these settings.
 */
export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Record<string, Record<string, unknown>>) =>
      clientFetch<SettingsResponse>("/admin/settings", { method: "PATCH", body: patch }),
    onSuccess: (response) => {
      queryClient.setQueryData(settingsKeys.current(), response);
      queryClient.invalidateQueries({ queryKey: systemKeys.status() });
    },
  });
}
