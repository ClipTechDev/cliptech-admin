import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { listParamsToQuery, type ListParams } from "@/lib/list-params";
import type { SocialAccountsResponse } from "@/schemas/social-account";
import type { TransactionsListResponse } from "@/schemas/transaction";
import type { AdminPayoutMethodsResponse } from "@/schemas/withdrawal";
import type {
  AdminUser,
  UserFormValues,
  UserResponse,
  UsersListResponse,
} from "@/schemas/user";
import { userFormDiff } from "@/schemas/user";

/** The filters `/v1/admin/users` accepts beyond the shared search/date pair. */
export const USER_FILTER_KEYS = ["status"] as const;

/**
 * Query keys are derived from the same ListParams the URL carries, so the
 * server's prefetch and the client's `useQuery` land on the same cache entry.
 * Spreading the params object (rather than the raw search string) keeps the
 * key stable regardless of how the URL happened to order its parameters.
 */
export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (params: ListParams) => [...usersKeys.lists(), listParamsToQuery(params)] as const,
  details: () => [...usersKeys.all, "detail"] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  transactions: (id: string, page: number) =>
    [...usersKeys.detail(id), "transactions", page] as const,
  socialAccounts: (id: string) => [...usersKeys.detail(id), "social-accounts"] as const,
  payoutMethods: (id: string) => [...usersKeys.detail(id), "payout-methods"] as const,
};

/**
 * Options factories rather than constants, because each takes the fetcher to
 * use: `serverFetch` from a Server Component prefetch, the default
 * `clientFetch` from a hook in the browser. Everything else - key, select,
 * placeholder behaviour - is shared, which is the point.
 */
export function usersListOptions(params: ListParams, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: usersKeys.list(params),
    queryFn: () =>
      fetcher<UsersListResponse>("/admin/users", { query: listParamsToQuery(params) }),
    // Paging and typing keep the previous page on screen instead of flashing
    // an empty table between requests.
    placeholderData: keepPreviousData,
  });
}

export function userDetailOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: usersKeys.detail(id),
    queryFn: () => fetcher<UserResponse>(`/admin/users/${id}`),
    select: (response: UserResponse) => response.user,
  });
}

export function userTransactionsOptions(
  id: string,
  page: number,
  limit: number,
  fetcher: ApiFetcher = clientFetch
) {
  return queryOptions({
    queryKey: usersKeys.transactions(id, page),
    queryFn: () =>
      fetcher<TransactionsListResponse>(`/admin/users/${id}/transactions`, {
        query: { page, limit },
      }),
    placeholderData: keepPreviousData,
  });
}

export function userSocialAccountsOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: usersKeys.socialAccounts(id),
    queryFn: () => fetcher<SocialAccountsResponse>(`/admin/users/${id}/social-accounts`),
    select: (response: SocialAccountsResponse) => response.accounts,
  });
}

export function userPayoutMethodsOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: usersKeys.payoutMethods(id),
    queryFn: () =>
      fetcher<AdminPayoutMethodsResponse>(`/admin/users/${id}/payout-methods`),
    select: (response: AdminPayoutMethodsResponse) => response.methods,
  });
}

export function useUsersQuery(params: ListParams) {
  return useQuery(usersListOptions(params));
}

export function useUserQuery(id: string) {
  return useQuery(userDetailOptions(id));
}

/**
 * The creator behind an id, for labelling a view that is scoped to one.
 *
 * Shares the detail cache, so a creator already opened elsewhere costs
 * nothing. It doesn't retry, and its failure is meant to be ignored by the
 * caller: this is read from the withdrawals, feedback and submissions
 * listings, whose roles don't imply "users", and a 403 there should cost the
 * name rather than the screen.
 */
export function useUserLookupQuery(id: string) {
  return useQuery({
    ...userDetailOptions(id),
    enabled: Boolean(id),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserTransactionsQuery(id: string, page: number, limit = 20) {
  return useQuery(userTransactionsOptions(id, page, limit));
}

export function useUserSocialAccountsQuery(id: string) {
  return useQuery(userSocialAccountsOptions(id));
}

export function useUserPayoutMethodsQuery(id: string) {
  return useQuery(userPayoutMethodsOptions(id));
}

/**
 * PATCH /v1/admin/users/:id with only the fields that changed - see
 * userFormDiff for why. Writes the response straight into the detail cache
 * so the form it came from doesn't flicker back to stale values, then
 * invalidates the lists.
 */
export function useUpdateUserMutation(user: AdminUser) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: UserFormValues) =>
      clientFetch<UserResponse>(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: userFormDiff(values, user),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(usersKeys.detail(user.id), response);
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

export function useSetUserNoteMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    // An empty note clears it: the API treats "" and null alike, and there is
    // no separate delete for something that is a single nullable column.
    mutationFn: (note: string) =>
      clientFetch<UserResponse>(`/admin/users/${id}/note`, {
        method: "PATCH",
        body: { note: note.trim() === "" ? null : note },
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(usersKeys.detail(id), response);
    },
  });
}

/** Soft delete - the row keeps its history, deleted_at is stamped. */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      clientFetch<{ success: boolean; message: string }>(`/admin/users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: usersKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
