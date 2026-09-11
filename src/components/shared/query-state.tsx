"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorPanel } from "@/components/shared/error-panel";

/**
 * The loading / failed / empty triple every query-backed panel needs, so each
 * one doesn't invent its own wording - and so a 401 reads as "your session
 * expired" rather than a raw status code, which is the one failure an admin
 * can actually act on.
 */
export function QueryState({
  isLoading,
  loadingFallback,
  error,
  isEmpty,
  emptyMessage = "Nothing to show.",
  onRetry,
  children,
}: {
  isLoading?: boolean;
  /**
   * A skeleton shaped like what is actually loading. The three generic lines
   * below are right for a short panel and wrong for a page of stat cards or a
   * long form, where they collapse the layout and let it jump when data
   * lands - so anything substantial passes its own.
   */
  loadingFallback?: ReactNode;
  error?: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div aria-busy="true">
        {loadingFallback ?? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorPanel title={errorTitle(error)} description={errorMessage(error)}>
        {isUnauthorized(error) ? (
          // Middleware can't catch this one: the cookie is present, it is just
          // no longer accepted. Signing in again is the only fix, so offer it
          // rather than a retry that will fail identically.
          <SignInAgainButton />
        ) : (
          onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )
        )}
      </ErrorPanel>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
}

/** Returns the admin to where they were once they have signed in again. */
function SignInAgainButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const next = query ? `${pathname}?${query}` : pathname;

  return (
    <Button variant="outline" size="sm" render={<Link href={`/login?next=${encodeURIComponent(next)}`} />}>
      Sign in
    </Button>
  );
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function errorTitle(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired";
    if (error.status === 403) return "You don't have access to this";
    if (error.status === 404) return "Not found";
  }
  return "Something went wrong";
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sign in again to continue.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
