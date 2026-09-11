import { Badge } from "@/components/ui/badge";
import type { ChannelState } from "@/schemas/notification";

/**
 * One channel's delivery state.
 *
 * Sent leads; failed is destructive because it is the only state nobody will
 * retry - the row has used its attempts and the creator was never told.
 * Queued is muted rather than alarming: waiting is what the outbox does.
 *
 * The attempt count rides along on anything that has been tried, because
 * "queued, 4 of 5" is a different situation from "queued, 0 of 5" - one is
 * about to be given up on.
 */
const variants: Record<ChannelState["status"], "default" | "secondary" | "destructive"> = {
  sent: "default",
  queued: "secondary",
  failed: "destructive",
};

const labels: Record<ChannelState["status"], string> = {
  sent: "Sent",
  queued: "Queued",
  failed: "Gave up",
};

export function DeliveryBadge({ state }: { state: ChannelState }) {
  const showAttempts = state.status !== "sent" && state.attempts > 0;

  return (
    <Badge variant={variants[state.status] ?? "secondary"}>
      {labels[state.status] ?? state.status}
      {showAttempts && (
        <span className="tabular-nums opacity-70">
          {state.attempts}/{state.max_attempts}
        </span>
      )}
    </Badge>
  );
}
