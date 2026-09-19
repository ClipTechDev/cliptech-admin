"use client";

import * as React from "react";
import { CheckCircle2, Flag, Slash, XCircle } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/components/shared/query-state";
import {
  useApproveSubmission,
  useFlagSubmission,
  useInvalidateSubmission,
  useRejectSubmission,
  useUnflagSubmission,
} from "@/hooks/use-submissions";
import {
  INVALID_REASONS,
  SUBMISSION_STATUS_LABELS,
  canApprove,
  issueLabel,
  canFlag,
  canInvalidate,
  canReject,
  canUnflag,
  type Submission,
} from "@/schemas/submission";
import { Button } from "@/components/ui/button";
import { PromptDialog } from "@/components/shared/prompt-dialog";

export function SubmissionActions({ submission }: { submission: Submission }) {
  const [dialog, setDialog] = React.useState<"reject" | "invalidate" | "flag" | null>(null);

  const approve = useApproveSubmission(submission.id, submission.campaign_id);
  const unflag = useUnflagSubmission(submission.id, submission.campaign_id);
  const reject = useRejectSubmission(submission.id, submission.campaign_id);
  const flag = useFlagSubmission(submission.id, submission.campaign_id);
  const invalidate = useInvalidateSubmission(submission.id, submission.campaign_id);

  const approvable = canApprove(submission);
  const rejectable = canReject(submission);
  const flaggable = canFlag(submission);
  const unflaggable = canUnflag(submission);
  const invalidatable = canInvalidate(submission);
  const busy =
    approve.isPending ||
    unflag.isPending ||
    reject.isPending ||
    flag.isPending ||
    invalidate.isPending;

  if (!approvable && !rejectable && !flaggable && !unflaggable && !invalidatable) {
    return (
      <p className="text-muted-foreground text-sm">
        No actions available — a {SUBMISSION_STATUS_LABELS[submission.status].toLowerCase()}{" "}
        submission is final.
      </p>
    );
  }

  return (
    <>
      {approvable && (
        <p className="text-muted-foreground mb-2 text-sm">
          This clip passed the automatic checks. Open the post and check it follows the
          campaign brief, then approve it to start tracking views or reject it with a reason.
          Views since it was submitted still count once it is approved.
        </p>
      )}
      {submission.status === "pending" && submission.issues.length > 0 && (
        <div className="border-destructive/30 bg-destructive/5 mb-2 space-y-1 rounded-lg border p-3 text-sm">
          <p className="font-medium">This clip failed the automatic checks</p>
          <ul className="text-muted-foreground list-disc space-y-0.5 pl-5">
            {submission.issues.map((issue) => (
              <li key={`${issue.code}-${issue.detail ?? ""}`}>{issueLabel(issue)}</li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            It can&apos;t be approved until this is fixed. Reject it with a reason, or leave it
            here — the creator can fix the post and re-run the checks.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {approvable && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              approve.mutate(undefined, {
                onSuccess: () => toast.success("Clip approved — tracking has started"),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            <CheckCircle2 />
            Approve
          </Button>
        )}
        {unflaggable && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              unflag.mutate(undefined, {
                onSuccess: () => toast.success("Submission released back into tracking"),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            <CheckCircle2 />
            Release into tracking
          </Button>
        )}
        {flaggable && (
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialog("flag")}>
            <Flag />
            Flag for review
          </Button>
        )}
        {rejectable && (
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
        {invalidatable && (
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
        description="The creator sees this reason. Rejecting is final — they cannot re-check their way out of it."
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
        description="Tracking stops while it is flagged, so views and earnings hold still. Nothing is paid or lost — releasing it resumes tracking."
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
