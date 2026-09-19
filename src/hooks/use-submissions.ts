import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { listParamsToQuery, type ListParams } from "@/lib/list-params";
import { campaignsKeys } from "@/hooks/use-campaigns";
import { usersKeys } from "@/hooks/use-users";
import type { UserResponse } from "@/schemas/user";
import type {
  SubmissionResponse,
  SubmissionsListResponse,
  ViewLogsResponse,
} from "@/schemas/submission";

/**
 * The filters `/v1/admin/submissions` accepts. `campaign_id` is one of them,
 * which is what lets the campaign tracking page reuse this listing whole
 * rather than needing its own endpoint.
 */
export const SUBMISSION_FILTER_KEYS = [
  "status",
  "platform",
  "payment_status",
  "campaign_id",
  "user_id",
] as const;

export const submissionsKeys = {
  all: ["submissions"] as const,
  lists: () => [...submissionsKeys.all, "list"] as const,
  list: (params: ListParams) =>
    [...submissionsKeys.lists(), listParamsToQuery(params)] as const,
  details: () => [...submissionsKeys.all, "detail"] as const,
  detail: (id: string) => [...submissionsKeys.details(), id] as const,
  logs: (id: string, page: number) => [...submissionsKeys.detail(id), "logs", page] as const,
};

export function submissionsListOptions(params: ListParams, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: submissionsKeys.list(params),
    queryFn: () =>
      fetcher<SubmissionsListResponse>("/admin/submissions", {
        query: listParamsToQuery(params),
      }),
    placeholderData: keepPreviousData,
  });
}

export function submissionDetailOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: submissionsKeys.detail(id),
    queryFn: () => fetcher<SubmissionResponse>(`/admin/submissions/${id}`),
    select: (response: SubmissionResponse) => response.submission,
  });
}

/**
 * The post's tracking history - one row per poll, failures included.
 *
 * Asked for newest-first by the API's own ordering; the chart re-sorts
 * ascending because a time axis has to run forwards.
 */
export function submissionLogsOptions(
  id: string,
  page: number,
  limit: number,
  fetcher: ApiFetcher = clientFetch
) {
  return queryOptions({
    queryKey: submissionsKeys.logs(id, page),
    queryFn: () =>
      fetcher<ViewLogsResponse>(`/admin/submissions/${id}/logs`, { query: { page, limit } }),
    placeholderData: keepPreviousData,
  });
}

export function useSubmissionsQuery(params: ListParams) {
  return useQuery(submissionsListOptions(params));
}

export function useSubmissionQuery(id: string | null) {
  return useQuery({ ...submissionDetailOptions(id ?? ""), enabled: Boolean(id) });
}

export function useSubmissionLogsQuery(id: string | null, page: number, limit = 50) {
  return useQuery({
    ...submissionLogsOptions(id ?? "", page, limit),
    enabled: Boolean(id),
  });
}

/**
 * Resolves the creators behind a page of submissions.
 *
 * A submission carries only `user_id` - the API embeds nothing - so a table of
 * them would otherwise show opaque ids. These share the users feature's cache
 * key, so a creator already opened elsewhere costs nothing, and repeat
 * submitters within a campaign are fetched once.
 *
 * Failures are deliberately swallowed by the caller: this needs the "users"
 * role, and an admin holding only "campaigns" should still get a usable
 * submissions table with ids in place of names.
 */
export function useSubmissionUsers(userIds: string[]) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));

  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: usersKeys.detail(id),
      queryFn: () => clientFetch<UserResponse>(`/admin/users/${id}`),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  const byId = new Map<string, { name: string; email: string }>();
  results.forEach((result, index) => {
    const user = result.data?.user;
    if (user) byId.set(unique[index], { name: user.name, email: user.email });
  });

  return byId;
}

/**
 * The five review actions. Each returns the updated submission, so the detail
 * cache is written from the response and every submissions listing plus the
 * campaign (whose accrued total moves with it) is invalidated.
 */
function useSubmissionAction<TBody>(
  id: string,
  path: string,
  campaignId?: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body?: TBody) =>
      clientFetch<SubmissionResponse>(`/admin/submissions/${id}/${path}`, {
        method: "PATCH",
        ...(body !== undefined ? { body } : {}),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(submissionsKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: submissionsKeys.lists() });
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: campaignsKeys.detail(campaignId) });
      }
    },
  });
}

export function useApproveSubmission(id: string, campaignId?: string) {
  return useSubmissionAction<never>(id, "approve", campaignId);
}

export function useUnflagSubmission(id: string, campaignId?: string) {
  return useSubmissionAction<never>(id, "unflag", campaignId);
}

export function useRejectSubmission(id: string, campaignId?: string) {
  return useSubmissionAction<{ reason: string }>(id, "reject", campaignId);
}

export function useFlagSubmission(id: string, campaignId?: string) {
  return useSubmissionAction<{ reason: string }>(id, "flag", campaignId);
}

export function useInvalidateSubmission(id: string, campaignId?: string) {
  return useSubmissionAction<{ reason: string }>(id, "invalidate", campaignId);
}
