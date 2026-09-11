"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { useListParams } from "@/hooks/use-list-params";
import { CAMPAIGN_FILTER_KEYS, useCampaignsQuery } from "@/hooks/use-campaigns";
import { isFiltered as hasFilters } from "@/lib/list-params";
import { humanise, platformLabel } from "@/lib/format";
import { CAMPAIGN_STATUSES } from "@/schemas/campaign";
import { SOCIAL_PLATFORMS } from "@/schemas/social-account";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { campaignColumns } from "@/components/campaigns/columns";

const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: humanise(value) }));

export function CampaignsTable() {
  const router = useRouter();
  const { params, setParams, reset } = useListParams(CAMPAIGN_FILTER_KEYS);
  const { data, isLoading, isFetching, error, refetch } = useCampaignsQuery(params);

  const meta = data?.pagination;

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={campaignColumns}
        data={data?.campaigns ?? []}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(campaign) => campaign.id}
        onRowClick={(campaign) => router.push(`/campaigns/${campaign.id}`)}
        emptyMessage={
          hasFilters(params) ? "No campaigns match these filters." : "No campaigns yet."
        }
        serverPagination={serverPaginationFor(params, meta, setParams)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: params.search,
              onChange: (search) => setParams({ search }),
              placeholder: "Search campaigns…",
            }}
            filters={[
              {
                id: "status",
                label: "Status",
                allLabel: "All statuses",
                value: params.filters.status ?? "",
                options: options(CAMPAIGN_STATUSES),
                onChange: (status) => setParams({ filters: { status } }),
              },
              {
                id: "platform",
                label: "Platform",
                allLabel: "All platforms",
                value: params.filters.platform ?? "",
                options: SOCIAL_PLATFORMS.map((value) => ({ value, label: platformLabel(value) })),
                onChange: (platform) => setParams({ filters: { platform } }),
              },
            ]}
            dateRange={{
              from: params.from,
              to: params.to,
              onChange: (range) => setParams(range),
            }}
            isFiltered={hasFilters(params)}
            onReset={reset}
          >
            <Button render={<Link href="/campaigns/new" />}>
              <Plus />
              New campaign
            </Button>
          </DataTableToolbar>
        )}
      />
    </QueryState>
  );
}
