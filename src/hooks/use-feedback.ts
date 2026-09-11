import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { listParamsToQuery, type ListParams } from "@/lib/list-params";
import type { FeedbackListResponse, FeedbackResponse } from "@/schemas/feedback";

/** The filters `/v1/admin/feedback` accepts beyond the shared search/date set. */
export const FEEDBACK_FILTER_KEYS = ["user_id"] as const;

export const feedbackKeys = {
  all: ["feedback"] as const,
  lists: () => [...feedbackKeys.all, "list"] as const,
  list: (params: ListParams) =>
    [...feedbackKeys.lists(), listParamsToQuery(params)] as const,
  details: () => [...feedbackKeys.all, "detail"] as const,
  detail: (id: string) => [...feedbackKeys.details(), id] as const,
};

export function feedbackListOptions(params: ListParams, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: feedbackKeys.list(params),
    queryFn: () =>
      fetcher<FeedbackListResponse>("/admin/feedback", { query: listParamsToQuery(params) }),
    placeholderData: keepPreviousData,
  });
}

export function feedbackDetailOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: feedbackKeys.detail(id),
    queryFn: () => fetcher<FeedbackResponse>(`/admin/feedback/${id}`),
    select: (response: FeedbackResponse) => response.feedback,
  });
}

export function useFeedbackListQuery(params: ListParams) {
  return useQuery(feedbackListOptions(params));
}

/**
 * One entry. Passing null holds the query off entirely, which is what the
 * detail sheet does while nothing is open.
 *
 * There are no mutations in this file, and that is the API's shape rather
 * than an omission: feedback is what a creator said, so the admin routes are
 * a list and a get and nothing else.
 */
export function useFeedbackQuery(id: string | null) {
  return useQuery({
    ...feedbackDetailOptions(id ?? ""),
    enabled: Boolean(id),
  });
}
