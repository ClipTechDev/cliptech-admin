import { Badge } from "@/components/ui/badge";
import { WITHDRAWAL_STATUS_LABELS, type WithdrawalStatus } from "@/schemas/withdrawal";

/**
 * One place deciding how each payout state looks.
 *
 * Paid leads because it is the only state where the money actually left.
 * Rejected, failed and cancelled share the muted outline rather than the
 * destructive treatment: in all three the creator got their balance back, so
 * nothing was lost and nothing needs alarming. Failed is the exception - it
 * means a transfer was attempted and did not land, which is worth noticing.
 */
const variants: Record<WithdrawalStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "secondary",
  processing: "secondary",
  paid: "default",
  rejected: "outline",
  failed: "destructive",
  cancelled: "outline",
};

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  return <Badge variant={variants[status] ?? "secondary"}>{WITHDRAWAL_STATUS_LABELS[status] ?? status}</Badge>;
}
