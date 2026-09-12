import { Badge } from "@/components/ui/badge";
import { humanise } from "@/lib/format";
import type { SubmissionStatus } from "@/schemas/submission";

const variants: Record<SubmissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  flagged: "outline",
  rejected: "destructive",
  invalidated: "destructive",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={variants[status] ?? "secondary"}>{humanise(status)}</Badge>;
}
