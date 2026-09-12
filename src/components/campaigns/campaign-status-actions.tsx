"use client";

import * as React from "react";
import { Archive, Check, ChevronDown, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, humanise } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import {
  useApproveCampaignMutation,
  useArchiveCampaignMutation,
  useChangeCampaignStatusMutation,
  useRejectCampaignMutation,
} from "@/hooks/use-campaigns";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { SUPER_ADMIN_ROLE } from "@/schemas/admin";
import { isAwaitingApproval, type Campaign, type CampaignStatus } from "@/schemas/campaign";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

/** What each move actually does, so nobody has to infer it from the verb. */
const consequences: Partial<Record<CampaignStatus, string>> = {
  active: "Creators can find it and submit posts to it.",
  pending_approval:
    "Sends it to a super admin to sign off on the budget. Still hidden from creators.",
  paused: "Hidden from creators and taking no new posts. Approved posts keep tracking.",
  submissions_closed:
    "Stays visible and keeps tracking what is already in, but takes no new posts.",
  ended:
    "Stops the campaign for good. It cannot be reopened, and settlement will credit whatever it still owes.",
  completed: "Marks settlement finished.",
};

/**
 * The lifecycle control.
 *
 * The moves offered come from the campaign's own `next_statuses`, which the
 * API computes from its transition table - so this never shows an option the
 * API would refuse, and never needs updating when that table changes.
 *
 * Ending is irreversible and archiving files a campaign away, so both confirm.
 */
export function CampaignStatusActions({ campaign }: { campaign: Campaign }) {
  const [pendingStatus, setPendingStatus] = React.useState<CampaignStatus | null>(null);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [approveOpen, setApproveOpen] = React.useState(false);

  const changeStatus = useChangeCampaignStatusMutation(campaign.id);
  const archive = useArchiveCampaignMutation(campaign.id);
  const approve = useApproveCampaignMutation(campaign.id);
  const reject = useRejectCampaignMutation(campaign.id);

  const { data: me } = useAdminMeQuery();
  const isSuperAdmin = me?.roles.includes(SUPER_ADMIN_ROLE) ?? false;
  const awaitingApproval = isAwaitingApproval(campaign);

  const canReview = awaitingApproval && isSuperAdmin;

  // Archiving has its own endpoint, so it is a button rather than one of the
  // menu's transitions even though the API lists it as one.
  const asButton: CampaignStatus[] = ["archived"];
  if (awaitingApproval) asButton.push("active");
  if (canReview) asButton.push("draft");

  const transitions = campaign.next_statuses.filter((status) => !asButton.includes(status));
  const canArchive = campaign.next_statuses.includes("archived");

  function confirmed(action: Promise<unknown>, success: string) {
    return action.then(
      () => toast.success(success),
      (error: unknown) => {
        toast.error(errorMessage(error));
        throw error;
      }
    );
  }

  const toasted = (success: string) => ({
    onSuccess: () => toast.success(success),
    onError: (error: unknown) => toast.error(errorMessage(error)),
  });

  if (transitions.length === 0 && !canArchive && !canReview) {
    return null;
  }

  return (
    <>
      {transitions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="outline" disabled={changeStatus.isPending}>
                {changeStatus.isPending ? "Updating…" : "Change status"}
                <ChevronDown />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-72">
            {transitions.map((status) => (
              <DropdownMenuItem
                key={status}
                variant={status === "ended" ? "destructive" : undefined}
                onClick={() =>
                  status === "ended"
                    ? setPendingStatus(status)
                    : changeStatus.mutate(
                        status,
                        toasted(`Campaign ${humanise(status).toLowerCase()}`)
                      )
                }
              >
                <div className="min-w-0">
                  <p className="font-medium">{humanise(status)}</p>
                  {consequences[status] && (
                    <p className="text-muted-foreground text-xs whitespace-normal">
                      {consequences[status]}
                    </p>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {canReview && (
        <>
          <Button onClick={() => setApproveOpen(true)} disabled={approve.isPending}>
            <Check />
            {approve.isPending ? "Approving…" : "Approve"}
          </Button>
          <Button
            variant="outline"
            onClick={() => reject.mutate(undefined, toasted("Campaign returned to draft"))}
            disabled={reject.isPending}
          >
            <Undo2 />
            {reject.isPending ? "Rejecting…" : "Send back to draft"}
          </Button>
        </>
      )}

      {canArchive && (
        <Button variant="outline" onClick={() => setArchiveOpen(true)}>
          <Archive />
          Archive
        </Button>
      )}

      <ConfirmDialog
        open={pendingStatus === "ended"}
        onOpenChange={(open) => setPendingStatus(open ? "ended" : null)}
        title={`End ${campaign.name}?`}
        description={consequences.ended}
        confirmLabel="End campaign"
        onConfirm={() => changeStatus.mutate("ended", toasted("Campaign ended"))}
      />

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title={`Approve ${campaign.name}?`}
        description={`Signs off on a budget of ${formatCurrency(campaign.total_budget)} and takes the campaign live, so creators can start submitting posts to it.`}
        confirmLabel="Approve and go live"
        destructive={false}
        onConfirm={() => confirmed(approve.mutateAsync(), "Campaign approved and live")}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${campaign.name}?`}
        description="Files it away from the working lists. Only a settled campaign can be archived, so nothing is still owed."
        confirmLabel="Archive"
        destructive={false}
        onConfirm={() => confirmed(archive.mutateAsync(), "Campaign archived")}
      />
    </>
  );
}
