"use client";

import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A listing narrowed to one record, shown as a control instead of being left
 * implicit in the URL.
 *
 * The id filters these tables accept - `?user_id=` on withdrawals, feedback
 * and submissions - can't be a dropdown: there is no bounded list of creators
 * to choose from, so the filter is set by following a link from the record
 * itself. This is the other half of that. It says whose rows are on screen,
 * links back to them, and can be taken off again, which is what stops a
 * scoped table from looking like the whole table.
 */
export function ScopeFilter({
  label,
  name,
  href,
  onClear,
}: {
  /** What kind of record the listing is pinned to, e.g. "Creator". */
  label: string;
  /** Its name, or its id if the name couldn't be resolved. */
  name: string;
  href: string;
  onClear: () => void;
}) {
  return (
    <div className="border-input flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-dashed pr-1 pl-2.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <Link href={href} className="min-w-0 truncate font-medium hover:underline">
        {name}
      </Link>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClear}
        aria-label={`Clear ${label.toLowerCase()} filter`}
      >
        <X />
      </Button>
    </div>
  );
}
