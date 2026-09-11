import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import { formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * One rollup on the overview, headed by its own name, its total, and the way
 * through to the listing behind it - so a figure that looks wrong is one
 * click from the rows that produced it.
 */
export function DashboardSection({
  title,
  icon: Icon,
  href,
  count,
  countLabel,
  children,
}: {
  title: string;
  icon: LucideIcon;
  href: string;
  count: number;
  /** Qualifies the badge where the total alone would mislead, e.g. "open". */
  countLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading flex items-center gap-2 text-sm font-semibold">
          <Icon className="text-muted-foreground size-4" />
          {title}
          <Badge variant="secondary" className="tabular-nums">
            {formatNumber(count)}
            {countLabel ? ` ${countLabel}` : ""}
          </Badge>
        </h2>
        <Button variant="outline" size="sm" render={<Link href={href} />}>
          View all
          <ArrowRight />
        </Button>
      </div>
      {children}
    </section>
  );
}
