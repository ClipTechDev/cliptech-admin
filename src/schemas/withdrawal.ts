import type { PageMeta } from "@/schemas/common";

/**
 * Mirrors withdrawal.AdminResponse (internal/features/withdrawal/dto.go).
 *
 * The admin view carries what the creator's does not: where the money is
 * going, who reviewed it, and the internal note.
 */

export const WITHDRAWAL_STATUSES = [
  "pending",
  "approved",
  "processing",
  "paid",
  "rejected",
  "failed",
  "cancelled",
] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

/** Mirrors `allowed_withdrawal_methods` in cliptech-api's config.yaml. */
export const WITHDRAWAL_METHODS = ["paypal", "crypto"] as const;

export type Withdrawal = {
  id: string;
  amount: number;

  status: WithdrawalStatus;
  /**
   * Where this request may go next, decided by the API's own transition map
   * rather than re-derived here - so the buttons an admin sees are exactly the
   * moves the API will accept.
   */
  next_statuses: WithdrawalStatus[];
  method: string;

  payout_method_id: string | null;
  provider_reference: string | null;
  failure_reason: string | null;

  requested_at: string;
  completed_at: string | null;

  user_id: string;
  payout_details: Record<string, unknown> | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
};

export type WithdrawalsListResponse = {
  success: boolean;
  withdrawals: Withdrawal[];
  pagination: PageMeta;
};

export type WithdrawalResponse = {
  success: boolean;
  message?: string;
  withdrawal: Withdrawal;
};

/**
 * The states that hold a creator's money in flight - debited from their
 * balance but not yet sent. Mirrors withdrawal.openStatuses.
 */
const OPEN_STATUSES: readonly WithdrawalStatus[] = ["pending", "approved", "processing"];

export function isOpen(withdrawal: Withdrawal): boolean {
  return OPEN_STATUSES.includes(withdrawal.status);
}

/**
 * The states in which the money never left and is returned. Mirrors
 * withdrawal.refundStatuses - worth naming because the difference between
 * "rejected" and "paid" is whether a creator gets their balance back.
 */
const REFUND_STATUSES: readonly WithdrawalStatus[] = ["rejected", "failed", "cancelled"];

export function refunds(status: WithdrawalStatus): boolean {
  return REFUND_STATUSES.includes(status);
}

/** Whether the API would accept this move, per the `next_statuses` it sent. */
export function canBecome(withdrawal: Withdrawal, target: WithdrawalStatus): boolean {
  return withdrawal.next_statuses.includes(target);
}

/**
 * Payout details are free-form JSON - the columns differ per method, and the
 * API stores whatever the creator gave. Flattened to label/value pairs so a
 * UPI id and a bank account render through the same code.
 */
export function payoutDetailPairs(
  details: Record<string, unknown> | null
): { key: string; value: string }[] {
  if (!details) return [];

  return Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));
}

/**
 * Mirrors withdrawal.AdminMethodResponse (internal/features/withdrawal/dto.go).
 *
 * The admin view of a saved payout destination: it adds the owning user and
 * the soft-delete stamp, and carries the full `details` blob unredacted -
 * checking where a transfer went is the reason to open it. Removed methods are
 * included, so a questioned transfer can still be read against them.
 */
export type AdminPayoutMethod = {
  id: string;
  label: string | null;
  method: string;
  details: Record<string, unknown> | null;
  is_default: boolean;
  created_at: string;
  user_id: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AdminPayoutMethodsResponse = {
  success: boolean;
  methods: AdminPayoutMethod[];
};
