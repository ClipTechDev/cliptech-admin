import { Badge } from "@/components/ui/badge";
import { humanise } from "@/lib/format";
import type { SubmissionStatus } from "@/schemas/submission";

/**
 * Approved is the only earning state, so it leads. Flagged is deliberately
 * not destructive: it holds tracking still while somebody looks, and nothing
 * has been decided or lost yet.
 */
const variants: Record<SubmissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  flagged: "outline",
  rejected: "destructive",
  invalidated: "destructive",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={variants[status] ?? "secondary"}>{humanise(status)}</Badge>;
}
