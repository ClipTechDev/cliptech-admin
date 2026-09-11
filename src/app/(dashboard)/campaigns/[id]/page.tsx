import { Suspense } from "react";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { campaignDetailOptions } from "@/hooks/use-campaigns";
import { ApiError } from "@/lib/api-client";
import { serverFetch } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { CampaignDetail } from "@/components/campaigns/campaign-detail";

/**
 * Only the campaign is prefetched. Its submissions and payout history are
 * behind tabs and filtered from the URL, so fetching them here would make
 * every visit pay for work most visits don't use.
 */
export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const queryClient = getQueryClient();
  // fetchQuery rather than prefetchQuery: prefetch swallows the failure, and a
  // 404 here means the id in the URL names nothing, which should be the app's
  // own not-found page inside the shell - not a detail screen rendering an
  // error panel where the record would have been. Every other failure is left
  // to the client query, whose 401/403 wording is the useful one.
  try {
    await queryClient.fetchQuery(campaignDetailOptions(id, serverFetch));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {/* CampaignDetail reads ?submission= to decide which post is open. */}
      <Suspense fallback={null}>
        <CampaignDetail campaignId={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
