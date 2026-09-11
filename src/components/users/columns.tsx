"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, formatDate, orDash } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import { useDeleteUserMutation } from "@/hooks/use-users";
import type { AdminUser } from "@/schemas/user";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserStatusBadge } from "@/components/users/user-status-badge";

function UserRowActions({ user }: { user: AdminUser }) {
  const router = useRouter();
  // Rendered as a sibling of the menu rather than nested in a menu item: the
  // menu unmounting on select would otherwise race the dialog opening.
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const deleteUser = useDeleteUserMutation();

  return (
    <div
      className="flex justify-end"
      // The row navigates on click; the actions column must not.
      onClick={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <span className="sr-only">Open menu for {user.name}</span>
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
            View details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigator.clipboard?.writeText(user.email)}
          >
            Copy email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${user.name}?`}
        description={`${user.email} will lose access immediately. The account is soft-deleted, so their submissions and ledger history are kept.`}
        confirmLabel="Delete user"
        onConfirm={async () => {
          await toast.promise(deleteUser.mutateAsync(user.id), {
            loading: `Deleting ${user.name}...`,
            success: `${user.name} deleted`,
            error: (error) => errorMessage(error),
          }).unwrap();
        }}
      />
    </div>
  );
}

/**
 * Columns for the users listing.
 *
 * Sorting is display-only here: cliptech-api orders every user listing by
 * `created_at DESC` and takes no sort parameter, so enabling per-column sort
 * would only reorder the current page and quietly lie about the rest.
 */
export const userColumns: ColumnDef<AdminUser>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <span onClick={(event) => event.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Select ${row.original.name}`}
        />
      </span>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link
        href={`/users/${row.original.id}`}
        className="font-medium hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {row.original.name || "Unnamed"}
      </Link>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <UserStatusBadge status={row.original.status} />,
    enableSorting: false,
  },
  {
    accessorKey: "country",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {orDash(row.original.country ?? row.original.country_code)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "available_balance",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{formatCurrency(row.original.available_balance)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "lifetime_earnings",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Lifetime" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{formatCurrency(row.original.lifetime_earnings)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.created_at)}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <UserRowActions user={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
