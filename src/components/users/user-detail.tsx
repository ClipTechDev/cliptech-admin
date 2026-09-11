"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Banknote, BellRing, FileVideo, MessageSquareWarning, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, formatDateTime, orDash } from "@/lib/format";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { useDeleteUserMutation, useUserQuery } from "@/hooks/use-users";
import { hasRole } from "@/schemas/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState, errorMessage } from "@/components/shared/query-state";
import { RelatedLinks } from "@/components/shared/related-links";
import { RecordActivity } from "@/components/shared/record-activity";
import { UserForm } from "@/components/users/user-form";
import { UserNoteForm } from "@/components/users/user-note-form";
import { UserPayoutMethods } from "@/components/users/user-payout-methods";
import { UserSocialAccounts } from "@/components/users/user-social-accounts";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { UserTransactions } from "@/components/users/user-transactions";

/**
 * One creator, across the endpoints the API exposes for them: the record
 * itself, its internal note, its ledger, its saved payout methods and its
 * connected platforms.
 *
 * The record is hydrated from the page's SSR prefetch; the two heavier panels
 * fetch on the client when their tab is first opened, since most visits to
 * this page are to change a status, not to read a ledger.
 *
 * Their posts, payouts and reports are not tabs here. Each of those is its own
 * listing that already filters by `user_id`, so they are links into it - which
 * costs no endpoint, keeps the full toolbar of the real screen, and means a
 * scoped view can be sent to somebody as a URL.
 */
export function UserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const { data: user, isLoading, error, refetch } = useUserQuery(userId);
  const { data: me } = useAdminMeQuery();
  const deleteUser = useDeleteUserMutation();

  // `role` is the grant cliptech-api requires for the listing behind the link,
  // matching the sidebar's table of sections.
  const related = [
    {
      role: "submissions",
      href: `/submissions?user_id=${userId}`,
      label: "Submissions",
      icon: FileVideo,
    },
    {
      role: "withdrawals",
      href: `/withdrawals?user_id=${userId}`,
      label: "Withdrawals",
      icon: Banknote,
    },
    {
      role: "feedback",
      href: `/feedback?user_id=${userId}`,
      label: "Feedback",
      icon: MessageSquareWarning,
    },
    {
      role: "notifications",
      href: `/notifications?user_id=${userId}`,
      label: "Notifications",
      icon: BellRing,
    },
  ];

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
      {user && (
        <div className="flex flex-1 flex-col gap-6">
          <PageHeader
            title={
              <span className="flex flex-wrap items-center gap-3">
                {user.name || "Unnamed creator"}
                <UserStatusBadge status={user.status} />
              </span>
            }
            description={user.email}
            actions={
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 />
                Delete
              </Button>
            }
          />

          {/* Hidden rather than shown and then 403'd, the way the sidebar
              treats a section - and permissive until /admin/me resolves, so
              the row doesn't fill in a moment after the page. */}
          <RelatedLinks
            label="This creator's records"
            links={related.filter((link) => !me || hasRole(me, link.role))}
          />

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "User ID", value: <code className="text-xs">{user.id}</code> },
                  {
                    label: "Email verified",
                    value: formatDateTime(user.email_verified_at),
                  },
                  { label: "Joined", value: formatDateTime(user.created_at) },
                  { label: "Last login", value: formatDateTime(user.last_login_at) },
                  {
                    label: "Country",
                    value: orDash(
                      [user.country, user.country_code].filter(Boolean).join(" · ")
                    ),
                  },
                  { label: "Last updated", value: formatDateTime(user.updated_at) },
                  {
                    label: "Available balance",
                    value: (
                      <span className="tabular-nums">
                        {formatCurrency(user.available_balance)}
                      </span>
                    ),
                  },
                  {
                    label: "Lifetime earnings",
                    value: (
                      <span className="tabular-nums">
                        {formatCurrency(user.lifetime_earnings)}
                      </span>
                    ),
                  },
                  {
                    label: "Total withdrawn",
                    value: (
                      <span className="tabular-nums">
                        {formatCurrency(user.total_withdrawn)}
                      </span>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <RecordActivity recordId={user.id} variant="card" />

          <Tabs defaultValue="profile" className="min-w-0">
            {/* The labels overflow a phone. The strip scrolls edge to edge
                rather than wrapping into two rows or shrinking to unreadable. */}
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="note">Internal note</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="payout-methods">Payout methods</TabsTrigger>
                <TabsTrigger value="social">Connected accounts</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="pt-4">
              <UserForm user={user} />
            </TabsContent>
            <TabsContent value="note" className="pt-4">
              <UserNoteForm user={user} />
            </TabsContent>
            {/* Base UI keeps inactive panels unmounted, so these two only
                fetch once their tab is actually opened. */}
            <TabsContent value="transactions" className="pt-4">
              <UserTransactions userId={user.id} />
            </TabsContent>
            <TabsContent value="payout-methods" className="pt-4">
              <UserPayoutMethods userId={user.id} />
            </TabsContent>
            <TabsContent value="social" className="pt-4">
              <UserSocialAccounts userId={user.id} />
            </TabsContent>
          </Tabs>

          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={`Delete ${user.name || user.email}?`}
            description="They lose access immediately. The account is soft-deleted, so submissions and ledger history are kept."
            confirmLabel="Delete user"
            onConfirm={async () => {
              await toast
                .promise(deleteUser.mutateAsync(user.id), {
                  loading: "Deleting...",
                  success: "User deleted",
                  error: (err) => errorMessage(err),
                })
                .unwrap();
              router.push("/users");
            }}
          />
        </div>
      )}
    </QueryState>
  );
}
