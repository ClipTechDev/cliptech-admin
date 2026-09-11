import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A UUID as a link to the record it names, shortened to its first segment.
 *
 * Several admin listings carry only an id for a related record - a payout
 * request knows its creator's id, not their name, because resolving the name
 * needs a role the payout screens don't require. Showing all 36 characters
 * would swamp the column, so the head is shown and the whole thing is the
 * title, which is what makes it copyable and searchable.
 *
 * Clicks are stopped from bubbling: these sit in rows that navigate or open a
 * sheet on click, and following the link should not also do that.
 */
export function IdLink({
  href,
  id,
  className,
}: {
  href: string;
  id: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      title={id}
      className={cn("text-muted-foreground text-xs hover:underline", className)}
      onClick={(event) => event.stopPropagation()}
    >
      <code>{id.slice(0, 8)}</code>
    </Link>
  );
}
