"use client";

import { useListParams } from "@/hooks/use-list-params";
import {
  NOTIFICATION_FILTER_KEYS,
  useNotificationsQuery,
} from "@/hooks/use-notifications";
import { isFiltered as hasFilters } from "@/lib/list-params";
import { humanise } from "@/lib/format";
import { DELIVERY_STATUSES, NOTIFICATION_TYPES } from "@/schemas/notification";
import { DataTable } from "@/components/data-table/data-table";
import { serverPaginationFor } from "@/components/data-table/server-pagination";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { QueryState } from "@/components/shared/query-state";
import { CreatorScopeFilter } from "@/components/users/creator-scope-filter";
import { notificationColumns } from "@/components/notifications/columns";

const options = (values: readonly string[]) =>
  values.map((value) => ({ value, label: humanise(value) }));

/** "Gave up" rather than "failed", matching the badge in the rows below. */
const deliveryOptions = DELIVERY_STATUSES.map((value) => ({
  value,
  label: value === "failed" ? "Gave up" : humanise(value),
}));

/**
 * The outbox.
 *
 * Search covers the copy and `last_error` together, which is the API's own
 * doing and the point of the box: "show me everything failing the same way"
 * is the question this screen exists for, and the error text is the only
 * thing that groups those rows.
 *
 * Push and Email are separate dropdowns because the channels fail
 * independently - narrowing to "queued for push" while leaving email alone is
 * a real question that one combined control could not ask.
 */
export function NotificationsTable({ onSelect }: { onSelect: (id: string) => void }) {
  const { params, setParams, reset } = useListParams(NOTIFICATION_FILTER_KEYS);
  const { data, isLoading, isFetching, dataUpdatedAt, error, refetch } =
    useNotificationsQuery(params);

  const notifications = data?.notifications ?? [];
  const meta = data?.pagination;

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={notificationColumns}
        data={notifications}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(notification) => notification.id}
        onRowClick={(notification) => onSelect(notification.id)}
        emptyMessage={
          hasFilters(params)
            ? "No notifications match these filters."
            : "Nothing has been raised yet."
        }
        serverPagination={serverPaginationFor(params, meta, setParams)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: params.search,
              onChange: (search) => setParams({ search }),
              placeholder: "Search copy and errors...",
            }}
            filters={[
              {
                id: "type",
                label: "Type",
                allLabel: "All types",
                value: params.filters.type ?? "",
                options: options(NOTIFICATION_TYPES),
                onChange: (type) => setParams({ filters: { type } }),
              },
              {
                id: "push",
                label: "Push",
                allLabel: "Any push state",
                value: params.filters.push ?? "",
                options: deliveryOptions,
                onChange: (push) => setParams({ filters: { push } }),
              },
              {
                id: "email",
                label: "Email",
                allLabel: "Any email state",
                value: params.filters.email ?? "",
                options: deliveryOptions,
                onChange: (email) => setParams({ filters: { email } }),
              },
              {
                id: "read",
                label: "Opened",
                allLabel: "Opened or not",
                value: params.filters.read ?? "",
                options: [
                  { value: "true", label: "Opened" },
                  { value: "false", label: "Not opened" },
                ],
                onChange: (read) => setParams({ filters: { read } }),
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
            {/* `user_id` has no dropdown for the same reason it has none on
                withdrawals: creators are not a list you pick from. It arrives
                from "Notifications" on a creator's page. */}
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
