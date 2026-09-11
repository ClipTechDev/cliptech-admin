"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/shared/error-panel";

/**
 * The boundary for everything inside the admin shell.
 *
 * Query failures are already handled where they happen - QueryState turns a
 * 401 or a 403 into something an admin can act on - so what reaches here is
 * the other kind: a component that threw while rendering. Catching it at the
 * group rather than at the root keeps the sidebar and the header on screen,
 * so one broken screen leaves the rest of the panel usable.
 *
 * `retry()` rather than `reset()`: it re-fetches the segment as well as
 * re-rendering it, and most of what throws here is downstream of data that a
 * second attempt may simply return.
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-md">
        <ErrorPanel
          title="This screen didn't load"
          description={
            // A throw inside a Server Component reaches the client with its
            // message replaced and the detail left in the digest, so both are
            // offered: one for the admin, one to quote when reporting it.
            error.message || "Something went wrong while rendering this page."
          }
        >
          <Button variant="outline" size="sm" onClick={() => retry()}>
            Try again
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/" />}>
            Back to dashboard
          </Button>
        </ErrorPanel>
        {error.digest && (
          <p className="text-muted-foreground mt-2 text-center text-xs">
            Reference <code>{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
