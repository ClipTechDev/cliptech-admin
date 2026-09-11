"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  humanise,
  orDash,
  platformLabel,
} from "@/lib/format";
import { useSubmissionQuery } from "@/hooks/use-submissions";
import { useUserQuery } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
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
import { SubmissionActions } from "@/components/submissions/submission-actions";
import { SubmissionStatusBadge } from "@/components/submissions/submission-status-badge";
import { TrackingHistory } from "@/components/submissions/tracking-history";
import { RecordActivity } from "@/components/shared/record-activity";

/**
 * One post, in full, without leaving the campaign you were looking at.
 *
 * A sheet rather than a route because reviewing submissions is a queue: you
 * open one, decide, and go back to the list. It is still addressable - the
 * open submission is a `?submission=` param - so a post can be linked to a
 * colleague.
 */
export function SubmissionSheet({
  submissionId,
  onOpenChange,
}: {
  submissionId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: submission, isLoading, error, refetch } = useSubmissionQuery(submissionId);

  return (
    <Sheet open={Boolean(submissionId)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            Submission
            {submission && <SubmissionStatusBadge status={submission.status} />}
          </SheetTitle>
          <SheetDescription>
            {submission
              ? `${platformLabel(submission.platform)} post, submitted ${formatDateTime(
                  submission.submitted_at
                )}`
              : "Loading the post's details and its tracking history."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 space-y-6 p-4">
          <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
            {submission && (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    render={
                      <a href={submission.post_url} target="_blank" rel="noopener noreferrer" />
                    }
                  >
                    <ExternalLink />
                    Open post
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={`/users/${submission.user_id}`} />}
                  >
                    View creator
                  </Button>
                </div>

                <SubmissionActions submission={submission} />

                <DetailSection title="Views">
                  <DetailList
                    items={[
                      {
                        label: "Starting views",
                        value: formatNumber(submission.starting_views),
                      },
                      { label: "Raw views", value: formatNumber(submission.raw_views) },
                      {
                        label: "Eligible views",
                        value: formatNumber(submission.eligible_views),
                      },
                      {
                        label: "Payable views",
                        value: formatNumber(submission.payable_views),
                      },
                    ]}
                  />
                  <p className="text-muted-foreground mt-3 text-xs">
                    Starting views were frozen when the post was submitted — views below
                    that line were not earned here. Payable views are what the campaign
                    pays for after its minimum and per-post cap.
                  </p>
                </DetailSection>

                <DetailSection title="Money">
                  <DetailList
                    items={[
                      { label: "Earned", value: formatCurrency(submission.earnings) },
                      { label: "Credited", value: formatCurrency(submission.credited_amount) },
                      {
                        label: "Pending",
                        value: formatCurrency(submission.pending_amount),
                      },
                    ]}
                  />
                  <p className="text-muted-foreground mt-3 text-xs">
                    Pending is earned but not yet paid — it moves to credited when the
                    campaign next crosses a payout threshold.
                  </p>
                </DetailSection>

                <DetailSection title="Tracking history">
                  <TrackingHistory submissionId={submission.id} />
                </DetailSection>

                <DetailSection title="Details">
                  <SubmissionMeta submission={submission} />
                </DetailSection>

                <RecordActivity recordId={submission.id} />
              </>
            )}
          </QueryState>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SubmissionMeta({ submission }: { submission: import("@/schemas/submission").Submission }) {
  // The submission carries only a user id; the name is a separate lookup that
  // needs the "users" role, so its absence is not an error worth showing.
  const { data: user } = useUserQuery(submission.user_id);

  return (
    <DetailList
      items={[
        {
          label: "Creator",
          value: user ? `${user.name} · ${user.email}` : <code className="text-xs">{submission.user_id}</code>,
          wide: true,
        },
        {
          label: "Campaign",
          value: submission.campaign_name || (
            <code className="text-xs break-all">{submission.campaign_id}</code>
          ),
          wide: true,
        },
        { label: "Platform", value: platformLabel(submission.platform) },
        {
          label: "Platform post ID",
          value: <code className="text-xs break-all">{submission.platform_post_id}</code>,
        },
        { label: "Submitted", value: formatDateTime(submission.submitted_at) },
        { label: "Last tracked", value: formatDateTime(submission.last_tracked_at) },
        { label: "Next tracking", value: formatDateTime(submission.next_tracking_at) },
        {
          label: "Submission ID",
          value: <code className="text-xs break-all">{submission.id}</code>,
        },
        ...(submission.rejection_reason
          ? [
              {
                label: submission.status === "flagged" ? "Flag note" : "Rejection reason",
                value: submission.rejection_reason,
                wide: true,
              },
            ]
          : []),
        ...(submission.invalid_reason
          ? [
              {
                label: "Invalidated",
                value: `${humanise(submission.invalid_reason)} · ${formatDateTime(
                  submission.invalidated_at
                )}`,
                wide: true,
              },
            ]
          : []),
        { label: "Post URL", value: orDash(submission.post_url), wide: true },
      ]}
    />
  );
}
