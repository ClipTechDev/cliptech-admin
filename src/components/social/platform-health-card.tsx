import { AlertTriangle, CheckCircle2, Clock, PlugZap } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime, formatNumber, platformLabel } from "@/lib/format";
import {
  platformHealthState,
  type PlatformHealth,
  type PlatformHealthState,
} from "@/schemas/social-health";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const state: Record<
  PlatformHealthState,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  unconfigured: { label: "Not configured", variant: "outline" },
  failing: { label: "Auth failing", variant: "destructive" },
  degraded: { label: "Tokens expired", variant: "destructive" },
  ok: { label: "Healthy", variant: "default" },
};

const icons: Record<PlatformHealthState, typeof CheckCircle2> = {
  unconfigured: PlugZap,
  failing: AlertTriangle,
  degraded: Clock,
  ok: CheckCircle2,
};

/** One figure in the card's tally. Emphasised only when it is a problem. */
function Figure({
  label,
  value,
  alert,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          alert && value > 0 && "text-destructive"
        )}
      >
        {formatNumber(value)}
      </p>
    </div>
  );
}

export function PlatformHealthCard({ row }: { row: PlatformHealth }) {
  const health = platformHealthState(row);
  const { label, variant } = state[health];
  const Icon = icons[health];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{platformLabel(row.platform)}</span>
          <Badge variant={variant}>
            <Icon />
            {label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {row.config_detail && (
          <p className="text-muted-foreground text-sm break-words">{row.config_detail}</p>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Figure label="Connected" value={row.connected} />
          <Figure label="Auth failed" value={row.auth_failed} alert />
          <Figure label="Expired" value={row.expired} alert />
          <Figure label="Expiring soon" value={row.expiring_soon} alert />
          <Figure label="Disconnected" value={row.disconnected} />
          <Figure label="Total" value={row.total} />
        </div>

        <p className="text-muted-foreground text-xs">
          Last auth failure: {formatDateTime(row.last_failure_at)}
        </p>
      </CardContent>
    </Card>
  );
}
