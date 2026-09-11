"use client";

import { AlertTriangle } from "lucide-react";

import { formatDateTime, humanise, orDash, platformLabel } from "@/lib/format";
import { useUserSocialAccountsQuery } from "@/hooks/use-users";
import type { SocialAccount, SocialStatus } from "@/schemas/social-account";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList } from "@/components/shared/detail-list";
import { QueryState } from "@/components/shared/query-state";

const statusVariants: Record<SocialStatus, "default" | "secondary" | "destructive"> = {
  connected: "default",
  disconnected: "secondary",
  auth_failed: "destructive",
};

function AccountCard({ account }: { account: SocialAccount }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{platformLabel(account.platform)}</span>
          <Badge variant={statusVariants[account.status] ?? "secondary"}>
            {humanise(account.status)}
          </Badge>
          {account.needs_reconnect && (
            <Badge variant="destructive">
              <AlertTriangle />
              Needs reconnect
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DetailList
          items={[
            { label: "Username", value: orDash(account.platform_username) },
            { label: "Platform account ID", value: account.platform_account_id },
            { label: "Connected", value: formatDateTime(account.connected_at) },
            { label: "Last connected", value: formatDateTime(account.last_connected_at) },
            { label: "Token expires", value: formatDateTime(account.token_expires_at) },
            { label: "Disconnected", value: formatDateTime(account.disconnected_at) },
            {
              label: "Scopes",
              value: account.scopes.length ? account.scopes.join(", ") : "—",
              wide: true,
            },
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
      </CardContent>
    </Card>
  );
}

/**
 * Connected platforms, read-only.
 *
 * The API has no admin endpoint to disconnect an account on a creator's
 * behalf, and its response omits access and refresh tokens by design - so
 * there is nothing to act on here, and nothing to redact.
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
