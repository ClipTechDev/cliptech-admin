import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { CAMPAIGN_FILTER_KEYS, campaignsListOptions } from "@/hooks/use-campaigns";
import { serverFetch } from "@/lib/api-server";
import { parseListParams } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { CampaignsTable } from "@/components/campaigns/campaigns-table";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, CAMPAIGN_FILTER_KEYS);

  const queryClient = getQueryClient();
  await queryClient
    .prefetchQuery(campaignsListOptions(params, serverFetch))
    .catch(() => undefined);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Campaigns"
        description="Every campaign and where its budget has got to. Open one to track its posts."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CampaignsTable />
      </HydrationBoundary>
    </div>
  );
}
