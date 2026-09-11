import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { clientFetch, type ApiFetcher } from "@/lib/api-client";
import { listParamsToQuery, type ListParams } from "@/lib/list-params";
import type {
  Campaign,
  CampaignFormValues,
  CampaignResponse,
  CampaignsListResponse,
  CampaignStatus,
  CREATABLE_STATUSES,
} from "@/schemas/campaign";
import { campaignCreatePayload, campaignFormDiff } from "@/schemas/campaign";
import type { SnapshotsResponse } from "@/schemas/payout";

/** The filters `/v1/admin/campaigns` accepts, alongside search and the dates. */
export const CAMPAIGN_FILTER_KEYS = ["status", "platform"] as const;

export const campaignsKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignsKeys.all, "list"] as const,
  list: (params: ListParams) =>
    [...campaignsKeys.lists(), listParamsToQuery(params)] as const,
  details: () => [...campaignsKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignsKeys.details(), id] as const,
  snapshots: (id: string, page: number) =>
    [...campaignsKeys.detail(id), "snapshots", page] as const,
};

export function campaignsListOptions(params: ListParams, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: campaignsKeys.list(params),
    queryFn: () =>
      fetcher<CampaignsListResponse>("/admin/campaigns", { query: listParamsToQuery(params) }),
    placeholderData: keepPreviousData,
  });
}

export function campaignDetailOptions(id: string, fetcher: ApiFetcher = clientFetch) {
  return queryOptions({
    queryKey: campaignsKeys.detail(id),
    queryFn: () => fetcher<CampaignResponse>(`/admin/campaigns/${id}`),
    select: (response: CampaignResponse) => response.campaign,
  });
}

/**
 * The campaign's own tracker history: each time spend crossed a threshold and
 * what was credited to creators at that point.
 */
export function campaignSnapshotsOptions(
  id: string,
  page: number,
  limit: number,
  fetcher: ApiFetcher = clientFetch
) {
  return queryOptions({
    queryKey: campaignsKeys.snapshots(id, page),
    queryFn: () =>
      fetcher<SnapshotsResponse>(`/admin/campaigns/${id}/snapshots`, {
        query: { page, limit },
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCampaignsQuery(params: ListParams) {
  return useQuery(campaignsListOptions(params));
}

export function useCampaignQuery(id: string) {
  return useQuery(campaignDetailOptions(id));
}

export function useCampaignSnapshotsQuery(id: string, page: number, limit = 20) {
  return useQuery(campaignSnapshotsOptions(id, page, limit));
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      status,
    }: {
      values: CampaignFormValues;
      status: (typeof CREATABLE_STATUSES)[number];
    }) =>
      clientFetch<CampaignResponse>("/admin/campaigns", {
        method: "POST",
        body: campaignCreatePayload(values, status),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
    },
  });
}

export function useUpdateCampaignMutation(campaign: Campaign) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CampaignFormValues) =>
      clientFetch<CampaignResponse>(`/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: campaignFormDiff(values, campaign),
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(campaignsKeys.detail(campaign.id), response);
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
    },
  });
}

/**
 * Uploads a banner image for a campaign. Multipart, not a JSON URL: the file
 * lands in the API's own bucket and comes back as `banner_url` on the campaign.
 *
 * The id travels with the call rather than the hook so the new-campaign form,
 * which only learns the id from the create response, can reuse it.
 */
export function useSetCampaignBannerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const body = new FormData();
      body.append("banner", file);
      return clientFetch<CampaignResponse>(`/admin/campaigns/${id}/banner`, {
        method: "PATCH",
        body,
      });
    },
    onSuccess: (response, { id }) => {
      queryClient.setQueryData(campaignsKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
    },
  });
}

/**
 * The lifecycle move. The UI only ever offers what `next_statuses` contains,
 * so a rejection here means the campaign changed underneath the page - which
 * is why the detail cache is replaced from the response rather than patched.
 */
export function useChangeCampaignStatusMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: CampaignStatus) =>
      clientFetch<CampaignResponse>(`/admin/campaigns/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(campaignsKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
    },
  });
}

/** Only from completed: an ended campaign still owes its creators money. */
export function useArchiveCampaignMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      clientFetch<CampaignResponse>(`/admin/campaigns/${id}/archive`, { method: "POST" }),
    onSuccess: (response) => {
      queryClient.setQueryData(campaignsKeys.detail(id), response);
      queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
    },
  });
}
