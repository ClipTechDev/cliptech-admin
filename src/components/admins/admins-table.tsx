"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

import { useListParams } from "@/hooks/use-list-params";
import { ADMIN_FILTER_KEYS, useAdminsQuery } from "@/hooks/use-admins";
import { isFiltered as hasFilters } from "@/lib/list-params";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { adminColumns } from "@/components/admins/columns";
import { roleFilterOptions } from "@/components/admins/admin-roles";

const activeOptions = [
  { value: "true", label: "Active" },
  { value: "false", label: "Disabled" },
];

export function AdminsTable() {
  const router = useRouter();
  const { params, setParams, reset } = useListParams(ADMIN_FILTER_KEYS);
  const { data, isLoading, isFetching, error, refetch } = useAdminsQuery(params);

  const meta = data?.pagination;

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={adminColumns}
        data={data?.admins ?? []}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(admin) => admin.id}
        onRowClick={(admin) => router.push(`/admins/${admin.id}`)}
        emptyMessage={
          hasFilters(params) ? "No admins match these filters." : "No admin accounts yet."
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
                id: "role",
                label: "Role",
                allLabel: "All roles",
                value: params.filters.role ?? "",
                options: roleFilterOptions,
                onChange: (role) => setParams({ filters: { role } }),
              },
              {
                id: "is_active",
                label: "Status",
                allLabel: "All statuses",
                value: params.filters.is_active ?? "",
                options: activeOptions,
                onChange: (is_active) => setParams({ filters: { is_active } }),
              },
            ]}
            isFiltered={hasFilters(params)}
            onReset={reset}
          >
            <Button render={<Link href="/admins/new" />}>
              <UserPlus />
              New admin
            </Button>
          </DataTableToolbar>
        )}
      />
    </QueryState>
  );
}
