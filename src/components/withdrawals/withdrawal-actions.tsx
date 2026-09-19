"use client";

import * as React from "react";
import { Ban, Banknote, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, humanise } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import {
  useApproveWithdrawal,
  useCancelWithdrawal,
  useMarkWithdrawalFailed,
  useMarkWithdrawalPaid,
  useProcessingWithdrawal,
  useRejectWithdrawal,
} from "@/hooks/use-withdrawals";
import { canBecome, type Withdrawal, type WithdrawalStatus } from "@/schemas/withdrawal";
import { Button } from "@/components/ui/button";
import { PromptDialog } from "@/components/shared/prompt-dialog";

/** Handlers the caller hands to whichever mutation a prompt fires. */
type SubmitHandlers = { onSuccess: () => void; onError: (error: unknown) => void };

/**
 * One prompted transition, described rather than hand-written.
 *
 * The five are the same shape - a target state, a dialog, a mutation, a toast
 * - so they are data walked by one renderer below. Written out as four JSX
 * blocks they came to 200 lines in which the only real differences, the
 * wording and whether a reason is required, were buried in the repetition.
 *
 * `submit` is a closure over the right mutation rather than the mutation
 * itself: each takes a different body, so holding them in one collection
 * would need casts that throw away exactly the checking that makes sending
 * the wrong body impossible.
 */
type Prompt = {
  /** The state this moves to, checked against the API's own `next_statuses`. */
  target: WithdrawalStatus;
  icon: typeof CheckCircle2;
  buttonLabel: string;
  confirmLabel: string;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  multiline?: boolean;
  required?: boolean;
  destructive?: boolean;
  success: string;
  isPending: boolean;
  submit: (value: string, handlers: SubmitHandlers) => void;
};

/**
 * The six moves an admin can make on a payout request.
 *
 * Which are offered comes from the `next_statuses` the API sent with the
 * record, not from a copy of its transition map kept here - so a button
 * appears exactly when the API would accept the move, and a state machine
 * changed on the server does not leave this file quietly wrong.
 *
 * Only "processing" is a bare click: it records that a transfer was started
 * and there is nothing else to say about it. The other five collect a note, a
 * reference or a reason first.
 */
export function WithdrawalActions({ withdrawal }: { withdrawal: Withdrawal }) {
  const [open, setOpen] = React.useState<WithdrawalStatus | null>(null);

  const userId = withdrawal.user_id;
  const approve = useApproveWithdrawal(withdrawal.id, userId);
  const processing = useProcessingWithdrawal(withdrawal.id, userId);
  const reject = useRejectWithdrawal(withdrawal.id, userId);
  const paid = useMarkWithdrawalPaid(withdrawal.id, userId);
  const failed = useMarkWithdrawalFailed(withdrawal.id, userId);
  const cancel = useCancelWithdrawal(withdrawal.id, userId);

  const busy =
    approve.isPending ||
    processing.isPending ||
    reject.isPending ||
    paid.isPending ||
    failed.isPending ||
    cancel.isPending;

  const amount = formatCurrency(withdrawal.amount);

  // Every description says what happens to the money, because that is what
  // differs between these five and what an admin needs to be sure of before
  // clicking: reject, fail and cancel return the balance, paid does not.
  const prompts: Prompt[] = [
    {
      target: "approved",
      icon: CheckCircle2,
      buttonLabel: "Approve",
      confirmLabel: "Approve",
      title: `Approve ${amount}?`,
      description:
        "Clears the request for payment. The money has already left the creator's balance — approving does not send it, it says the transfer may be made.",
      fieldLabel: "Internal note",
      placeholder: "Anything the next admin should know",
      multiline: true,
      success: "Withdrawal approved",
      isPending: approve.isPending,
      submit: (notes, handlers) => approve.mutate({ notes: notes || null }, handlers),
    },
    {
      target: "paid",
      icon: Banknote,
      buttonLabel: "Mark paid",
      confirmLabel: "Mark paid",
      title: `Record ${amount} as paid?`,
      description:
        "The end of the manual flow: you have made the transfer and are recording it. This is final and does not return the balance.",
      fieldLabel: "Provider reference",
      placeholder: "Transaction id from the bank or wallet",
      success: "Withdrawal marked paid",
      isPending: paid.isPending,
      submit: (reference, handlers) =>
        paid.mutate({ provider_reference: reference || null }, handlers),
    },
    {
      target: "rejected",
      icon: XCircle,
      buttonLabel: "Reject",
      confirmLabel: "Reject and refund",
      title: "Reject this request?",
      description: `${amount} goes straight back to the creator's available balance. The reason is stored on the request.`,
      fieldLabel: "Reason",
      placeholder: "Why is this being refused?",
      multiline: true,
      required: true,
      destructive: true,
      success: "Rejected — balance returned",
      isPending: reject.isPending,
      submit: (reason, handlers) => reject.mutate({ reason }, handlers),
    },
    {
      target: "failed",
      icon: XCircle,
      buttonLabel: "Mark failed",
      confirmLabel: "Mark failed",
      title: "Mark this transfer as failed?",
      description: `For a transfer that was attempted and did not land. ${amount} is returned to the creator's balance so they can request it again.`,
      fieldLabel: "What went wrong",
      placeholder: "Bounced, wrong account details, provider error...",
      multiline: true,
      required: true,
      destructive: true,
      success: "Marked failed — balance returned",
      isPending: failed.isPending,
      submit: (reason, handlers) => failed.mutate({ reason }, handlers),
    },
    {
      target: "cancelled",
      icon: Ban,
      buttonLabel: "Cancel",
      confirmLabel: "Cancel and refund",
      title: "Cancel this request?",
      description: `${amount} goes straight back to the creator's available balance. Make sure no transfer has been sent. The reason is shown to the creator.`,
      fieldLabel: "Reason",
      placeholder: "Why is this being cancelled?",
      multiline: true,
      required: true,
      destructive: true,
      success: "Cancelled — balance returned",
      isPending: cancel.isPending,
      submit: (reason, handlers) => cancel.mutate({ reason }, handlers),
    },
  ];

  if (withdrawal.next_statuses.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No actions available — a {humanise(withdrawal.status).toLowerCase()} request is final.
      </p>
    );
  }

  const available = prompts.filter((prompt) => canBecome(withdrawal, prompt.target));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {available.map((prompt) => (
          <Button
            key={prompt.target}
            size="sm"
            variant={prompt.destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={() => setOpen(prompt.target)}
          >
            <prompt.icon />
            {prompt.buttonLabel}
          </Button>
        ))}

        {/* The one transition with nothing to collect, so it stays a button
            rather than being forced through a dialog for symmetry. */}
        {canBecome(withdrawal, "processing") && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              processing.mutate(undefined, {
                onSuccess: () => toast.success("Marked as processing"),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            <Loader2 />
            Mark processing
          </Button>
        )}
      </div>

      {available.map((prompt) => (
        <PromptDialog
          key={prompt.target}
          open={open === prompt.target}
          onOpenChange={(next) => setOpen(next ? prompt.target : null)}
          title={prompt.title}
          description={prompt.description}
          fieldLabel={prompt.fieldLabel}
          placeholder={prompt.placeholder}
          confirmLabel={prompt.confirmLabel}
          multiline={prompt.multiline}
          required={prompt.required}
          destructive={prompt.destructive}
          isPending={prompt.isPending}
          onConfirm={(value) =>
            prompt.submit(value, {
              onSuccess: () => {
                toast.success(prompt.success);
                // Closed here rather than by the dialog, so a failure leaves
                // the typed reason on screen behind the toast that explains it.
                setOpen(null);
              },
              onError: (error) => toast.error(errorMessage(error)),
            })
          }
        />
      ))}
    </>
  );
}
