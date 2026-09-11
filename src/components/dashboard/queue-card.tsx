import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A number somebody is waiting behind, linked to the rows that produced it.
 *
 * Distinct from StatCard, which reports a figure: these three are work, so
 * the whole card is a link into the filtered listing that clears it, and a
 * non-zero count gets a dot rather than a colour - the queue being non-empty
 * is normal, not an alarm.
 */
export function QueueCard({
  label,
  value,
  hint,
  href,
  urgent,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "hover:bg-muted/50 focus-visible:ring-ring min-w-0 rounded-lg border p-4",
        "transition-colors focus-visible:ring-2 focus-visible:outline-none"
      )}
    >
      <p className="text-muted-foreground flex items-center gap-2 truncate text-xs font-medium tracking-wide uppercase">
        {label}
        {urgent && (
          <span className="bg-primary size-1.5 shrink-0 rounded-full" aria-hidden="true" />
        )}
      </p>
      <p className="mt-1 truncate text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>
    </Link>
  );
}
