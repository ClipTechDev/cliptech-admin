import type { PageMeta } from "@/schemas/common";

/**
 * Mirrors notification.AdminResponse (internal/features/notification/admin_dto.go).
 *
 * The creator's own DTO hides all of this on purpose - whether the email
 * bounced is not their problem. The admin view is the opposite: it exists to
 * answer why somebody was not told, so it carries the attempt counters, the
 * markers and whatever came back from FCM or the mailer.
 */

/** Mirrors `allowed_notification_types` in cliptech-api's config.yaml. */
export const NOTIFICATION_TYPES = [
  "campaign_launched",
  "campaign_ending_soon",
  "campaign_ended",
  "submission_approved",
  "submission_rejected",
  "submission_invalidated",
  "earnings_credited",
  "withdrawal_approved",
  "withdrawal_paid",
  "withdrawal_rejected",
  "withdrawal_failed",
  "withdrawal_cancelled",
  "social_account_disconnected",
  "social_account_auth_failed",
  "account_suspended",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Mirrors notification.DeliveryStatuses(), in the same order - what is stuck
 * first, what is done last.
 *
 * These are derived by the API from the row's marker and its attempt counter
 * rather than stored, so they always agree with what the dispatch worker will
 * actually pick up.
 */
export const DELIVERY_STATUSES = ["queued", "failed", "sent"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/**
 * One channel's delivery record. The API sends one shape for both, so each has
 * a field the other never sets: `sent_at` is email's, `message_id` is push's
 * (FCM's own id, which is how a delivery is traced in their console).
 */
export type ChannelState = {
  status: DeliveryStatus;
  attempts: number;
  max_attempts: number;
  sent_at: string | null;
  message_id: string | null;
};

export type AdminNotification = {
  id: string;
  user_id: string;

  type: NotificationType;
  title: string;
  body: string;
  /** The ids the creator's client deep-links with, plus `link`. */
  payload: Record<string, unknown> | null;

  read: boolean;
  read_at: string | null;

  push: ChannelState;
  email: ChannelState;

  last_error: string | null;

  created_at: string;
  updated_at: string;
};

export type NotificationsListResponse = {
  success: boolean;
  notifications: AdminNotification[];
  pagination: PageMeta;
};

export type NotificationResponse = {
  success: boolean;
  notification: AdminNotification;
};

/** Mirrors notification.Rollup - the state of the whole outbox, unfiltered. */
export type NotificationRollup = {
  total: number;
  unread: number;

  push_sent: number;
  push_queued: number;
  push_failed: number;

  email_sent: number;
  email_queued: number;
  email_failed: number;

  /**
   * The oldest thing still waiting on either channel. If it is hours old the
   * dispatch worker is not draining, and every count above it is a backlog
   * rather than a snapshot.
   */
  oldest_queued_at: string | null;
};

export type NotificationStatsResponse = {
  success: boolean;
  stats: NotificationRollup;
  /**
   * The attempt ceiling the counts are relative to, sent by the API rather
   * than hard-coded here so raising it does not need a release on this side.
   */
  max_delivery_attempts: number;
};

/**
 * Whether a notification arrived by any route at all.
 *
 * Neither channel succeeding is the row worth looking at: the creator was told
 * nothing. One of the two is enough - push and email are two ways of saying
 * the same thing, not two events.
 */
export function undelivered(notification: AdminNotification): boolean {
  return notification.push.status !== "sent" && notification.email.status !== "sent";
}

/** A channel nobody will retry again: out of attempts, never delivered. */
export function gaveUp(notification: AdminNotification): boolean {
  return notification.push.status === "failed" || notification.email.status === "failed";
}
