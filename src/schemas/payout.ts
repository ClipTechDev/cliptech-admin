import type { PageMeta } from "@/schemas/common";

/**
 * Mirrors payout.SnapshotResponse and payout.EntryResponse
 * (internal/features/payout/dto.go).
 *
 * A snapshot is the campaign's own tracker history: the moment it crossed a
 * spend threshold, and what was credited to creators at that point.
 */

export type Snapshot = {
  id: string;
  campaign_id: string;
  threshold_percent: number;
  /** A threshold crossing with no money attached - a marker, not a payout. */
  is_marker: boolean;

  total_budget: number;
  spent_before: number;
  amount_credited: number;
  spent_after: number;
  /**
   * The share of budget actually paid out, which is the meaningful figure when
   * threshold_percent is 100 because the campaign was settled rather than
   * because it exhausted its budget.
   */
  spent_percent: number;

  submission_count: number;
  total_raw_views: number;
  total_eligible_views: number;
  total_payable_views: number;

  reached_at: string;
};

export type SnapshotsResponse = {
  success: boolean;
  snapshots: Snapshot[];
  pagination: PageMeta;
};

/** One creator's share of one snapshot. */
export type SnapshotEntry = {
  id: string;
  snapshot_id: string;
  submission_id: string;
  user_id: string;

  raw_views: number;
  eligible_views: number;
  payable_views: number;

  earnings_total: number;
  amount_credited: number;
  transaction_id: string | null;

  created_at: string;
};

export type SnapshotEntriesResponse = {
  success: boolean;
  entries: SnapshotEntry[];
  pagination: PageMeta;
};

/**
 * What POST /admin/campaigns/:id/settle answers with. `snapshot` is absent
 * when the campaign had nothing left to credit - settling still retires it.
 */
export type SettleResponse = {
  success: boolean;
  message: string;
  credited: number;
  submissions: number;
  snapshot?: Snapshot;
};
