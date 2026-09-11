"use client";

import { MAX_BATCH_LIMIT, type Settings } from "@/schemas/settings";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  DurationField,
  Fallback,
  Grid,
  NumberField,
  type SettingsControl,
} from "@/components/settings/settings-fields";

/** Moving accrued money into creators' balances. */
export function PayoutSettingsFields({
  control,
  defaults,
}: {
  control: SettingsControl;
  defaults: Settings;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <Grid>
        <DurationField
          control={control}
          name="payout.settlement_grace"
          label="Settlement grace"
          fallback={defaults.payout.settlement_grace}
          description="How long an ended campaign waits before its final settlement. This is the only window in which a bad submission can still be invalidated — afterwards the money is in creators' balances and the ledger is append-only."
        />
        <NumberField
          control={control}
          name="payout.batch_limit"
          label="Batch limit"
          fallback={defaults.payout.batch_limit}
          max={MAX_BATCH_LIMIT}
          description="Campaigns considered per crediting run."
        />
        <NumberField
          control={control}
          name="payout.large_snapshot_warning"
          label="Large snapshot warning"
          fallback={defaults.payout.large_snapshot_warning}
          max={1_000_000}
          description="Entry count past which a snapshot is logged as unusually large. Crediting is one transaction per campaign, and that transaction has to stay a reasonable size."
        />
      </Grid>

      <FormField
        control={control}
        name="payout.snapshot_thresholds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Snapshot thresholds</FormLabel>
            <FormControl>
              <Input
                placeholder="25, 50, 75, 100"
                {...field}
                value={String(field.value ?? "")}
              />
            </FormControl>
            <FormDescription>
              The shares of budget at which creators are paid, ascending and ending at
              100. They are crossing points, not targets: a campaign passes 25% somewhere
              between two readings, and everything owed at that moment is credited.
              Without a mark at 100, a campaign that spends its whole budget while still
              running is never credited until it ends. Reverts to{" "}
              <Fallback>{defaults.payout.snapshot_thresholds.join(", ")}</Fallback>.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
