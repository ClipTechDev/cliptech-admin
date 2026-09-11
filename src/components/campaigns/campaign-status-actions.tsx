"use client";

import * as React from "react";
import { Archive, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { humanise } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import { useArchiveCampaignMutation, useChangeCampaignStatusMutation } from "@/hooks/use-campaigns";
import type { Campaign, CampaignStatus } from "@/schemas/campaign";
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

  const changeStatus = useChangeCampaignStatusMutation(campaign.id);
  const archive = useArchiveCampaignMutation(campaign.id);

  // Archiving has its own endpoint, so it is a button rather than one of the
  // menu's transitions even though the API lists it as one.
  const transitions = campaign.next_statuses.filter((status) => status !== "archived");
  const canArchive = campaign.next_statuses.includes("archived");

  function apply(status: CampaignStatus) {
    changeStatus.mutate(status, {
      onSuccess: () => toast.success(`Campaign ${humanise(status).toLowerCase()}`),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  if (transitions.length === 0 && !canArchive) {
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
                  status === "ended" ? setPendingStatus(status) : apply(status)
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
        onConfirm={() => apply("ended")}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${campaign.name}?`}
        description="Files it away from the working lists. Only a settled campaign can be archived, so nothing is still owed."
        confirmLabel="Archive"
        destructive={false}
        onConfirm={() =>
          archive.mutateAsync().then(
            () => toast.success("Campaign archived"),
            (error) => {
              toast.error(errorMessage(error));
              throw error;
            }
          )
        }
      />
    </>
  );
}
