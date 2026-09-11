import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import type { AdminMeResponse, LoginResponse, LoginValues } from "@/schemas/admin";

export const adminKeys = {
  all: ["admin"] as const,
  me: () => [...adminKeys.all, "me"] as const,
};

/**
 * The signed-in admin. This is the app's read of its own session: if it
 * resolves, the cookie is valid; if it 401s, it isn't.
 */
export function adminMeOptions(fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: adminKeys.me(),
    queryFn: () => fetcher<AdminMeResponse>("/admin/me"),
    select: (response: AdminMeResponse) => response.admin,
    // A wrong or expired cookie won't become right on a second attempt, and
    // retrying only delays the redirect to the login page.
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminMeQuery() {
  return useQuery(adminMeOptions());
}

/**
 * POST /v1/admin/auth/login. The session arrives as a Set-Cookie the proxy
 * re-hosts on this origin, so there is nothing to store client-side - the
 * response body is seeded into the `me` cache purely to save a round trip.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginValues) =>
      clientFetch<LoginResponse>("/admin/auth/login", {
        method: "POST",
        body: values,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(adminKeys.me(), { success: true, admin: response.admin });
    },
  });
}

/**
 * Signing out has to happen on the API: the cookie is HttpOnly, so clearing
 * anything locally would leave a session that still works. The cache is
 * dropped either way - a failed logout still means the admin wants out of
 * this browser, and the next request will 401 them to the login page.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      clientFetch<{ success: boolean; message: string }>("/admin/auth/logout", {
        method: "POST",
      }),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
