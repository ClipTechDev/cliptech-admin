"use client";

import { useRouter } from "next/navigation";

import { useListParams } from "@/hooks/use-list-params";
import { USER_FILTER_KEYS, useUsersQuery } from "@/hooks/use-users";
import { isFiltered as hasFilters } from "@/lib/list-params";
import { humanise } from "@/lib/format";
import { USER_STATUSES } from "@/schemas/user";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { userColumns } from "@/components/users/columns";

const statusOptions = USER_STATUSES.map((status) => ({
  value: status,
  label: humanise(status),
}));

/**
 * The users listing.
 *
 * Reads its filters from the URL, which is the same place the Server
 * Component read them to build its prefetch - so the first paint is already
 * the right page, and every later change is a normal client fetch keyed on
 * the same params.
 */
export function UsersTable() {
  const router = useRouter();
  const { params, setParams, reset } = useListParams(USER_FILTER_KEYS);
  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } =
    useUsersQuery(params);

  const users = data?.users ?? [];
  const meta = data?.pagination;

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={userColumns}
        data={users}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(user) => user.id}
        onRowClick={(user) => router.push(`/users/${user.id}`)}
        emptyMessage={
          hasFilters(params)
            ? "No users match these filters."
            : "No users have signed up yet."
        }
        serverPagination={serverPaginationFor(params, meta, setParams)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: params.search,
              onChange: (search) => setParams({ search }),
              placeholder: "Search name or email...",
            }}
            filters={[
              {
                id: "status",
                label: "Status",
                allLabel: "All statuses",
                value: params.filters.status ?? "",
                options: statusOptions,
                onChange: (status) => setParams({ filters: { status } }),
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
          />
        )}
      />
    </QueryState>
  );
}
