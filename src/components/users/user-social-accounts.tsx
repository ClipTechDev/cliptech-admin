"use client";

import { AlertTriangle, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { formatDateTime, humanise, orDash, platformLabel } from "@/lib/format";
import { useReverifyAccountMutation } from "@/hooks/use-social-claims";
import { useUserSocialAccountsQuery } from "@/hooks/use-users";
import type { SocialAccount, SocialStatus } from "@/schemas/social-account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList } from "@/components/shared/detail-list";
import { errorMessage, QueryState } from "@/components/shared/query-state";

const statusVariants: Record<SocialStatus, "default" | "secondary" | "destructive"> = {
  connected: "default",
  disconnected: "secondary",
  auth_failed: "destructive",
};

/**
 * An OAuth account and a code-verified one carry different fields, so the list
 * differs rather than showing a column of em-dashes: a code account has no
 * token expiry and no scopes, and is held by its handle resolving to the same
 * account id instead.
 */
function detailsFor(account: SocialAccount) {
  const shared = [
    { label: "Username", value: orDash(account.platform_username) },
    { label: "Platform account ID", value: account.platform_account_id },
    { label: "Connected", value: formatDateTime(account.connected_at) },
  ];

  if (account.verification_method === "code") {
    return [
      ...shared,
      { label: "Verified handle", value: orDash(account.verification_handle) },
      { label: "Verified", value: formatDateTime(account.verified_at) },
      { label: "Last re-checked", value: formatDateTime(account.last_verified_at) },
      { label: "Disconnected", value: formatDateTime(account.disconnected_at) },
    ];
  }

  return [
    ...shared,
    { label: "Last connected", value: formatDateTime(account.last_connected_at) },
    { label: "Token expires", value: formatDateTime(account.token_expires_at) },
    { label: "Disconnected", value: formatDateTime(account.disconnected_at) },
    {
      label: "Scopes",
      value: account.scopes.length ? account.scopes.join(", ") : "—",
      wide: true,
    },
  ];
}

function AccountCard({ account }: { account: SocialAccount }) {
  const byCode = account.verification_method === "code";
  const reverify = useReverifyAccountMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{platformLabel(account.platform)}</span>
          <Badge variant={statusVariants[account.status] ?? "secondary"}>
            {humanise(account.status)}
          </Badge>
          <Badge variant="outline">
            {byCode ? <KeyRound /> : <ShieldCheck />}
            {byCode ? "Bio code" : "OAuth"}
          </Badge>
          {account.needs_reconnect && (
            <Badge variant="destructive">
              <AlertTriangle />
              {byCode ? "Needs re-verifying" : "Needs reconnect"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailList
          items={[
            ...detailsFor(account),
            ...(account.last_error
              ? [
                  {
                    label: "Last error",
                    value: <span className="text-destructive">{account.last_error}</span>,
                    wide: true,
                  },
                ]
              : []),
          ]}
        />

        {byCode && (
          <Button
            variant="outline"
            size="sm"
            disabled={reverify.isPending}
            onClick={() =>
              reverify.mutate(account.id, {
                onSuccess: (response) =>
                  toast.success(
                    response.account.status === "connected"
                      ? "Still owned by this creator"
                      : `Re-verification failed: ${humanise(response.account.status)}`
                  ),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            {reverify.isPending && <Loader2 className="animate-spin" />}
            Re-verify now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Connected platforms.
 *
 * The response omits access and refresh tokens by design, so there is nothing
 * here to redact. The one action available is re-verifying a code-verified
 * account against its public profile, which reads and never writes a
 * credential; disconnecting on a creator's behalf still has no endpoint.
 */
export function UserSocialAccounts({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useUserSocialAccountsQuery(userId);

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={data?.length === 0}
      emptyMessage="This creator hasn't connected any platforms."
      onRetry={() => void refetch()}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((account) => <AccountCard key={account.id} account={account} />)}
      </div>
    </QueryState>
  );
}
