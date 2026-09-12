"use client";

import * as React from "react";

import { useListParams } from "@/hooks/use-list-params";
import {
  SUBMISSION_FILTER_KEYS,
  useSubmissionUsers,
  useSubmissionsQuery,
} from "@/hooks/use-submissions";
import { isFiltered as hasFilters, type ListParams } from "@/lib/list-params";
import { humanise, platformLabel } from "@/lib/format";
import { PAYMENT_STATUSES, SUBMISSION_STATUSES } from "@/schemas/submission";
import { SOCIAL_PLATFORMS } from "@/schemas/social-account";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { CreatorScopeFilter } from "@/components/users/creator-scope-filter";
import { submissionColumns } from "@/components/submissions/columns";

const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: humanise(value) }));

/**
 * The submissions listing, used both standalone and inside a campaign.
 *
 * `campaignId` pins the listing to one campaign by forcing the filter the API
 * already accepts, rather than needing a second endpoint - and it is set on
 * the params before the query key is built, so the campaign's table can never
 * share a cache entry with the global one.
 */
export function SubmissionsTable({
  campaignId,
  onSelect,
}: {
  campaignId?: string;
  onSelect: (submissionId: string) => void;
}) {
  const { params, setParams, reset } = useListParams(SUBMISSION_FILTER_KEYS);

  const scoped: ListParams = React.useMemo(
    () =>
      campaignId
        ? { ...params, filters: { ...params.filters, campaign_id: campaignId } }
        : params,
    [params, campaignId]
  );

  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } =
    useSubmissionsQuery(scoped);
  const submissions = data?.submissions ?? [];
  const meta = data?.pagination;

  const creators = useSubmissionUsers(submissions.map((submission) => submission.user_id));
  // The lookup is a fresh Map on every render, so memoising on its identity
  // would rebuild the columns each time and hand TanStack Table a new array.
  // Its contents only change as names resolve, which a signature captures.
  const creatorSignature = Array.from(creators.keys()).sort().join(",");
  const columns = React.useMemo(
    () => submissionColumns(creators),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [creatorSignature]
  );

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={columns}
        data={submissions}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(submission) => submission.id}
        onRowClick={(submission) => onSelect(submission.id)}
        emptyMessage={
          hasFilters(params)
            ? "No submissions match these filters."
            : "No posts have been submitted yet."
        }
        serverPagination={serverPaginationFor(params, meta, setParams)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            /* No search box: submission.ListFilters has no Search field, so
               the API would silently ignore ?search and the box would look
               broken. Narrowing here is by status, platform, payment and date. */
            filters={[
              {
                id: "status",
                label: "Status",
                allLabel: "All statuses",
                value: params.filters.status ?? "",
                options: options(SUBMISSION_STATUSES),
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
              {
                id: "payment_status",
                label: "Payment",
                allLabel: "Any payment",
                value: params.filters.payment_status ?? "",
                options: options(PAYMENT_STATUSES),
                onChange: (payment_status) => setParams({ filters: { payment_status } }),
              },
            ]}
            dateRange={{
              from: params.from,
              to: params.to,
              onChange: (range) => setParams(range),
            }}
            refresh={{
              onRefresh: () => void refetch(),
              isRefreshing: isFetching,
              updatedAt: dataUpdatedAt,
            }}
            isFiltered={hasFilters(params)}
            onReset={reset}
          >
            {/* `user_id` is the other filter the endpoint takes and the other
                one with no dropdown - it comes from "Submissions" on a
                creator's page, and needs to be visible here or a scoped table
                reads as the whole table. */}
            {params.filters.user_id && (
              <CreatorScopeFilter
                userId={params.filters.user_id}
                onClear={() => setParams({ filters: { user_id: "" } })}
              />
            )}
          </DataTableToolbar>
        )}
      />
    </QueryState>
  );
}
