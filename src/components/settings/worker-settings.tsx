"use client";

import type { Settings } from "@/schemas/settings";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import {
  DurationField,
  Grid,
  ReadOnlyField,
  type SettingsControl,
} from "@/components/settings/settings-fields";

/** The scheduler's own cadence: how often each job wakes up and looks for work. */
export function WorkerSettingsFields({
  control,
  current,
  defaults,
}: {
  control: SettingsControl;
  current: Settings;
  defaults: Settings;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <FormField
        control={control}
        name="worker.paused"
        render={({ field }) => (
          <FormItem className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Pause every job</FormLabel>
              <FormDescription>
                Stops the jobs doing work while leaving them scheduled — for halting
                tracking and crediting during an incident.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <Grid>
        <DurationField
          control={control}
          name="worker.instagram_tracking_interval"
          label="Instagram tracker interval"
          fallback={defaults.worker.instagram_tracking_interval}
          description="How often the Instagram tracker looks for due posts."
        />
        <DurationField
          control={control}
          name="worker.twitter_tracking_interval"
          label="X tracker interval"
          fallback={defaults.worker.twitter_tracking_interval}
          description="How often the X tracker looks for due posts."
        />
        <DurationField
          control={control}
          name="worker.tiktok_tracking_interval"
          label="TikTok tracker interval"
          fallback={defaults.worker.tiktok_tracking_interval}
          description="How often the TikTok tracker looks for due posts."
        />
        <DurationField
          control={control}
          name="worker.youtube_tracking_interval"
          label="YouTube tracker interval"
          fallback={defaults.worker.youtube_tracking_interval}
          description="How often the YouTube tracker looks for due posts."
        />
        <DurationField
          control={control}
          name="worker.refresh_interval"
          label="Token refresh interval"
          fallback={defaults.worker.refresh_interval}
          description="How often expiring social tokens are swept."
        />
        <DurationField
          control={control}
          name="worker.reverify_interval"
          label="Re-verification interval"
          fallback={defaults.worker.reverify_interval}
          description="How often code-verified handles are re-checked against the account they were verified as."
        />
        <DurationField
          control={control}
          name="worker.credit_interval"
          label="Credit interval"
          fallback={defaults.worker.credit_interval}
          description="How often campaigns are checked for a crossed budget threshold."
        />
        <DurationField
          control={control}
          name="worker.startup_delay"
          label="Startup delay"
          fallback={defaults.worker.startup_delay}
          description="How long after boot the first run of each job fires, giving the connection pool time to fill."
        />
      </Grid>

      <ReadOnlyField
        label="Notify interval"
        value={current.worker.notify_interval}
        note="How often the notification outbox is drained. Read-only: settings.WorkerPatch has no field for it, so the API accepts no change to it over this route — it is set in the settings file on the box."
      />
    </div>
  );
}
