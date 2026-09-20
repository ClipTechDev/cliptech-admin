"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CircleHelp, RefreshCw, UserMinus, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatDateTime, formatHandle, platformLabel } from "@/lib/format";
import {
  useApproveMember,
  useCampaignMembersQuery,
  useReevaluateMembers,
  useRejectMember,
  useRemoveMember,
} from "@/hooks/use-eligibility";
import {
  MEMBER_STATUS_LABELS,
  type CampaignMember,
  type CampaignMemberStatus,
  type RuleResult,
} from "@/schemas/eligibility";
import type { Campaign } from "@/schemas/campaign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PromptDialog } from "@/components/shared/prompt-dialog";
import { QueryState, errorMessage } from "@/components/shared/query-state";
import { SimplePagination } from "@/components/shared/simple-pagination";

const FILTERS: { value: CampaignMemberStatus | ""; label: string }[] = [
  { value: "pending", label: "Waiting for review" },
  { value: "approved", label: "Joined" },
  { value: "rejected", label: "Declined" },
  { value: "removed", label: "Removed" },
  { value: "", label: "All" },
];

const STATUS_VARIANTS: Record<CampaignMemberStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  removed: "outline",
};

export function CampaignMembers({ campaign }: { campaign: Campaign }) {
  const [status, setStatus] = React.useState<CampaignMemberStatus | "">("pending");
  const [page, setPage] = React.useState(1);
  const members = useCampaignMembersQuery(campaign.id, status, page);
  const reevaluate = useReevaluateMembers(campaign.id);

  const rows = members.data?.members ?? [];

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => (
            <Button
              key={filter.label}
              size="sm"
              variant={status === filter.value ? "default" : "outline"}
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        {campaign.join_method !== "open" && (
          <Button
            size="sm"
            variant="outline"
            disabled={reevaluate.isPending}
            onClick={() =>
              reevaluate.mutate(undefined, {
                onSuccess: ({ report }) =>
                  toast.success(
                    `Re-checked ${report.checked}: ${report.approved} joined, ${report.rejected} declined, ${report.pending} still waiting`
                  ),
                onError: (error) => toast.error(errorMessage(error)),
              })
            }
          >
            <RefreshCw className={cn(reevaluate.isPending && "animate-spin")} />
            Re-check waiting requests
          </Button>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        {campaign.join_method === "open"
          ? "Anyone can join this campaign, so pages join instantly and nothing waits for review."
          : campaign.join_method === "criteria"
            ? "Pages that meet the requirements join on their own. Only the ones we couldn't check automatically wait here."
            : "Every page that asks to join waits here until you approve or decline it."}
      </p>

      <QueryState
        isLoading={members.isPending}
        error={members.error}
        onRetry={() => void members.refetch()}
        isEmpty={rows.length === 0}
        emptyMessage={status === "pending" ? "No join requests waiting." : "Nothing here yet."}
      >
        <ul className="space-y-3">
          {rows.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </ul>
        <SimplePagination meta={members.data?.pagination} onPageChange={setPage} noun="pages" />
      </QueryState>
    </div>
  );
}

export function MemberCard({
  member,
  showCampaign = false,
}: {
  member: CampaignMember;
  showCampaign?: boolean;
}) {
  const [dialog, setDialog] = React.useState<"reject" | "remove" | null>(null);
  const approve = useApproveMember();
  const reject = useRejectMember();
  const remove = useRemoveMember();
  const busy = approve.isPending || reject.isPending || remove.isPending;
  const results = member.evaluation?.results ?? [];

  return (
    <li className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">
              {member.username ? formatHandle(member.username) : "@unknown"}{" "}
              <span className="text-muted-foreground text-sm font-normal">
                on {platformLabel(member.platform)}
              </span>
            </p>
            <Badge variant={STATUS_VARIANTS[member.status]}>
              {MEMBER_STATUS_LABELS[member.status]}
            </Badge>
            {!member.connected && <Badge variant="outline">Page disconnected</Badge>}
          </div>
          {showCampaign && (
            <p className="text-sm">
              <span className="text-muted-foreground">Campaign: </span>
              <Link href={`/campaigns/${member.campaign_id}`} className="font-medium hover:underline">
                {member.campaign_name || member.campaign_id}
              </Link>
            </p>
          )}
          <p className="text-muted-foreground text-sm">
            <Link href={`/users/${member.user_id}`} className="hover:underline">
              {member.creator_name || member.creator_email || member.user_id}
            </Link>
            {member.creator_email && member.creator_name ? ` · ${member.creator_email}` : ""}
            {" · asked "}
            {formatDateTime(member.created_at)}
            {member.decided_by === "admin" && member.reviewed_at
              ? ` · decided by an admin ${formatDateTime(member.reviewed_at)}`
              : ""}
          </p>
          {member.rejection_reason && (
            <p className="text-sm">
              <span className="text-muted-foreground">Reason: </span>
              {member.rejection_reason}
            </p>
          )}
          {member.evaluation?.note && (
            <p className="text-muted-foreground text-xs">{member.evaluation.note}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {member.status !== "approved" && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                approve.mutate(
                  { id: member.id },
                  {
                    onSuccess: () => toast.success("Page approved — the creator can now submit"),
                    onError: (error) => toast.error(errorMessage(error)),
                  }
                )
              }
            >
              <Check />
              Approve
            </Button>
          )}
          {member.status === "pending" && (
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => setDialog("reject")}>
              <X />
              Decline
            </Button>
          )}
          {member.status === "approved" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialog("remove")}>
              <UserMinus />
              Remove from campaign
            </Button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <ul className="bg-muted/40 space-y-1 rounded-md p-3 text-sm">
          {results.map((result, index) => (
            <RuleResultLine key={`${result.rule_type}-${index}`} result={result} />
          ))}
        </ul>
      )}

      <PromptDialog
        open={dialog === "reject"}
        onOpenChange={(open) => setDialog(open ? "reject" : null)}
        title="Decline this page?"
        description="The creator is told why and cannot ask again with this page unless you approve it later."
        fieldLabel="Reason (the creator will see this)"
        placeholder="e.g. audience is mostly outside the target market"
        confirmLabel="Decline"
        multiline
        required
        destructive
        isPending={reject.isPending}
        onConfirm={(reason) =>
          reject.mutate(
            { id: member.id, body: { reason } },
            {
              onSuccess: () => {
                toast.success("Request declined");
                setDialog(null);
              },
              onError: (error) => toast.error(errorMessage(error)),
            }
          )
        }
      />
      <PromptDialog
        open={dialog === "remove"}
        onOpenChange={(open) => setDialog(open ? "remove" : null)}
        title="Remove this page from the campaign?"
        description="The creator can no longer submit new clips from this page. Clips already submitted keep tracking unless you reject them separately."
        fieldLabel="Reason (the creator will see this)"
        placeholder="Why is this page being removed?"
        confirmLabel="Remove"
        multiline
        required
        destructive
        isPending={remove.isPending}
        onConfirm={(reason) =>
          remove.mutate(
            { id: member.id, body: { reason } },
            {
              onSuccess: () => {
                toast.success("Page removed from the campaign");
                setDialog(null);
              },
              onError: (error) => toast.error(errorMessage(error)),
            }
          )
        }
      />
    </li>
  );
}

function RuleResultLine({ result }: { result: RuleResult }) {
  const icon =
    result.outcome === "pass" ? (
      <Check className="size-4 text-emerald-600" />
    ) : result.outcome === "unknown" ? (
      <CircleHelp className="text-muted-foreground size-4" />
    ) : (
      <X className="text-destructive size-4" />
    );

  const fact =
    result.fact !== undefined && result.fact !== null
      ? ` — actual: ${typeof result.fact === "number" ? result.fact.toLocaleString() : String(result.fact)}`
      : "";

  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>
        {result.description || result.label}
        <span className="text-muted-foreground">
          {fact}
          {result.outcome !== "pass" && result.reason && result.outcome !== "fail"
            ? ` — ${result.reason}`
            : ""}
        </span>
      </span>
    </li>
  );
}
