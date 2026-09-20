import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clientFetch } from "@/lib/api-client";
import { campaignsKeys } from "@/hooks/use-campaigns";
import { dashboardKeys } from "@/hooks/use-dashboard";
import type {
  CampaignMemberResponse,
  CampaignMembersResponse,
  CampaignMemberStatus,
  ReevaluateResponse,
  RuleTypeResponse,
  RuleTypesResponse,
} from "@/schemas/eligibility";

export const eligibilityKeys = {
  ruleTypes: ["eligibility-rule-types"] as const,
  allMembers: ["campaign-members"] as const,
  members: (campaignId: string) => ["campaign-members", campaignId] as const,
  memberList: (campaignId: string, status: string, page: number) =>
    [...eligibilityKeys.members(campaignId), status, page] as const,
};

export function useRuleTypesQuery() {
  return useQuery({
    queryKey: eligibilityKeys.ruleTypes,
    queryFn: () => clientFetch<RuleTypesResponse>("/admin/eligibility-rule-types"),
    select: (response: RuleTypesResponse) => response.rule_types,
  });
}

export function useUpdateRuleTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      key,
      body,
    }: {
      key: string;
      body: { label?: string; description?: string; is_active?: boolean };
    }) =>
      clientFetch<RuleTypeResponse>(`/admin/eligibility-rule-types/${key}`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eligibilityKeys.ruleTypes });
    },
  });
}

export function useCampaignMembersQuery(
  campaignId: string | null,
  status: CampaignMemberStatus | "",
  page: number
) {
  return useQuery({
    queryKey: eligibilityKeys.memberList(campaignId ?? "all", status, page),
    queryFn: () =>
      clientFetch<CampaignMembersResponse>(
        campaignId ? `/admin/campaigns/${campaignId}/members` : "/admin/campaign-members",
        { query: { status: status || undefined, page, limit: 20 } }
      ),
  });
}

function useMemberAction<TBody>(action: "approve" | "reject" | "remove") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: TBody }) =>
      clientFetch<CampaignMemberResponse>(`/admin/campaign-members/${id}/${action}`, {
        method: "PATCH",
        ...(body !== undefined ? { body } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eligibilityKeys.allMembers });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.admin() });
    },
  });
}

export function useApproveMember() {
  return useMemberAction<never>("approve");
}

export function useRejectMember() {
  return useMemberAction<{ reason: string }>("reject");
}

export function useRemoveMember() {
  return useMemberAction<{ reason: string }>("remove");
}

export function useReevaluateMembers(campaignId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      clientFetch<ReevaluateResponse>(`/admin/campaigns/${campaignId}/members/reevaluate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eligibilityKeys.members(campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignsKeys.detail(campaignId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.admin() });
    },
  });
}
