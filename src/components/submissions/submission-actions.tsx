"use client";

import * as React from "react";
import { CheckCircle2, Flag, Slash, XCircle } from "lucide-react";
import { toast } from "sonner";

import { humanise } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import {
  useApproveSubmission,
  useFlagSubmission,
  useInvalidateSubmission,
  useRejectSubmission,
} from "@/hooks/use-submissions";
import { INVALID_REASONS, canFlag, canReview, type Submission } from "@/schemas/submission";
import { Button } from "@/components/ui/button";
import { PromptDialog } from "@/components/shared/prompt-dialog";

/**
 * The four decisions an admin can take on a post.
 *
 * Which are offered comes from the API's own rules rather than being shown
 * and then refused: only a pending post can be approved, rejected or
 * invalidated (ErrNotPending), and only a pending or approved one can be
 * flagged (ErrNotFlaggable).
 *
 * Reject and invalidate collect a reason before firing - the API requires one
 * and, for invalidate, requires it from a fixed list - so the prompt is a
 * dialog rather than a confirm.
 */
export function SubmissionActions({ submission }: { submission: Submission }) {
  const [dialog, setDialog] = React.useState<"reject" | "invalidate" | "flag" | null>(null);

  const approve = useApproveSubmission(submission.id, submission.campaign_id);
  const reject = useRejectSubmission(submission.id, submission.campaign_id);
  const flag = useFlagSubmission(submission.id, submission.campaign_id);
  const invalidate = useInvalidateSubmission(submission.id, submission.campaign_id);

  const reviewable = canReview(submission);
  const flaggable = canFlag(submission);
  const busy =
    approve.isPending || reject.isPending || flag.isPending || invalidate.isPending;

  if (!reviewable && !flaggable) {
    return (
      <p className="text-muted-foreground text-sm">
        No actions available — a {humanise(submission.status).toLowerCase()} submission is
        final.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {reviewable && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              approve.mutate(undefined, {
                onSuccess: () => toast.success("Submission approved"),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            <CheckCircle2 />
            Approve
          </Button>
        )}
        {flaggable && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialog("flag")}>
            <Flag />
            Flag for review
          </Button>
        )}
        {reviewable && (
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => setDialog("reject")}
          >
            <XCircle />
            Reject
          </Button>
        )}
        {reviewable && (
          <Button
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => setDialog("invalidate")}
          >
            <Slash />
            Invalidate
          </Button>
        )}
      </div>

      <PromptDialog
        open={dialog === "reject"}
        onOpenChange={(open) => setDialog(open ? "reject" : null)}
        title="Reject this submission"
        description="The creator sees this reason. Rejecting is final — the post cannot be re-reviewed."
        fieldLabel="Reason"
        placeholder="What's wrong with this post?"
        multiline
        required
        destructive
        confirmLabel="Reject"
        isPending={reject.isPending}
        onConfirm={(reason) =>
          reject.mutate(
            { reason },
            {
              onSuccess: () => {
                toast.success("Submission rejected");
                setDialog(null);
              },
              onError: (error) => toast.error(errorMessage(error)),
            }
          )
        }
      />

      <PromptDialog
        open={dialog === "flag"}
        onOpenChange={(open) => setDialog(open ? "flag" : null)}
        title="Flag for review"
        description="Tracking stops while it is flagged, so views and earnings hold still. Nothing is paid or lost — approving it again releases it."
        fieldLabel="Reason"
        placeholder="What needs a second look?"
        multiline
        confirmLabel="Flag"
        isPending={flag.isPending}
        onConfirm={(reason) =>
          flag.mutate(
            { reason },
            {
              onSuccess: () => {
                toast.success("Submission flagged");
                setDialog(null);
              },
              onError: (error) => toast.error(errorMessage(error)),
            }
          )
        }
      />

      <PromptDialog
        open={dialog === "invalidate"}
        onOpenChange={(open) => setDialog(open ? "invalidate" : null)}
        title="Invalidate this submission"
        description="Stops it earning. Pick the reason it is no longer payable."
        fieldLabel="Reason"
        // The API validates against its configured list, so this is a picker
        // rather than free text.
        options={INVALID_REASONS}
        required
        destructive
        confirmLabel="Invalidate"
        isPending={invalidate.isPending}
        onConfirm={(reason) =>
          invalidate.mutate(
            { reason },
            {
              onSuccess: () => {
                toast.success("Submission invalidated");
                setDialog(null);
              },
              onError: (error) => toast.error(errorMessage(error)),
            }
          )
        }
      />
    </>
  );
}
