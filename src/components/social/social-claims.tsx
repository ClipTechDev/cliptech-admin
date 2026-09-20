"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatDateTime, formatHandle, platformLabel } from "@/lib/format";
import { useReleaseClaimMutation, useSocialClaimsQuery } from "@/hooks/use-social-claims";
import type { SocialClaim } from "@/schemas/social-account";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorMessage, QueryState } from "@/components/shared/query-state";

/**
 * Bio-code verifications creators currently have open.
 *
 * The one thing to act on here is releasing a claim: a claim holds a handle
 * against the unique index, so somebody who started verifying an account they
 * do not own blocks the person who does until it expires. Releasing does not
 * disconnect anything - an unverified claim was never an account.
 */
export function SocialClaims() {
  const [page, setPage] = React.useState(1);
  const [releasing, setReleasing] = React.useState<SocialClaim | null>(null);

  const { data, isLoading, error, refetch } = useSocialClaimsQuery(page);
  const release = useReleaseClaimMutation();

  const claims = data?.claims ?? [];
  const meta = data?.pagination;

  // Releasing the last row on a later page would otherwise leave an empty
  // table with its pagination hidden, and no way back to page one.
  const strandedOnEmptyPage = claims.length === 0 && page > 1;

  function confirmRelease() {
    if (!releasing) return;

    release.mutate(releasing.id, {
      onSuccess: () => {
        toast.success(`Released ${formatHandle(releasing.handle)}`);
        setReleasing(null);
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  }

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={claims.length === 0 && page === 1}
      emptyMessage="No verifications are in progress."
      onRetry={() => void refetch()}
    >
      {strandedOnEmptyPage ? (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-6">
          <p className="text-muted-foreground text-sm">
            Nothing left on this page.
          </p>
          <Button variant="outline" size="sm" onClick={() => setPage(1)}>
            Back to the first page
          </Button>
        </div>
      ) : (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Handle</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead>Checks used</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium">{formatHandle(claim.handle)}</TableCell>
                <TableCell>{platformLabel(claim.platform)}</TableCell>
                <TableCell>
                  <Link
                    href={`/users/${claim.user_id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    View creator
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={claim.attempts_remaining === 0 ? "destructive" : "secondary"}>
                    {claim.attempts} used, {claim.attempts_remaining} left
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(claim.created_at)}</TableCell>
                <TableCell>{formatDateTime(claim.expires_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReleasing(claim)}
                  >
                    Release
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {meta && meta.total_pages > 1 && !strandedOnEmptyPage && (
        <div className="flex items-center justify-between gap-2 pt-3">
          <p className="text-muted-foreground text-sm">
            Page {meta.page} of {meta.total_pages} — {meta.total} open
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.has_prev}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.has_next}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={releasing !== null} onOpenChange={(open) => !open && setReleasing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Release {releasing ? formatHandle(releasing.handle) : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              The creator holding this verification loses the code they were
              given, and the handle is free for anyone to claim. Nothing that is
              already connected is affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={release.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={release.isPending} onClick={confirmRelease}>
              {release.isPending && <Loader2 className="animate-spin" />}
              Release
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </QueryState>
  );
}
