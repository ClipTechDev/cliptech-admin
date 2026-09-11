"use client";

import { useUserLookupQuery } from "@/hooks/use-users";
import { ScopeFilter } from "@/components/shared/scope-filter";

/**
 * The "Creator: X" control on a listing scoped by `?user_id=`.
 *
 * The name is best-effort and falls back to the id: withdrawals, feedback and
 * submissions each sit behind a role that doesn't imply "users", so an admin
 * working one of those queues may not be allowed to look the account up. A
 * failed lookup should cost them the name, not the filter.
 */
export function CreatorScopeFilter({
  userId,
  onClear,
}: {
  userId: string;
  onClear: () => void;
}) {
  const { data: user } = useUserLookupQuery(userId);

  return (
    <ScopeFilter
      label="Creator"
      name={user ? user.name || user.email : `${userId.slice(0, 8)}…`}
      href={`/users/${userId}`}
      onClear={onClear}
    />
  );
}
