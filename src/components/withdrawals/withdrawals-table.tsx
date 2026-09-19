"use client";

import { useListParams } from "@/hooks/use-list-params";
import { WITHDRAWAL_FILTER_KEYS, useWithdrawalsQuery } from "@/hooks/use-withdrawals";
import { isFiltered as hasFilters } from "@/lib/list-params";
import {
  OPEN_WITHDRAWALS_FILTER,
  WITHDRAWAL_METHODS,
  WITHDRAWAL_STATUSES,
  WITHDRAWAL_STATUS_LABELS,
  withdrawalMethodLabel,
} from "@/schemas/withdrawal";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { CreatorScopeFilter } from "@/components/users/creator-scope-filter";
import { withdrawalColumns } from "@/components/withdrawals/columns";

const statusOptions = [
  { value: OPEN_WITHDRAWALS_FILTER, label: "Still to pay (all open)" },
  ...WITHDRAWAL_STATUSES.map((status) => ({
    value: status,
    label: WITHDRAWAL_STATUS_LABELS[status],
  })),
];

const methodOptions = WITHDRAWAL_METHODS.map((method) => ({
  value: method,
  label: withdrawalMethodLabel(method),
}));

/**
 * The payout queue.
 *
 * No search box: the API's withdrawal listing takes `user_id`, `status`,
 * `method` and the date pair, and no free-text search - there is nothing on a
 * payout request worth matching words against. Offering one that silently did
 * nothing would be worse than not having it.
 *
 * `user_id` is the fourth filter and has no dropdown, because creators aren't
 * a list you pick from. It arrives from the link on a creator's own page -
 * "every payout for this creator" - and shows here as a chip that names them
 * and can be taken off.
 */
export function WithdrawalsTable({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { params, setParams, reset } = useListParams(WITHDRAWAL_FILTER_KEYS);
  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } =
    useWithdrawalsQuery(params);

  const withdrawals = data?.withdrawals ?? [];
  const meta = data?.pagination;

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={withdrawalColumns}
        data={withdrawals}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(withdrawal) => withdrawal.id}
        onRowClick={(withdrawal) => onSelect(withdrawal.id)}
        emptyMessage={
          hasFilters(params)
            ? "No payout requests match these filters."
            : "No creator has asked to be paid yet."
        }
        serverPagination={serverPaginationFor(params, meta, setParams)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            filters={[
              {
                id: "status",
                label: "Status",
                allLabel: "All statuses",
                value: params.filters.status ?? "",
                options: statusOptions,
                onChange: (status) => setParams({ filters: { status } }),
              },
              {
                id: "method",
                label: "Method",
                allLabel: "All methods",
                value: params.filters.method ?? "",
                options: methodOptions,
                onChange: (method) => setParams({ filters: { method } }),
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
