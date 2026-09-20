/**
 * Mirrors dashboard.AdminResponse and the rollups it embeds
 * (internal/features/dashboard/dto.go, repository.go).
 *
 * Grouped rather than flat, the way the API sends it: an admin reads the
 * overview a section at a time, and each section answers one question.
 */

export type UserRollup = {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  /** Signups in the last seven days - a cheap read on whether growth moves. */
  new_this_week: number;
};

export type CampaignRollup = {
  total: number;
  active: number;
  ended: number;
  total_budget: number;
  spent_amount: number;
  accrued_amount: number;
  remaining_budget: number;
  /** Not yet public. The API names this `draft` on the wire. */
  draft: number;
  pending_approval: number;
};

export type SubmissionRollup = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  invalidated: number;

  raw_views: number;
  eligible_views: number;
  payable_views: number;

  earnings: number;
  credited: number;
};

export type WithdrawalRollup = {
  pending: number;
  approved: number;
  processing: number;
  /** Every request still in flight: debited from balances, not yet sent. */
  open_amount: number;
  paid_amount: number;
  paid_count: number;
};

export type AdminDashboard = {
  users: UserRollup;
  campaigns: CampaignRollup;
  submissions: SubmissionRollup;
  withdrawals: WithdrawalRollup;
  /**
   * Money owed to creators but not yet credited - the gap between what the
   * posts have accrued and what has been paid out. It is the figure that says
   * how much the next settlement will move.
   */
  pending_earnings: number;
  pending_join_requests: number;
};

export type AdminDashboardResponse = {
  success: boolean;
  dashboard: AdminDashboard;
};

/** Requests waiting on an admin, which is what the payout queue badge counts. */
export function openWithdrawals(rollup: WithdrawalRollup): number {
  return rollup.pending + rollup.approved + rollup.processing;
}
