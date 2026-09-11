import { humanise } from "@/lib/format";
import { ADMIN_ROLES, SUPER_ADMIN_ROLE } from "@/schemas/admin";
import type { CheckboxGroupOption } from "@/components/shared/checkbox-group";
import { Badge } from "@/components/ui/badge";

/**
 * What each role actually grants, taken from the route registrations in
 * cliptech-api. Granting permissions blind is how an admin ends up with more
 * than they need, so the picker says what it is handing over.
 */
const descriptions: Record<string, string> = {
  super_admin: "Everything, including invites, settings and the action log",
  users: "Creator accounts, their ledger and connected platforms",
  campaigns: "Campaigns and payout snapshots",
  submissions: "Submission review, approval and invalidation",
  withdrawals: "Withdrawal requests and their status",
  transactions: "Ledger and transaction records",
  feedback: "Creator feedback",
  notifications: "Notification records",
  admins: "Admin accounts (not invites - those are super admin only)",
};

export const roleOptions: CheckboxGroupOption[] = ADMIN_ROLES.map((role) => ({
  value: role,
  label: humanise(role),
  description: descriptions[role],
}));

export const roleFilterOptions = ADMIN_ROLES.map((role) => ({
  value: role,
  label: humanise(role),
}));

/**
 * Roles as badges. Super admin is called out because it passes every other
 * role check - a list reading "Super admin, Users" understates it.
 */
export function AdminRoleBadges({ roles }: { roles: string[] }) {
  if (roles.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge
          key={role}
          variant={role === SUPER_ADMIN_ROLE ? "default" : "secondary"}
          className="whitespace-nowrap"
        >
          {humanise(role)}
        </Badge>
      ))}
    </div>
  );
}
