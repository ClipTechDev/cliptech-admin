"use client";

import { formatCurrency, formatDateTime, humanise, orDash } from "@/lib/format";
import { useWithdrawalQuery } from "@/hooks/use-withdrawals";
import { payoutDetailPairs, refunds, type Withdrawal } from "@/schemas/withdrawal";
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
              ? `${humanise(withdrawal.method)}, requested ${formatDateTime(
                  withdrawal.requested_at
                )}`
              : "Loading the request and where the money is going."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 space-y-6 p-4">
          <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
            {withdrawal && (
              <>
                <WithdrawalActions withdrawal={withdrawal} />

                <DetailSection title="Where it goes">
                  <PayoutDetails withdrawal={withdrawal} />
                </DetailSection>

                <DetailSection title="Creator">
                  <CreatorSummary userId={withdrawal.user_id} showBalances />
                </DetailSection>

                <DetailSection title="Request">
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
        label: humanise(key),
        value: <span className="break-all">{value}</span>,
        wide: value.length > 24,
      }))}
    />
  );
}

function RequestMeta({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <DetailList
      items={[
        { label: "Request ID", value: <code className="text-xs break-all">{withdrawal.id}</code> },
        { label: "Method", value: humanise(withdrawal.method) },
        { label: "Requested", value: formatDateTime(withdrawal.requested_at) },
        { label: "Completed", value: formatDateTime(withdrawal.completed_at) },
        {
          label: "Reviewed by",
          value: withdrawal.reviewed_by ? (
            <code className="text-xs break-all">{withdrawal.reviewed_by}</code>
          ) : (
            "—"
          ),
        },
        { label: "Reviewed at", value: formatDateTime(withdrawal.reviewed_at) },
        {
          label: "Provider reference",
          value: <span className="break-all">{orDash(withdrawal.provider_reference)}</span>,
          wide: true,
        },
        ...(withdrawal.failure_reason
          ? [
              {
                // The same column carries a rejection and a failed transfer,
                // and they mean different things to whoever reads this later.
                label: withdrawal.status === "rejected" ? "Rejection reason" : "Failure reason",
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
