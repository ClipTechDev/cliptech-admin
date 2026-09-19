import { Badge } from "@/components/ui/badge";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/schemas/submission";

const variants: Record<SubmissionStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  flagged: "outline",
  rejected: "destructive",
  invalidated: "destructive",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={variants[status] ?? "secondary"}>{SUBMISSION_STATUS_LABELS[status] ?? status}</Badge>;
}
