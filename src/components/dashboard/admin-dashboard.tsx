"use client";

import { Banknote, FileVideo, Megaphone, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useAdminDashboardQuery } from "@/hooks/use-dashboard";
import { openWithdrawals, type AdminDashboard as Overview } from "@/schemas/dashboard";
import { QueryState } from "@/components/shared/query-state";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { QueueCard } from "@/components/dashboard/queue-card";
import {
  CampaignsRollup,
  SubmissionsRollup,
  UsersRollup,
  WithdrawalsRollup,
} from "@/components/dashboard/dashboard-rollups";

/**
 * The operations overview.
 *
 * Ordered by what needs a decision rather than by what is biggest: the two
 * queues an admin works through - posts awaiting review and payouts awaiting
 * a transfer - lead, because those are the numbers that mean somebody is
 * waiting. The rollups that are context follow.
 */
export function AdminDashboard() {
  const { data, isLoading, error, refetch } = useAdminDashboardQuery();

  return (
    <QueryState
      isLoading={isLoading && !data}
      loadingFallback={<DashboardSkeleton />}
      error={error}
      onRetry={() => void refetch()}
    >
      {data && (
        <div className="flex min-w-0 flex-col gap-8">
          <Queues overview={data} />

          <DashboardSection
            title="Campaigns"
            icon={Megaphone}
            href="/campaigns"
            count={data.campaigns.total}
          >
            <CampaignsRollup rollup={data.campaigns} />
          </DashboardSection>

          <DashboardSection
            title="Submissions"
            icon={FileVideo}
            href="/submissions"
            count={data.submissions.total}
          >
            <SubmissionsRollup rollup={data.submissions} />
          </DashboardSection>

          <DashboardSection
            title="Creators"
            icon={Users}
            href="/users"
            count={data.users.total}
          >
            <UsersRollup rollup={data.users} />
          </DashboardSection>

          <DashboardSection
            title="Payouts"
            icon={Banknote}
            href="/withdrawals"
            count={openWithdrawals(data.withdrawals)}
            countLabel="open"
          >
            <WithdrawalsRollup rollup={data.withdrawals} />
          </DashboardSection>
        </div>
      )}
    </QueryState>
  );
}

/**
 * The two work queues, given their own row above everything else.
 *
 * Pending earnings sits with them because it is the third number that moves
 * when somebody acts: it is what the next settlement will shift out of the
 * platform and into creators' balances.
 */
function Queues({ overview }: { overview: Overview }) {
  const { campaigns, submissions, withdrawals, pending_earnings: pendingEarnings } = overview;
  const awaitingApproval = campaigns.pending_approval;

  return (
    <div
      className={cn(
        "grid gap-3",
        awaitingApproval > 0 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
      )}
    >
      {awaitingApproval > 0 && (
        <QueueCard
          label="Campaigns to approve"
          value={formatNumber(awaitingApproval)}
          hint="Budget over the limit, waiting on a super admin"
          href="/campaigns?status=pending_approval"
          urgent
        />
      )}
      <QueueCard
        label="Posts awaiting review"
        value={formatNumber(submissions.pending)}
        hint={
          submissions.pending === 0
            ? "Nothing in the queue"
            : "Not yet approved or rejected"
        }
        href="/submissions?status=pending"
        urgent={submissions.pending > 0}
      />
      <QueueCard
        label="Payouts in flight"
        value={formatNumber(openWithdrawals(withdrawals))}
        hint={`${formatCurrency(withdrawals.open_amount)} debited, not yet sent`}
        href="/withdrawals?status=pending"
        urgent={withdrawals.pending > 0}
      />
      <QueueCard
        label="Owed to creators"
        value={formatCurrency(pendingEarnings)}
        hint="Earned but not yet credited"
        href="/campaigns"
      />
    </div>
  );
}
