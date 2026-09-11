import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import type { SnapshotEntriesResponse } from "@/schemas/payout";

/**
 * A snapshot's entries: who was paid what, the last time a campaign crossed a
 * payout threshold.
 *
 * Its own resource rather than a branch of campaigns, because the API mounts
 * it that way - `/v1/admin/snapshots/:id/entries` is keyed by the snapshot,
 * not by the campaign it belongs to.
 */
export const snapshotsKeys = {
  all: ["snapshots"] as const,
  detail: (id: string) => [...snapshotsKeys.all, id] as const,
  entries: (id: string, page: number) => [...snapshotsKeys.detail(id), "entries", page] as const,
};

export function snapshotEntriesOptions(
  id: string,
  page: number,
  limit: number,
  fetcher: ApiFetcher = clientFetch
) {
  return queryOptions({
    queryKey: snapshotsKeys.entries(id, page),
    queryFn: () =>
      fetcher<SnapshotEntriesResponse>(`/admin/snapshots/${id}/entries`, {
        query: { page, limit },
      }),
    placeholderData: keepPreviousData,
  });
}

/** Passing null holds the query off, which is what a closed drawer does. */
export function useSnapshotEntriesQuery(id: string | null, page: number, limit = 20) {
  return useQuery({
    ...snapshotEntriesOptions(id ?? "", page, limit),
    enabled: Boolean(id),
  });
}
