"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { formatCurrency, formatDateTime, humanise, orDash } from "@/lib/format";
import { useUserTransactionsQuery } from "@/hooks/use-users";
import type { Transaction } from "@/schemas/transaction";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { localPaginationFor } from "@/components/data-table/server-pagination";
import { QueryState } from "@/components/shared/query-state";

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "created_at",
    header: "When",
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </span>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.type === "earning" ? "secondary" : "outline"}>
        {humanise(row.original.type)}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      // Withdrawals leave the balance, earnings enter it. The API stores both
      // as positive figures, so the direction is carried by the type.
      const isDebit = row.original.type === "withdrawal";
      return (
        <span className={cn("tabular-nums", isDebit && "text-destructive")}>
          {isDebit ? "-" : "+"}
          {formatCurrency(row.original.amount)}
        </span>
      );
    },
  },
  {
    accessorKey: "balance_after",
    header: "Balance after",
    cell: ({ row }) => (
      <span className="tabular-nums">{formatCurrency(row.original.balance_after)}</span>
    ),
  },
  {
    accessorKey: "reference_type",
    header: "Reference",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {orDash(row.original.reference_type && humanise(row.original.reference_type))}
      </span>
    ),
  },
];

/**
 * The creator's ledger, paginated by the API. Page state is local rather than
 * in the URL: this is one panel inside a tab, and putting it in the address
 * bar would collide with the listing params the users table already owns.
 */
export function UserTransactions({ userId }: { userId: string }) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);

  const { data, isLoading, isFetching, error, refetch } = useUserTransactionsQuery(
    userId,
    page,
    limit
  );

  const meta = data?.pagination;

  return (
    <QueryState error={error} onRetry={() => void refetch()}>
      <DataTable
        columns={columns}
        data={data?.transactions ?? []}
        isLoading={isLoading && !data}
        isFetching={isFetching}
        getRowId={(transaction) => transaction.id}
        emptyMessage="This creator has no transactions yet."
        serverPagination={localPaginationFor(page, limit, meta, setPage, setLimit)}
      />
    </QueryState>
  );
}
