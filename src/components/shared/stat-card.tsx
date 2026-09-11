import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A single figure with its label. Deliberately not a chart: one number's job
 * is to be read, and a plot of it would be decoration.
 *
 * The value is tabular-nums so a row of these stays aligned as figures change.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** `muted` for a figure that is context rather than headline. */
  tone?: "default" | "muted";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-lg border p-4", className)}>
      <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-xl font-semibold tabular-nums",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </p>
      {hint && <p className="text-muted-foreground mt-1 truncate text-xs">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
