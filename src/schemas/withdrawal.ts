import { humanise } from "@/lib/format";
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

export const OPEN_WITHDRAWALS_FILTER = "open";

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Needs review",
  approved: "Approved, ready to pay",
  processing: "Payment sending",
  paid: "Paid",
  rejected: "Rejected, refunded",
  failed: "Payment failed, refunded",
  cancelled: "Cancelled, refunded",
};

export const WITHDRAWAL_NEXT_STEPS: Record<WithdrawalStatus, string> = {
  pending:
    "Check the creator and where the money is going. If it looks right, click Approve. If not, click Reject and say why.",
  approved:
    "Send the money using the payment details below, by PayPal or to the crypto wallet. When it's sent, click Mark as paid and paste the transaction ID.",
  processing:
    "The payment has been started. Once it has gone through, click Mark as paid. If it bounced or was returned, click Payment failed.",
  paid: "Nothing to do. The money has been sent to the creator.",
  rejected: "Nothing to do. The request was refused and the money is back in the creator's balance.",
  failed: "Nothing to do. The payment didn't go through and the money is back in the creator's balance. The creator can request it again.",
  cancelled: "Nothing to do. The request was cancelled and the money is back in the creator's balance.",
};

export const WITHDRAWAL_PROGRESS_STEPS = ["Requested", "Approved", "Sending", "Paid"] as const;

export function withdrawalProgress(status: WithdrawalStatus): number {
  switch (status) {
    case "pending":
      return 0;
    case "approved":
      return 1;
    case "processing":
      return 2;
    case "paid":
      return 3;
    default:
      return -1;
  }
}

/** Mirrors `allowed_withdrawal_methods` in cliptech-api's config.yaml. */
export const WITHDRAWAL_METHODS = ["paypal", "crypto"] as const;

const METHOD_LABELS: Record<string, string> = {
  paypal: "PayPal",
  crypto: "Crypto wallet",
};

const METHOD_ADDRESS_LABELS: Record<string, string> = {
  paypal: "PayPal email",
  crypto: "Wallet address",
};

export function withdrawalMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? humanise(method);
}

export function payoutDetailLabel(method: string, key: string): string {
  if (key === "content") return METHOD_ADDRESS_LABELS[method] ?? "Send to";
  return humanise(key);
}

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
