import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PowerOff,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/schemas/system";
import { Button } from "@/components/ui/button";

/**
 * The one fact that decides whether anything below matters.
 *
 * Four states, not two, because they are four different situations and only
 * one of them is a problem: jobs switched off for this replica (topology),
 * paused by an operator (deliberate), unhealthy (act now), or fine. Collapsing
 * the first two into "not running" would send somebody looking for a fault
 * that isn't there.
 */
export function StatusBanner({ status }: { status: SystemStatus }) {
  if (!status.worker_enabled) {
    return (
      <Banner
        tone="muted"
        icon={PowerOff}
        title="Background jobs are not running on this replica"
        body="WORKER_ENABLED is off here. That is deployment topology rather than a setting, and another replica may well be doing the work — the figures below are whatever was last written to the database."
      />
    );
  }

  if (status.worker_paused) {
    return (
      <Banner
        tone="warning"
        icon={PauseCircle}
        title="Jobs are scheduled but paused"
        body="Nothing is being tracked or credited. The jobs are still on their timers — unpausing resumes them without a restart."
        action={
          <Button size="sm" variant="outline" render={<Link href="/settings" />}>
            Open settings
          </Button>
        }
      />
    );
  }

  if (!status.healthy) {
    return (
      <Banner
        tone="destructive"
        icon={AlertTriangle}
        title="At least one job is unhealthy"
        body="A job is either failing repeatedly or has not run within the window its interval implies. The rows below say which."
      />
    );
  }

  return (
    <Banner
      tone="ok"
      icon={CheckCircle2}
      title="All jobs healthy"
      body="Every job has run recently and none is failing."
    />
  );
}

function Banner({
  tone,
  icon: Icon,
  title,
  body,
  action,
}: {
  tone: "ok" | "warning" | "destructive" | "muted";
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-lg border p-4",
        tone === "destructive" && "border-destructive/40 bg-destructive/5",
        tone === "warning" && "border-amber-500/40 bg-amber-500/5",
        tone === "muted" && "border-dashed"
      )}
      // Announced when the poll flips it, so an admin watching this on a
      // second screen is told rather than having to notice.
      role="status"
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          tone === "destructive" && "text-destructive",
          tone === "warning" && "text-amber-600",
          tone === "muted" && "text-muted-foreground"
        )}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{body}</p>
      </div>
      {action}
    </div>
  );
}
