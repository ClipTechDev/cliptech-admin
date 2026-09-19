import { formatCurrency, formatNumber } from "@/lib/format";
import type {
  CampaignRollup,
  SubmissionRollup,
  UserRollup,
  WithdrawalRollup,
} from "@/schemas/dashboard";
import { StatCard, StatGrid } from "@/components/shared/stat-card";

/**
 * The four rollups, one component each.
 *
 * Each picks four figures out of a rollup that carries more, because the
 * point of the overview is what an admin should look at rather than
 * everything the API can say. The rest is a click away in the listing.
 */

export function CampaignsRollup({ rollup }: { rollup: CampaignRollup }) {
  return (
    <StatGrid>
      <StatCard
        label="Active"
        value={formatNumber(rollup.active)}
        hint={`${formatNumber(rollup.draft)} draft, ${formatNumber(
          rollup.pending_approval
        )} awaiting approval, ${formatNumber(rollup.ended)} ended`}
      />
      <StatCard
        label="Total budget"
        value={formatCurrency(rollup.total_budget)}
        hint="Across every campaign"
      />
      <StatCard
        label="Spent"
        value={formatCurrency(rollup.spent_amount)}
        hint={`${formatCurrency(rollup.accrued_amount)} accrued, not yet credited`}
      />
      <StatCard
        label="Remaining"
        value={formatCurrency(rollup.remaining_budget)}
        tone="muted"
        hint="Budget still uncommitted"
      />
    </StatGrid>
  );
}

export function SubmissionsRollup({ rollup }: { rollup: SubmissionRollup }) {
  return (
    <StatGrid>
      <StatCard
        label="Pending"
        value={formatNumber(rollup.pending)}
        hint={`${formatNumber(rollup.approved)} approved`}
      />
      <StatCard
        label="Not earning"
        value={formatNumber(rollup.rejected + rollup.invalidated)}
        tone="muted"
        hint={`${formatNumber(rollup.rejected)} rejected, ${formatNumber(
          rollup.invalidated
        )} invalidated`}
      />
      <StatCard
        label="Payable views"
        value={formatNumber(rollup.payable_views)}
        hint={`of ${formatNumber(rollup.raw_views)} raw`}
      />
      <StatCard
        label="Earned"
        value={formatCurrency(rollup.earnings)}
        hint={`${formatCurrency(rollup.credited)} credited`}
      />
    </StatGrid>
  );
}

export function UsersRollup({ rollup }: { rollup: UserRollup }) {
  return (
    <StatGrid>
      <StatCard label="Active" value={formatNumber(rollup.active)} />
      <StatCard
        label="New this week"
        value={formatNumber(rollup.new_this_week)}
        hint="Signed up in the last 7 days"
      />
      <StatCard
        label="Suspended"
        value={formatNumber(rollup.suspended)}
        tone="muted"
        hint="Cannot sign in"
      />
      <StatCard
        label="Banned"
        value={formatNumber(rollup.banned)}
        tone="muted"
        hint="Cannot sign in"
      />
    </StatGrid>
  );
}

export function WithdrawalsRollup({ rollup }: { rollup: WithdrawalRollup }) {
  return (
    <StatGrid>
      <StatCard
        label="Needs review"
        value={formatNumber(rollup.pending)}
        hint="New requests to approve or reject"
      />
      <StatCard
        label="Ready to pay"
        value={formatNumber(rollup.approved + rollup.processing)}
        hint={`${formatNumber(rollup.approved)} approved, ${formatNumber(
          rollup.processing
        )} being sent`}
      />
      <StatCard
        label="Still to pay"
        value={formatCurrency(rollup.open_amount)}
        hint="Owed on open requests, not sent yet"
      />
      <StatCard
        label="Paid out"
        value={formatCurrency(rollup.paid_amount)}
        tone="muted"
        hint={`${formatNumber(rollup.paid_count)} payments sent`}
      />
    </StatGrid>
  );
}
