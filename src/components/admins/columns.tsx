"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { formatDate, formatDateTime } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { useDeleteAdminMutation } from "@/hooks/use-admins";
import type { Admin } from "@/schemas/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AdminRoleBadges } from "@/components/admins/admin-roles";

function AdminRowActions({ admin }: { admin: Admin }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { data: me } = useAdminMeQuery();
  const deleteAdmin = useDeleteAdminMutation();

  // The API refuses this with a 409 anyway; disabling it here just stops the
  // admin discovering that by way of an error dialog.
  const isSelf = me?.id === admin.id;

  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <span className="sr-only">Open menu for {admin.name}</span>
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/admins/${admin.id}`)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(admin.email)}>
            Copy email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onClick={() => setConfirmOpen(true)}
          >
            {isSelf ? "Delete (that's you)" : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${admin.name}?`}
        description="They lose access immediately. If they have any recorded actions the API will refuse - deactivate them instead, so the audit trail keeps pointing at a real account."
        confirmLabel="Delete admin"
        onConfirm={async () => {
          await toast
            .promise(deleteAdmin.mutateAsync(admin.id), {
              loading: `Deleting ${admin.name}...`,
              success: `${admin.name} deleted`,
              error: (error) => errorMessage(error),
            })
            .unwrap();
        }}
      />
    </div>
  );
}

/**
 * Columns for the admins listing. Sorting is display-only, as with users: the
 * API orders by `created_at DESC` and accepts no sort parameter.
 */
export const adminColumns: ColumnDef<Admin>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <Link
        href={`/admins/${row.original.id}`}
        className="font-medium hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {row.original.name}
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
    accessorKey: "roles",
    header: "Roles",
    cell: ({ row }) => <AdminRoleBadges roles={row.original.roles} />,
    enableSorting: false,
  },
  {
    accessorKey: "is_active",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={row.original.is_active ? "default" : "outline"}>
        {row.original.is_active ? "Active" : "Disabled"}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "two_factor_enabled",
    header: "2FA",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.two_factor_enabled ? "On" : "Off"}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "last_login_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last login" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.last_login_at)}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.created_at)}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => <AdminRowActions admin={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
