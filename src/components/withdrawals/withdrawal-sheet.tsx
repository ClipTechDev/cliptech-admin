"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime, orDash } from "@/lib/format";
import { useWithdrawalQuery } from "@/hooks/use-withdrawals";
import {
  payoutDetailLabel,
  payoutDetailPairs,
  refunds,
  withdrawalMethodLabel,
  WITHDRAWAL_NEXT_STEPS,
  WITHDRAWAL_PROGRESS_STEPS,
  withdrawalProgress,
  type Withdrawal,
} from "@/schemas/withdrawal";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DetailList } from "@/components/shared/detail-list";
import { DetailSection } from "@/components/shared/detail-section";
import { QueryState } from "@/components/shared/query-state";
import { CreatorSummary } from "@/components/users/creator-summary";
import { WithdrawalActions } from "@/components/withdrawals/withdrawal-actions";
import { WithdrawalStatusBadge } from "@/components/withdrawals/withdrawal-status-badge";
import { RecordActivity } from "@/components/shared/record-activity";

/**
 * One payout request, in full, without leaving the queue.
 *
 * A sheet rather than a route for the same reason the submissions one is:
 * paying creators is a queue - open, decide, back to the list. It is still
 * addressable through `?withdrawal=`, so a request that needs a second pair
 * of eyes can be linked to a colleague.
 */
export function WithdrawalSheet({
  withdrawalId,
  onOpenChange,
}: {
  withdrawalId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: withdrawal, isLoading, error, refetch } = useWithdrawalQuery(withdrawalId);

  return (
    <Sheet open={Boolean(withdrawalId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            {withdrawal ? formatCurrency(withdrawal.amount) : "Payout request"}
            {withdrawal && <WithdrawalStatusBadge status={withdrawal.status} />}
          </SheetTitle>
          <SheetDescription>
            {withdrawal
              ? `${withdrawalMethodLabel(withdrawal.method)}, requested ${formatDateTime(
                  withdrawal.requested_at
                )}`
              : "Loading the request and where the money is going."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 space-y-6 p-4">
          <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
            {withdrawal && (
              <>
                <WithdrawalProgress withdrawal={withdrawal} />

                <div className="bg-muted/50 space-y-3 rounded-lg border p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">What to do next</p>
                    <p className="text-muted-foreground text-sm">
                      {WITHDRAWAL_NEXT_STEPS[withdrawal.status]}
                    </p>
                  </div>
                  <WithdrawalActions withdrawal={withdrawal} />
                </div>

                <DetailSection title="Payment details">
                  <PayoutDetails withdrawal={withdrawal} />
                </DetailSection>

                <DetailSection title="Creator">
                  <CreatorSummary userId={withdrawal.user_id} showBalances />
                </DetailSection>

                <DetailSection title="Request history">
                  <RequestMeta withdrawal={withdrawal} />
                </DetailSection>

                <RecordActivity recordId={withdrawal.id} />
              </>
            )}
          </QueryState>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WithdrawalProgress({ withdrawal }: { withdrawal: Withdrawal }) {
  const current = withdrawalProgress(withdrawal.status);

  if (current < 0) return null;

  return (
    <ol className="flex items-center gap-2">
      {WITHDRAWAL_PROGRESS_STEPS.map((step, index) => {
        const done = index < current || withdrawal.status === "paid";
        const active = index === current && withdrawal.status !== "paid";

        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                done && "bg-primary text-primary-foreground border-primary",
                active && "border-primary text-primary"
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "truncate text-xs",
                done || active ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
            {index < WITHDRAWAL_PROGRESS_STEPS.length - 1 && (
              <span className="bg-border hidden h-px flex-1 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The account particulars the creator gave, whatever shape they are.
 *
 * The API stores them as free-form JSON because the fields differ per method
 * - a UPI id is one string, a bank transfer is four - so they are rendered as
 * whatever keys came back rather than against a fixed layout that would drop
 * a field the day a new method is added.
 */
function PayoutDetails({ withdrawal }: { withdrawal: Withdrawal }) {
  const pairs = payoutDetailPairs(withdrawal.payout_details);

  if (pairs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No account details were stored with this request.
      </p>
    );
  }

  return (
    <DetailList
      items={pairs.map(({ key, value }) => ({
        label: payoutDetailLabel(withdrawal.method, key),
        value: <span className="break-all">{value}</span>,
        wide: value.length > 24,
      }))}
    />
  );
}

const REASON_LABELS: Partial<Record<Withdrawal["status"], string>> = {
  rejected: "Rejection reason",
  failed: "Failure reason",
  cancelled: "Cancellation reason",
};

function RequestMeta({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <DetailList
      items={[
        { label: "Request ID", value: <code className="text-xs break-all">{withdrawal.id}</code> },
        { label: "Method", value: withdrawalMethodLabel(withdrawal.method) },
        { label: "Requested", value: formatDateTime(withdrawal.requested_at) },
        { label: "Completed", value: formatDateTime(withdrawal.completed_at) },
        {
          label: "Handled by",
          value: withdrawal.reviewed_by ? (
            <code className="text-xs break-all">{withdrawal.reviewed_by}</code>
          ) : (
            "—"
          ),
        },
        { label: "Last updated by admin", value: formatDateTime(withdrawal.reviewed_at) },
        {
          label: "Transaction ID",
          value: <span className="break-all">{orDash(withdrawal.provider_reference)}</span>,
          wide: true,
        },
        ...(withdrawal.failure_reason
          ? [
              {
                // The same column carries a rejection, a failed transfer and a
                // cancellation, and they mean different things to whoever reads
                // this later.
                label: REASON_LABELS[withdrawal.status] ?? "Reason",
                value: withdrawal.failure_reason,
                wide: true,
              },
            ]
          : []),
        ...(withdrawal.notes
          ? [{ label: "Internal note", value: withdrawal.notes, wide: true }]
          : []),
        ...(refunds(withdrawal.status)
          ? [
              {
                label: "Balance",
                value: `${formatCurrency(withdrawal.amount)} was returned to the creator.`,
                wide: true,
              },
            ]
          : []),
      ]}
    />
  );
}
