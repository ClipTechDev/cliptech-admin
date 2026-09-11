"use client";

import { useListParams } from "@/hooks/use-list-params";
import { FEEDBACK_FILTER_KEYS, useFeedbackListQuery } from "@/hooks/use-feedback";
import { isFiltered as hasFilters } from "@/lib/list-params";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { CreatorScopeFilter } from "@/components/users/creator-scope-filter";
import { feedbackColumns } from "@/components/feedback/columns";

/**
 * The support inbox.
 *
 * Search hits the description text, which is the only field worth matching
 * words against. There are no status or category filters because feedback has
 * neither - the API stores what the creator wrote and nothing else, so this
 * is a date range, a search box, and the one filter the endpoint does take:
 * `user_id`, set by following "Feedback" from a creator's page and shown here
 * as a chip naming them.
 */
export function FeedbackTable({ onSelect }: { onSelect: (id: string) => void }) {
  const { params, setParams, reset } = useListParams(FEEDBACK_FILTER_KEYS);
  const { data, isLoading, isFetching, error, refetch } = useFeedbackListQuery(params);

  const entries = data?.feedback ?? [];
  const meta = data?.pagination;

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={feedbackColumns}
        data={entries}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(entry) => entry.id}
        onRowClick={(entry) => onSelect(entry.id)}
        emptyMessage={
          hasFilters(params)
            ? "No feedback matches these filters."
            : "No creator has sent feedback yet."
        }
        serverPagination={serverPaginationFor(params, meta, setParams)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: params.search,
              onChange: (search) => setParams({ search }),
              placeholder: "Search what they wrote...",
            }}
            dateRange={{
              from: params.from,
              to: params.to,
              onChange: (range) => setParams(range),
            }}
            isFiltered={hasFilters(params)}
            onReset={reset}
          >
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
