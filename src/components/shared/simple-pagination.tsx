"use client";

import { formatNumber } from "@/lib/format";
import type { PageMeta } from "@/schemas/common";
import { Button } from "@/components/ui/button";

/**
 * Prev/next paging for an embedded panel - a payout's entries, a campaign's
 * snapshots - where the full DataTable footer, with its page-size picker and
 * first/last jumps, would be more chrome than the panel deserves.
 *
 * Renders nothing when there is only one page, so a short list is not given a
 * footer that says "Page 1 of 1".
 */
export function SimplePagination({
  meta,
  onPageChange,
  /** What the total counts, for the summary line. Plural. */
  noun = "rows",
}: {
  meta: PageMeta | undefined;
  onPageChange: (page: number) => void;
  noun?: string;
}) {
  if (!meta || meta.total_pages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        Page {meta.page} of {meta.total_pages} · {formatNumber(meta.total)} {noun}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.has_prev}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.has_next}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
