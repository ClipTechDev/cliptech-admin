"use client";

import { useListParams } from "@/hooks/use-list-params";
import { ACTION_LOG_FILTER_KEYS, useActionLogsQuery } from "@/hooks/use-action-logs";
import { useAdminOptionsQuery } from "@/hooks/use-admins";
import { isFiltered as hasFilters } from "@/lib/list-params";
import { humanise } from "@/lib/format";
import { ADMIN_ACTIONS } from "@/schemas/action-log";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { actionLogColumns } from "@/components/action-logs/columns";

const actionOptions = ADMIN_ACTIONS.map((action) => ({
  value: action,
  label: humanise(action),
}));

/**
 * The audit trail.
 *
 * Search matches the summary text, which is where every detail lives - a
 * withdrawal id, a creator id, the name of the settings field that moved. It
 * is the only column worth searching, and searching it is how you answer "who
 * touched this record".
 *
 * The other direction - "what has this admin done" - is the `admin_id` filter,
 * which gets a real dropdown rather than a chip: the team is a short, bounded
 * list, so it can be offered as names to choose from. An admin's own page
 * links in here too, for the case where you start from the person.
 */
export function ActionLogsTable() {
  const { params, setParams, reset } = useListParams(ACTION_LOG_FILTER_KEYS);
  const { data, isLoading, isFetching, error, refetch } = useActionLogsQuery(params);

  const logs = data?.logs ?? [];
  const meta = data?.pagination;

  // Names for the "By" dropdown. A failure is ignored on purpose - the filter
  // still works from an id in the URL - which is why this reads the query's
  // data and not its error.
  const { data: adminsData } = useAdminOptionsQuery();
  const selectedAdmin = params.filters.admin_id ?? "";
  const adminOptions = (adminsData?.admins ?? []).map((admin) => ({
    value: admin.id,
    label: admin.name,
  }));
  // A log opened from an admin's page can name someone the capped list above
  // missed, or one since deleted. Carrying the id as its own option stops the
  // dropdown from reading "All admins" while a filter is on.
  if (selectedAdmin && !adminOptions.some((option) => option.value === selectedAdmin)) {
    adminOptions.unshift({
      value: selectedAdmin,
      label: `Admin ${selectedAdmin.slice(0, 8)}`,
    });
  }

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={actionLogColumns}
        data={logs}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(log) => log.id}
        emptyMessage={
          hasFilters(params)
            ? "No entries match these filters."
            : "Nothing has been recorded yet."
        }
        serverPagination={serverPaginationFor(params, meta, setParams)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: params.search,
              onChange: (search) => setParams({ search }),
              placeholder: "Search summaries, ids...",
            }}
            filters={[
              {
                id: "action",
                label: "Action",
                allLabel: "All actions",
                value: params.filters.action ?? "",
                options: actionOptions,
                onChange: (action) => setParams({ filters: { action } }),
              },
              {
                id: "admin_id",
                label: "By",
                allLabel: "All admins",
                value: selectedAdmin,
                options: adminOptions,
                onChange: (admin_id) => setParams({ filters: { admin_id } }),
              },
            ]}
            dateRange={{
              from: params.from,
              to: params.to,
              onChange: (range) => setParams(range),
            }}
            isFiltered={hasFilters(params)}
            onReset={reset}
          />
        )}
      />
    </QueryState>
  );
}
