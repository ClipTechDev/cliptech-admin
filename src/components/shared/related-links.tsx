import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export type RelatedLink = { href: string; label: string; icon: LucideIcon };

/**
 * The jumps from one record to the listings that can be narrowed to it.
 *
 * Every one of these is a link into a table that already takes the filter -
 * `/withdrawals?user_id=`, `/action-logs?admin_id=` - so nothing new is
 * fetched or endpointed here. It is what joins the panel up: "what has this
 * creator been paid" is answered from the creator's page rather than by
 * hand-editing a query string.
 *
 * Links an admin's roles don't cover are filtered out by the caller, the same
 * way the sidebar hides a section rather than showing it and then 403ing.
 */
export function RelatedLinks({
  label = "See also",
  links,
}: {
  label?: string;
  links: RelatedLink[];
}) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Button
            key={link.href}
            variant="outline"
            size="sm"
            render={<Link href={link.href} />}
          >
            <Icon />
            {link.label}
          </Button>
        );
      })}
    </div>
  );
}
