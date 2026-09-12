import { ShieldAlert, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { APPROVAL_THRESHOLD, isAwaitingApproval, type Campaign } from "@/schemas/campaign";
import { IdLink } from "@/components/shared/id-link";

export function CampaignApprovalNotice({ campaign }: { campaign: Campaign }) {
  const awaiting = isAwaitingApproval(campaign);

  if (!campaign.needs_approval && !campaign.approved_at) return null;

  const Icon = campaign.needs_approval ? ShieldAlert : ShieldCheck;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-sm",
        campaign.needs_approval && "border-primary/30 bg-primary/5"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-1">
        {campaign.needs_approval ? (
          <>
            <p className="font-medium">
              {awaiting ? "Waiting on a super admin" : "Needs a super admin to approve it"}
            </p>
            <p className="text-muted-foreground">
              Its {formatCurrency(campaign.total_budget)} budget is above the{" "}
              {formatCurrency(APPROVAL_THRESHOLD)} limit, so it stays hidden from creators
              until a super admin signs off.
              {!awaiting && " Send it for approval from Change status."}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">
              Budget of {formatCurrency(campaign.approved_budget)} approved
            </p>
            <p className="text-muted-foreground flex flex-wrap items-center gap-1">
              {formatDateTime(campaign.approved_at)}
              {campaign.approved_by && (
                <>
                  <span aria-hidden>·</span>
                  <IdLink
                    href={`/admins/${campaign.approved_by}`}
                    id={campaign.approved_by}
                    className="text-xs"
                  />
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
