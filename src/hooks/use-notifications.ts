import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { listParamsToQuery, type ListParams } from "@/lib/list-params";
import type {
  NotificationResponse,
  NotificationStatsResponse,
  NotificationsListResponse,
} from "@/schemas/notification";

/**
 * The filters `/v1/admin/notifications` accepts beyond search and the dates.
 *
 * `push` and `email` each take a delivery status, so the two channels are
 * narrowed independently - "queued for push but already emailed" is a real
 * and interesting row, and a single combined filter could not ask for it.
 */
export const NOTIFICATION_FILTER_KEYS = ["type", "push", "email", "read", "user_id"] as const;

export const notificationsKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationsKeys.all, "list"] as const,
  list: (params: ListParams) =>
    [...notificationsKeys.lists(), listParamsToQuery(params)] as const,
  details: () => [...notificationsKeys.all, "detail"] as const,
  detail: (id: string) => [...notificationsKeys.details(), id] as const,
  stats: () => [...notificationsKeys.all, "stats"] as const,
};

export function notificationsListOptions(
  params: ListParams,
  fetcher: ApiFetcher = clientFetch
) {
  return queryOptions({
    queryKey: notificationsKeys.list(params),
    queryFn: () =>
      fetcher<NotificationsListResponse>("/admin/notifications", {
        query: listParamsToQuery(params),
      }),
    placeholderData: keepPreviousData,
  });
}

export function notificationDetailOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: notificationsKeys.detail(id),
    queryFn: () => fetcher<NotificationResponse>(`/admin/notifications/${id}`),
    select: (response: NotificationResponse) => response.notification,
  });
}

/**
 * The outbox rollup. Its own endpoint and its own query because it does not
 * move with the table's filters: it answers "is delivery healthy", which is
 * not a question about whichever page is on screen.
 */
export function notificationStatsOptions(fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: notificationsKeys.stats(),
    queryFn: () => fetcher<NotificationStatsResponse>("/admin/notifications/stats"),
  });
}

export function useNotificationsQuery(params: ListParams) {
  return useQuery(notificationsListOptions(params));
}

/**
 * One notification. Passing null holds the query off entirely, which is what
 * the detail sheet does while nothing is open.
 *
 * There are no mutations in this file, and that is the API's shape rather than
 * an omission: the outbox is written by the events that cause it and drained
 * by the dispatch worker, so an admin route that changed a row would be
 * claiming something about a delivery that never happened.
 */
export function useNotificationQuery(id: string | null) {
  return useQuery({
    ...notificationDetailOptions(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useNotificationStatsQuery() {
  return useQuery(notificationStatsOptions());
}
