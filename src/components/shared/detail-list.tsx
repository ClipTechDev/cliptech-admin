import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DetailItem = {
  label: string;
  value: ReactNode;
  /** Span both columns - for a note, a long id, anything that needs room. */
  wide?: boolean;
};

/**
 * Label/value grid for the read-only half of a detail page. A description
 * list rather than a table: these are attributes of one record, not rows.
 */
export function DetailList({
  items,
  className,
}: {
  items: DetailItem[];
  className?: string;
}) {
  return (
    <dl className={cn("grid min-w-0 gap-x-8 gap-y-4 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("min-w-0 space-y-1", item.wide && "sm:col-span-2")}
        >
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {item.label}
          </dt>
          <dd className="text-sm break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
