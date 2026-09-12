import { Badge } from "@/components/ui/badge";
import { humanise } from "@/lib/format";
import type { CampaignStatus } from "@/schemas/campaign";

/**
 * One place deciding how each lifecycle state looks.
 *
 * Active is the only one that gets the solid treatment: it is the state in
 * which money is moving. Paused and submissions_closed are secondary - still
 * live, not taking new work. Ended reads as destructive because it is the one
 * irreversible stop, and the two filed states are outlines.
 */
const variants: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_approval: "secondary",
  active: "default",
  submissions_closed: "secondary",
  paused: "secondary",
  ended: "destructive",
  completed: "secondary",
  archived: "outline",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={variants[status] ?? "secondary"}>{humanise(status)}</Badge>;
}
