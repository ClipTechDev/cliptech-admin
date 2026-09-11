import type { PageMeta } from "@/schemas/common";
import type { SocialPlatform } from "@/schemas/social-account";

/**
 * Mirrors submission.Response and submission.LogResponse in cliptech-api
 * (internal/features/submission/dto.go).
 */

export const SUBMISSION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "flagged",
  "invalidated",
] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/**
 * Where a post's money has got to. A different axis from status: an approved
 * post can be unpaid, part paid, or fully settled.
 */
export const PAYMENT_STATUSES = ["unpaid", "pending", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Mirrors `allowed_submission_invalid_reasons` in cliptech-api's config.yaml.
 * The column is a plain VARCHAR, so this list is the only thing keeping the
 * values consistent - and the API rejects anything outside its own copy.
 */
export const INVALID_REASONS = [
  "post_deleted",
  "post_private",
  "post_edited",
  "ownership_mismatch",
  "duplicate_submission",
  "account_disconnected",
  "account_auth_failed",
  "campaign_ended",
  "below_minimum_views",
  "fraudulent_views",
] as const;

export type InvalidReason = (typeof INVALID_REASONS)[number];

export type Submission = {
  id: string;
  campaign_id: string;
  campaign_name: string;
  user_id: string;
  social_account_id: string;

  platform: SocialPlatform;
  post_url: string;
  platform_post_id: string;

  /** Frozen at submission time; views below this were not earned here. */
  starting_views: number;
  raw_views: number;
  eligible_views: number;
  payable_views: number;

  earnings: number;
  credited_amount: number;
  /** earnings - credited: earned but not yet paid out by a snapshot. */
  pending_amount: number;

  status: SubmissionStatus;
  invalid_reason: string | null;
  invalidated_at: string | null;
  /** Also carries the note when a post is flagged, not only when rejected. */
  rejection_reason: string | null;

  submitted_at: string;
  last_tracked_at: string | null;
  next_tracking_at: string | null;
};

export type SubmissionsListResponse = {
  success: boolean;
  submissions: Submission[];
  pagination: PageMeta;
};

export type SubmissionResponse = {
  success: boolean;
  message?: string;
  submission: Submission;
};

/**
 * One tracking poll. A row exists for every attempt including failures - the
 * point of the table is the history, so a gap would misrepresent what was
 * known when. `raw_views` is what the provider actually returned and can fall
 * below an earlier reading; earnings only ever ratchet up.
 */
export type ViewLog = {
  id: string;
  raw_views: number;
  eligible_views: number;
  payable_views: number;
  earnings: number;
  cpm: number;
  fetch_error: string | null;
  tracked_at: string;
};

export type ViewLogsResponse = {
  success: boolean;
  logs: ViewLog[];
  pagination: PageMeta;
};

/** Only a pending submission can be approved, rejected or invalidated. */
export function canReview(submission: Submission): boolean {
  return submission.status === "pending";
}

/** ErrNotFlaggable: only an approved or pending post can be set aside. */
export function canFlag(submission: Submission): boolean {
  return submission.status === "approved" || submission.status === "pending";
}
