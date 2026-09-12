"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { formatDateTime, humanise } from "@/lib/format";
import { emptyListParams } from "@/lib/list-params";
import { actionLogsListOptions } from "@/hooks/use-action-logs";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { SUPER_ADMIN_ROLE } from "@/schemas/admin";
import { ACTION_BADGE_VARIANTS } from "@/schemas/action-log";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IdLink } from "@/components/shared/id-link";

/**
 * The last few audit-log entries that mention this record, inline on its
 * detail view — "who touched this and when" without a trip to /action-logs.
 *
 * The log holds no structured link to the record it describes: every id it
 * concerns is written into the `summary` prose, so this is a `search=<id>`
 * against that text — the same query the full page runs, capped to a handful
 * of rows. Reading the log is super-admin only, so for anyone else this
 * renders nothing rather than an empty panel or a 403.
 */
export function RecordActivity({
  recordId,
  limit = 5,
  variant = "plain",
  className,
}: {
  recordId: string;
  /** How many entries to show inline before the "view all" link. */
  limit?: number;
  /** `card` on a detail page that lays out in cards; `plain` inside a sheet. */
  variant?: "plain" | "card";
  className?: string;
}) {
  const { data: me } = useAdminMeQuery();
  const isSuperAdmin = Boolean(me?.roles.includes(SUPER_ADMIN_ROLE));

  const params = { ...emptyListParams(), search: recordId, limit };
  const query = useQuery({
    ...actionLogsListOptions(params),
    // Different records must not flash each other's history under a new
    // heading while the next request is in flight.
    placeholderData: undefined,
    enabled: isSuperAdmin && Boolean(recordId),
  });

  // Not a permission the rest of the page needs to know about — it just isn't
  // here for anyone who can't read the log.
  if (!isSuperAdmin) return null;

  const logs = query.data?.logs ?? [];

  let body: React.ReactNode;
  if (query.isLoading) {
    body = (
      <div className="space-y-3" aria-hidden>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    );
  } else if (query.isError) {
    body = (
      <p className="text-muted-foreground text-sm">
        Couldn&rsquo;t load the activity for this record.
      </p>
    );
  } else if (logs.length === 0) {
    body = (
      <p className="text-muted-foreground text-sm">
        No changes have been recorded against this record.
      </p>
    );
  } else {
    body = (
      <>
        <ol className="space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="flex min-w-0 gap-3 text-sm">
              <Badge
                variant={ACTION_BADGE_VARIANTS[log.action] ?? "secondary"}
                className="mt-0.5 shrink-0"
              >
                {humanise(log.action)}
              </Badge>
              <div className="min-w-0 space-y-0.5">
                <p className="break-words">{log.summary}</p>
                <p className="text-muted-foreground text-xs">
                  <span title={formatDateTime(log.created_at)}>
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                  {" · by "}
                  <IdLink
                    href={`/admins/${log.admin_id}`}
                    id={log.admin_id}
                    className="inline"
                  />
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href={`/action-logs?search=${encodeURIComponent(recordId)}`}
          className="text-muted-foreground hover:text-foreground mt-3 inline-block text-xs hover:underline"
        >
          View all activity
        </Link>
      </>
    );
  }

  const heading = (
    <>
      <History className="text-muted-foreground size-4" />
      Recent activity
    </>
  );

  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">{heading}</CardTitle>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    );
  }

  return (
    <section className={cn("min-w-0 space-y-3", className)}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">{heading}</h3>
      {body}
    </section>
  );
}
