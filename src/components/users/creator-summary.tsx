"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { useUserQuery } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { DetailList, type DetailItem } from "@/components/shared/detail-list";

/**
 * The creator behind a record that carries only their id.
 *
 * Withdrawals, feedback and submissions all reference a user id without the
 * name attached, because resolving it needs the "users" role and those
 * screens require a different one. So a failed lookup falls back to the id
 * rather than surfacing as an error: an admin working the payout queue with
 * only the "withdrawals" grant should get a usable sheet, not a red box for
 * something that was never going to load.
 *
 * `showBalances` is off by default. A payout decision needs to see what the
 * creator has left; a support ticket does not, and putting a balance on it
 * would be showing money for no reason.
 */
export function CreatorSummary({
  userId,
  showBalances = false,
}: {
  userId: string;
  showBalances?: boolean;
}) {
  const { data: user } = useUserQuery(userId);

  const items: DetailItem[] = [
    {
      label: "Account",
      value: user ? (
        `${user.name} · ${user.email}`
      ) : (
        <code className="text-xs break-all">{userId}</code>
      ),
      wide: true,
    },
  ];

  if (user && showBalances) {
    items.push(
      { label: "Available balance", value: formatCurrency(user.available_balance) },
      { label: "Lifetime earnings", value: formatCurrency(user.lifetime_earnings) }
    );
  }

  return (
    <div className="space-y-3">
      <DetailList items={items} />
      <Button size="sm" variant="outline" render={<Link href={`/users/${userId}`} />}>
        View creator
      </Button>
    </div>
  );
}
