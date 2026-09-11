"use client";

import { Trash2 } from "lucide-react";

import { formatDateTime, humanise, orDash } from "@/lib/format";
import { useUserPayoutMethodsQuery } from "@/hooks/use-users";
import { payoutDetailPairs, type AdminPayoutMethod } from "@/schemas/withdrawal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList } from "@/components/shared/detail-list";
import { QueryState } from "@/components/shared/query-state";

function MethodCard({ method }: { method: AdminPayoutMethod }) {
  const details = payoutDetailPairs(method.details);

  return (
    <Card className={method.deleted_at ? "opacity-70" : undefined}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{orDash(method.label)}</span>
          <Badge variant="secondary">{humanise(method.method)}</Badge>
          {method.is_default && <Badge>Default</Badge>}
          {method.deleted_at && (
            <Badge variant="outline">
              <Trash2 />
              Removed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DetailList
          items={[
            ...details.map((pair) => ({
              label: humanise(pair.key),
              value: <span className="break-all">{pair.value}</span>,
            })),
            { label: "Added", value: formatDateTime(method.created_at) },
            { label: "Last updated", value: formatDateTime(method.updated_at) },
            ...(method.deleted_at
              ? [{ label: "Removed", value: formatDateTime(method.deleted_at) }]
              : []),
          ]}
        />
      </CardContent>
    </Card>
  );
}

/**
 * A creator's saved payout destinations, read-only.
 *
 * There is no admin endpoint to edit or remove one on a creator's behalf - a
 * payout target is theirs to manage - so this is here to be checked against a
 * questioned transfer, not acted on. Removed methods are shown too, greyed,
 * because a past transfer may point at one.
 */
export function UserPayoutMethods({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useUserPayoutMethodsQuery(userId);

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={data?.length === 0}
      emptyMessage="This creator hasn't saved a payout method."
      onRetry={() => void refetch()}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.map((method) => <MethodCard key={method.id} method={method} />)}
      </div>
    </QueryState>
  );
}
