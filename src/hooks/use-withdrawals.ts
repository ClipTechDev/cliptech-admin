import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { listParamsToQuery, type ListParams } from "@/lib/list-params";
import { dashboardKeys } from "@/hooks/use-dashboard";
import { usersKeys } from "@/hooks/use-users";
import type { WithdrawalResponse, WithdrawalsListResponse } from "@/schemas/withdrawal";

/** The filters `/v1/admin/withdrawals` accepts. It takes no free-text search. */
export const WITHDRAWAL_FILTER_KEYS = ["status", "method", "user_id"] as const;

export const withdrawalsKeys = {
  all: ["withdrawals"] as const,
  lists: () => [...withdrawalsKeys.all, "list"] as const,
  list: (params: ListParams) =>
    [...withdrawalsKeys.lists(), listParamsToQuery(params)] as const,
  details: () => [...withdrawalsKeys.all, "detail"] as const,
  detail: (id: string) => [...withdrawalsKeys.details(), id] as const,
};

export function withdrawalsListOptions(params: ListParams, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: withdrawalsKeys.list(params),
    queryFn: () =>
      fetcher<WithdrawalsListResponse>("/admin/withdrawals", {
        query: listParamsToQuery(params),
      }),
    placeholderData: keepPreviousData,
  });
}

export function withdrawalDetailOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: withdrawalsKeys.detail(id),
    queryFn: () => fetcher<WithdrawalResponse>(`/admin/withdrawals/${id}`),
    select: (response: WithdrawalResponse) => response.withdrawal,
  });
}

export function useWithdrawalsQuery(params: ListParams) {
  return useQuery(withdrawalsListOptions(params));
}

export function useWithdrawalQuery(id: string | null) {
  return useQuery({ ...withdrawalDetailOptions(id ?? ""), enabled: Boolean(id) });
}

/**
 * The six transitions an admin can make, all PATCH, all returning the
 * updated request.
 *
 * Every one of them moves money or the promise of it, so each success writes
 * the response into the detail cache and invalidates three things: the
 * listings, the dashboard (whose payout queue count and open amount both
 * shift), and - for the transitions that return a balance - the creator whose
 * account it went back to.
 */
function useWithdrawalAction<TBody>(id: string, path: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body?: TBody) =>
      clientFetch<WithdrawalResponse>(`/admin/withdrawals/${id}/${path}`, {
        method: "PATCH",
        ...(body !== undefined ? { body } : {}),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(withdrawalsKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: withdrawalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.admin() });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: usersKeys.detail(userId) });
      }
    },
  });
}

/** Notes are optional - the API treats a missing body as a bare approve. */
export function useApproveWithdrawal(id: string, userId?: string) {
  return useWithdrawalAction<{ notes: string | null }>(id, "approve", userId);
}

export function useProcessingWithdrawal(id: string, userId?: string) {
  return useWithdrawalAction<never>(id, "processing", userId);
}

/** Rejecting returns the amount to the creator's balance. Reason required. */
export function useRejectWithdrawal(id: string, userId?: string) {
  return useWithdrawalAction<{ reason: string }>(id, "reject", userId);
}

/** The end of the manual flow: the transfer was made and is being recorded. */
export function useMarkWithdrawalPaid(id: string, userId?: string) {
  return useWithdrawalAction<{ provider_reference: string | null }>(id, "paid", userId);
}

/** Also refunds the balance - a failed transfer is money that never left. */
export function useMarkWithdrawalFailed(id: string, userId?: string) {
  return useWithdrawalAction<{ reason: string }>(id, "fail", userId);
}

export function useCancelWithdrawal(id: string, userId?: string) {
  return useWithdrawalAction<{ reason: string }>(id, "cancel", userId);
}
