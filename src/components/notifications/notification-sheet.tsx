"use client";

import { formatDateTime, humanise } from "@/lib/format";
import { useNotificationQuery } from "@/hooks/use-notifications";
import { undelivered, type ChannelState } from "@/schemas/notification";
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
import { DeliveryBadge } from "@/components/notifications/delivery-badge";

/**
 * One notification, in full.
 *
 * There are no actions on it, and that is the outbox's shape rather than an
 * omission: a row is written by the event that caused it and drained by the
 * dispatch worker, so a button here could only claim something about a
 * delivery that did not happen. What this screen owes an admin is the whole
 * record - the copy as it was sent, both channels' attempts, and the error.
 */
export function NotificationSheet({
  notificationId,
  onOpenChange,
}: {
  notificationId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    data: notification,
    isLoading,
    error,
    refetch,
  } = useNotificationQuery(notificationId);

  return (
    <Sheet open={Boolean(notificationId)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{notification ? notification.title : "Notification"}</SheetTitle>
          <SheetDescription>
            {notification
              ? `${humanise(notification.type)} · raised ${formatDateTime(notification.created_at)}`
              : "Loading what was sent."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-w-0 space-y-6 p-4">
          <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
            {notification && (
              <>
                <DetailSection
                  title="What was sent"
                  description="The copy as it was written at event time - the list, the push payload and the email body are all these words."
                >
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {notification.body}
                  </p>
                </DetailSection>

                <DetailSection
                  title="Delivery"
                  description={
                    undelivered(notification)
                      ? "Neither channel has delivered this, so the creator has not been told."
                      : "Push and email are two ways of saying one thing, so either arriving is enough."
                  }
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Channel label="Push" state={notification.push} />
                    <Channel label="Email" state={notification.email} />
                  </div>
                </DetailSection>

                {notification.last_error && (
                  <DetailSection
                    title="Last error"
                    description="Whatever failed most recently, on either channel. The full text is in the process log."
                  >
                    <p className="bg-muted/50 rounded-lg border p-3 font-mono text-xs break-words whitespace-pre-wrap">
                      {notification.last_error}
                    </p>
                  </DetailSection>
                )}

                <DetailSection title="Who it was for">
                  <CreatorSummary userId={notification.user_id} />
                </DetailSection>

                {payloadPairs(notification.payload).length > 0 && (
                  <DetailSection
                    title="Payload"
                    description="What the creator's app deep-links with. Not shown to them."
                  >
                    <DetailList
                      items={payloadPairs(notification.payload).map((pair) => ({
                        label: humanise(pair.key),
                        value: <code className="text-xs break-all">{pair.value}</code>,
                      }))}
                    />
                  </DetailSection>
                )}

                <DetailList
                  items={[
                    {
                      label: "Notification ID",
                      value: <code className="text-xs break-all">{notification.id}</code>,
                      wide: true,
                    },
                    { label: "Raised", value: formatDateTime(notification.created_at) },
                    { label: "Last updated", value: formatDateTime(notification.updated_at) },
                    {
                      label: "Opened by creator",
                      value: notification.read
                        ? formatDateTime(notification.read_at)
                        : "Not yet",
                    },
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

/**
 * One channel's record. The two fields that differ are shown only where they
 * exist - a send time for email, FCM's message id for push - rather than as
 * an em dash apiece, which would suggest something was missing.
 */
function Channel({ label, state }: { label: string; state: ChannelState }) {
  return (
    <div className="min-w-0 space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <DeliveryBadge state={state} />
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">
        {state.attempts} of {state.max_attempts} attempts used
      </p>
      {state.sent_at && (
        <p className="text-muted-foreground text-xs">Sent {formatDateTime(state.sent_at)}</p>
      )}
      {state.message_id && (
        <p className="text-muted-foreground text-xs break-all">
          FCM <code>{state.message_id}</code>
        </p>
      )}
      {state.status === "queued" && (
        // The queue joins on the recipient: an account with no token, no
        // address, or one that is suspended is skipped and left queued rather
        // than marked failed, so "waiting" does not always mean "will send".
        <p className="text-muted-foreground text-xs">
          Waiting for the dispatch worker, if the account still qualifies.
        </p>
      )}
    </div>
  );
}

function payloadPairs(payload: Record<string, unknown> | null) {
  if (!payload) return [];

  return Object.entries(payload)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));
}
