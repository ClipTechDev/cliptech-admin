"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatDateTime } from "@/lib/format";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { useAdminByIdQuery, useDeleteAdminMutation } from "@/hooks/use-admins";
import { SUPER_ADMIN_ROLE } from "@/schemas/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState, errorMessage } from "@/components/shared/query-state";
import { RelatedLinks } from "@/components/shared/related-links";
import { RecordActivity } from "@/components/shared/record-activity";
import { AdminForm } from "@/components/admins/admin-form";
import { AdminRoleBadges } from "@/components/admins/admin-roles";

export function AdminDetail({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { data: admin, isLoading, error, refetch } = useAdminByIdQuery(adminId);
  const { data: me } = useAdminMeQuery();
  const deleteAdmin = useDeleteAdminMutation();

  const isSelf = me?.id === adminId;
  // The action log is mounted behind RequireSuperAdmin rather than a role, so
  // this is the sidebar's check and not hasRole - which treats a super admin
  // as holding every role but says nothing about the reverse. Permissive until
  // /admin/me resolves, again like the sidebar.
  const canSeeActionLog = !me || me.roles.includes(SUPER_ADMIN_ROLE);

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
      {admin && (
        <div className="flex flex-1 flex-col gap-6">
          <PageHeader
            title={
              <span className="flex flex-wrap items-center gap-3">
                {admin.name}
                <Badge variant={admin.is_active ? "default" : "outline"}>
                  {admin.is_active ? "Active" : "Disabled"}
                </Badge>
                {isSelf && <Badge variant="secondary">You</Badge>}
              </span>
            }
            description={admin.email}
            actions={
              // Deleting yourself is refused by the API with a 409; there is
              // no point offering it. Action history is the other refusal, but
              // that isn't knowable from here - the error explains it.
              !isSelf && (
                <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                  <Trash2 />
                  Delete
                </Button>
              )
            }
          />

          {/* The audit trail already filters by `admin_id`; this is the way in
              from the person rather than from the log. */}
          <RelatedLinks
            label="This admin's activity"
            links={
              canSeeActionLog
                ? [
                    {
                      href: `/action-logs?admin_id=${admin.id}`,
                      label: "Action log",
                      icon: ScrollText,
                    },
                  ]
                : []
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Admin ID", value: <code className="text-xs">{admin.id}</code> },
                  { label: "Created", value: formatDateTime(admin.created_at) },
                  { label: "Last login", value: formatDateTime(admin.last_login_at) },
                  {
                    label: "Two-factor",
                    value: admin.two_factor_enabled ? "Enabled" : "Disabled",
                  },
                  {
                    label: "Roles",
                    value: <AdminRoleBadges roles={admin.roles} />,
                    wide: true,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <RecordActivity recordId={admin.id} variant="card" />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Edit</h2>
            <AdminForm admin={admin} />
          </div>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={`Delete ${admin.name}?`}
            description="They lose access immediately. If they have any recorded actions the API will refuse - deactivate them instead, so the audit trail keeps pointing at a real account."
            confirmLabel="Delete admin"
            onConfirm={async () => {
              await toast
                .promise(deleteAdmin.mutateAsync(admin.id), {
                  loading: "Deleting...",
                  success: "Admin deleted",
                  error: (err) => errorMessage(err),
                })
                .unwrap();
              router.push("/admins");
            }}
          />
        </div>
      )}
    </QueryState>
  );
}
