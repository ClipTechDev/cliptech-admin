"use client";

import { formatDateTime } from "@/lib/format";
import { useFeedbackQuery } from "@/hooks/use-feedback";
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
import { FeedbackScreenshot } from "@/components/feedback/feedback-screenshot";

/**
 * One piece of feedback, in full.
 *
 * There are no actions on it - no reply, no resolve, no status - and that is
 * the API's shape rather than an omission: the admin routes are a list and a
 * get. What an admin does with a report happens elsewhere, and pretending
 * otherwise with a button that only changed local state would be a lie.
 */
export function FeedbackSheet({
  feedbackId,
  onOpenChange,
}: {
  feedbackId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: entry, isLoading, error, refetch } = useFeedbackQuery(feedbackId);

  return (
    <Sheet open={Boolean(feedbackId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Feedback</SheetTitle>
          <SheetDescription>
            {entry
              ? `Sent ${formatDateTime(entry.created_at)}`
              : "Loading what the creator reported."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 space-y-6 p-4">
          <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
            {entry && (
              <>
                <DetailSection title="What they said">
                  {/* Stored as plain text, so rendered as plain text - the
                      creator's line breaks kept, nothing read as markup. */}
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {entry.description}
                  </p>
                </DetailSection>

                {entry.screenshot_url && (
                  <DetailSection title="Screenshot">
                    <FeedbackScreenshot url={entry.screenshot_url} />
                  </DetailSection>
                )}

                <DetailSection title="Who sent it">
                  <CreatorSummary userId={entry.user_id} />
                </DetailSection>

                <DetailList
                  items={[
                    {
                      label: "Feedback ID",
                      value: <code className="text-xs break-all">{entry.id}</code>,
                      wide: true,
                    },
                    { label: "Received", value: formatDateTime(entry.created_at) },
                  ]}
                />
              </>
            )}
          </QueryState>
        </div>
      </SheetContent>
    </Sheet>
  );
}
