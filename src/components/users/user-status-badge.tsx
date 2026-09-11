import { Badge } from "@/components/ui/badge";
import { humanise } from "@/lib/format";
import type { UserStatus } from "@/schemas/user";

/**
 * One place deciding how each account status looks, so the table, the detail
 * header and any future listing never disagree about what "banned" is.
 * Suspended and banned share the destructive treatment because both mean the
 * creator cannot log in; deleted is muted because the row is history.
 */
const variants: Record<UserStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "destructive",
  banned: "destructive",
  deleted: "outline",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={variants[status] ?? "secondary"}>{humanise(status)}</Badge>;
}
