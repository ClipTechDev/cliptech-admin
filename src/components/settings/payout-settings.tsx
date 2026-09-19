"use client";

import {
  MAX_BATCH_LIMIT,
  MAX_MINIMUM_WITHDRAWAL,
  type Settings,
} from "@/schemas/settings";
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
        <NumberField
          control={control}
          name="payout.minimum_withdrawal"
          label="Minimum withdrawal"
          fallback={defaults.payout.minimum_withdrawal}
          max={MAX_MINIMUM_WITHDRAWAL}
          step="0.01"
          description="The smallest amount a creator can request in one withdrawal. Applies to new requests straight away; requests already in the queue are unaffected."
        />
        <DurationField
          control={control}
          name="payout.settlement_grace"
          label="Settlement grace"
          fallback={defaults.payout.settlement_grace}
          description="No longer in effect. Settlement is now released by hand from the campaign page, so an ended campaign waits for an admin rather than for this timer — which also means the window to invalidate a bad submission is open until you release it."
        />
        <NumberField
          control={control}
          name="payout.batch_limit"
          label="Batch limit"
          fallback={defaults.payout.batch_limit}
          max={MAX_BATCH_LIMIT}
          description="Campaigns considered per lifecycle run — the pass that ends campaigns which have run past their end date or their budget."
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
              No longer in effect. Creators are no longer paid part-way through a
              campaign at these marks — everything a campaign owes is credited in one
              go when an admin releases it. Reverts to{" "}
              <Fallback>{defaults.payout.snapshot_thresholds.join(", ")}</Fallback>.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
