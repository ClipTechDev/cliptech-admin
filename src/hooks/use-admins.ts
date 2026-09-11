import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import {
  emptyListParams,
  listParamsToQuery,
  MAX_PAGE_SIZE,
  type ListParams,
} from "@/lib/list-params";
import { adminKeys } from "@/hooks/use-admin";
import type {
  Admin,
  AdminResponse,
  AdminsListResponse,
  CreateAdminValues,
  InviteAdminValues,
  UpdateAdminValues,
} from "@/schemas/admin";
import { adminFormDiff } from "@/schemas/admin";

/**
 * The filters `/v1/admin/admins` accepts. Note it takes neither ?from nor ?to
 * - ListFilters here is search/role/is_active only - so the toolbar leaves the
 * date range off rather than sending parameters the API silently ignores.
 */
export const ADMIN_FILTER_KEYS = ["role", "is_active"] as const;

export const adminsKeys = {
  all: ["admins"] as const,
  lists: () => [...adminsKeys.all, "list"] as const,
  list: (params: ListParams) => [...adminsKeys.lists(), listParamsToQuery(params)] as const,
  details: () => [...adminsKeys.all, "detail"] as const,
  detail: (id: string) => [...adminsKeys.details(), id] as const,
};

export function adminsListOptions(params: ListParams, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: adminsKeys.list(params),
    queryFn: () =>
      fetcher<AdminsListResponse>("/admin/admins", { query: listParamsToQuery(params) }),
    placeholderData: keepPreviousData,
  });
}

export function adminDetailOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: adminsKeys.detail(id),
    queryFn: () => fetcher<AdminResponse>(`/admin/admins/${id}`),
    select: (response: AdminResponse) => response.admin,
  });
}

export function useAdminsQuery(params: ListParams) {
  return useQuery(adminsListOptions(params));
}

export function useAdminByIdQuery(id: string) {
  return useQuery(adminDetailOptions(id));
}

/**
 * Built once at module load rather than per render: a fresh object would be a
 * new query key every time the table above it re-renders, which is every
 * keystroke in its search box.
 */
const adminOptionsParams: ListParams = { ...emptyListParams(), limit: MAX_PAGE_SIZE };

/**
 * The whole team, as options for the action log's "By" filter.
 *
 * One capped page rather than paging, like the campaign picker: admins are a
 * bounded list, which is what makes a dropdown the right control for
 * `admin_id` and the wrong one for a creator id. It doesn't retry - the log
 * is super-admin-only and a super admin holds this too, so a failure here is
 * unusual and should cost the names rather than the log.
 */
export function useAdminOptionsQuery() {
  return useQuery({
    ...adminsListOptions(adminOptionsParams),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * POST /v1/admin/admins/invite - super admin only.
 *
 * The response carries the account and no password: the API generates one,
 * emails it, and never echoes it back, so there is nothing here to display or
 * copy. If SMTP is unconfigured the API answers 503 and creates nothing; if
 * the send fails it rolls the account back and answers 502, which is why the
 * form surfaces both as retryable rather than as a partial success.
 */
export function useInviteAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: InviteAdminValues) =>
      clientFetch<AdminResponse>("/admin/admins/invite", { method: "POST", body: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsKeys.lists() });
    },
  });
}

/** POST /v1/admin/admins - password chosen by hand, needs the "admins" role. */
export function useCreateAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateAdminValues) =>
      clientFetch<AdminResponse>("/admin/admins", { method: "POST", body: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminsKeys.lists() });
    },
  });
}

export function useUpdateAdminMutation(admin: Admin) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: UpdateAdminValues) =>
      clientFetch<AdminResponse>(`/admin/admins/${admin.id}`, {
        method: "PATCH",
        body: adminFormDiff(values, admin),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(adminsKeys.detail(admin.id), response);
      queryClient.invalidateQueries({ queryKey: adminsKeys.lists() });
      // Editing your own account changes the name, roles and active flag the
      // shell is drawing from /admin/me, so that has to be refetched too.
      queryClient.invalidateQueries({ queryKey: adminKeys.me() });
    },
  });
}

/**
 * DELETE /v1/admin/admins/:id.
 *
 * The API refuses with 409 in two cases the UI cannot always predict: deleting
 * yourself, and deleting an admin who has action history (deactivate them
 * instead - the audit trail has to keep pointing at a real row). Both come
 * back as readable messages, so they are shown rather than pre-empted.
 */
export function useDeleteAdminMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      clientFetch<{ success: boolean; message: string }>(`/admin/admins/${id}`, {
        method: "DELETE",
      }),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: adminsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adminsKeys.lists() });
    },
  });
}
