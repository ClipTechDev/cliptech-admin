"use client";

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import type { PageMeta } from "@/schemas/common";
import type { SocialAccount, SocialClaim } from "@/schemas/social-account";
import { usersKeys } from "@/hooks/use-users";

export const socialClaimsKeys = {
  all: ["social-claims"] as const,
  list: (page: number) => [...socialClaimsKeys.all, "list", page] as const,
};

type SocialClaimsResponse = {
  success: boolean;
  claims: SocialClaim[];
  pagination: PageMeta;
};

/**
 * GET /v1/admin/social/claims - the bio-code verifications creators currently
 * have open, behind the "users" role rather than super admin: the tickets this
 * answers ("somebody else has claimed my handle", "my code will not verify")
 * are support's, not the integration owner's.
 */
export function socialClaimsOptions(page = 1, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: socialClaimsKeys.list(page),
    queryFn: () =>
      fetcher<SocialClaimsResponse>(`/admin/social/claims?page=${page}`),
  });
}

export function useSocialClaimsQuery(page = 1) {
  return useQuery(socialClaimsOptions(page));
}

/**
 * Releasing a claim frees the handle for whoever actually owns it. It does not
 * disconnect anything: an unverified claim has never been an account.
 */
export function useReleaseClaimMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      clientFetch<{ success: boolean }>(`/admin/social/claims/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialClaimsKeys.all });
    },
  });
}

/**
 * Re-checks one code-verified account against its public profile now, instead
 * of waiting for the sweep — so support can confirm a fix while the creator is
 * still on the line. It can come back with the account marked auth_failed,
 * which is a successful request reporting a real answer, not an error.
 */
export function useReverifyAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      clientFetch<{ success: boolean; account: SocialAccount }>(
        `/admin/social/accounts/${accountId}/reverify`,
        { method: "POST" }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}
