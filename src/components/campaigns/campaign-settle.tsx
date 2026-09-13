"use client";

import * as React from "react";
import { BadgeCheck, Banknote } from "lucide-react";
import { toast } from "sonner";

import { formatCurrency, formatDateTime } from "@/lib/format";
import { useSettleCampaignMutation } from "@/hooks/use-campaigns";
import type { Campaign } from "@/schemas/campaign";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/components/shared/query-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

/**
 * The release control.
 *
 * Nothing else credits a creator: earnings accrue as views are tracked and sit
 * pending until this runs, so this button is the moment money becomes
 * withdrawable. It is one-way and pays everyone at once, hence the confirm
 * carrying the amount and the head count.
 */
export function CampaignSettle({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = React.useState(false);
  const settle = useSettleCampaignMutation(campaign.id);

  if (campaign.settled_at) {
    return (
      <div className="text-muted-foreground flex items-start gap-2 text-sm">
        <BadgeCheck className="mt-0.5 size-4 shrink-0" />
        <p>
          Earnings released {formatDateTime(campaign.settled_at)}. Creators can withdraw
          their share.
        </p>
      </div>
    );
  }

  if (!campaign.can_settle) {
    return (
      <p className="text-muted-foreground text-sm">
        {formatCurrency(campaign.accrued_amount)} accrued so far. Earnings stay pending
        until the campaign has ended and you release them.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        This campaign has ended with {formatCurrency(campaign.accrued_amount)} owed to
        creators. Releasing credits every approved submission and retires the campaign.
      </p>

      <Button onClick={() => setOpen(true)} disabled={settle.isPending}>
        <Banknote />
        Release earnings
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive={false}
        title={`Release ${formatCurrency(campaign.accrued_amount)} to creators?`}
        description="Every approved submission is credited and the money becomes withdrawable straight away. The campaign is marked completed and this cannot be undone, so invalidate any bad submissions first."
        confirmLabel="Release earnings"
        onConfirm={() =>
          settle.mutateAsync().then(
            (response) => {
              toast.success(
                `Released ${formatCurrency(response.credited)} to ${response.submissions} submissions`
              );
            },
            (error: unknown) => {
              toast.error(errorMessage(error));
              throw error;
            }
          )
        }
      />
    </div>
  );
}
