"use client";

import {
  MAX_BATCH_LIMIT,
  MAX_FAILURE_RUNS,
  MAX_RESOLVE_PAGES,
  type Settings,
} from "@/schemas/settings";
import { DetailSection } from "@/components/shared/detail-section";
import {
  DurationField,
  Grid,
  NumberField,
  type SettingsControl,
} from "@/components/settings/settings-fields";

/** Reading view counts: how much work one run takes on, and how often. */
export function TrackingSettingsFields({
  control,
  defaults,
}: {
  control: SettingsControl;
  defaults: Settings;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <DetailSection
        title="Work per run"
        description="How much one pass of the tracking job takes on, and how long it holds what it claimed."
      >
        <Grid>
          <NumberField
            control={control}
            name="tracking.batch_limit"
            label="Batch limit"
            fallback={defaults.tracking.batch_limit}
            max={MAX_BATCH_LIMIT}
            description="Posts claimed per platform, per run."
          />
          <DurationField
            control={control}
            name="tracking.lease"
            label="Lease"
            fallback={defaults.tracking.lease}
            description="How long a claimed post is hidden from other runs. Must outlast the tracking interval, or two workers can read the same posts and both record a reading."
          />
          <NumberField
            control={control}
            name="tracking.max_failures"
            label="Max failures"
            fallback={defaults.tracking.max_failures}
            max={MAX_FAILURE_RUNS}
            description="Consecutive failed reads before a post is invalidated. A post that is provably gone is invalidated on sight regardless."
          />
          <DurationField
            control={control}
            name="tracking.max_backoff"
            label="Max backoff"
            fallback={defaults.tracking.max_backoff}
            description="Caps the retry wait for a failing post, so one broken post cannot hold a slot forever."
          />
        </Grid>
      </DetailSection>

      <DetailSection
        title="Polling cadence"
        description="How often one post is re-read, tightening as its campaign approaches its budget. The gap between two reads is the window a campaign can overspend in, so these must narrow in order: critical ≤ near ≤ base."
      >
        <Grid>
          <DurationField
            control={control}
            name="tracking.base_interval"
            label="Base interval"
            fallback={defaults.tracking.base_interval}
            description="Plenty of budget left."
          />
          <DurationField
            control={control}
            name="tracking.near_interval"
            label="Near interval"
            fallback={defaults.tracking.near_interval}
            description="Past the near ratio."
          />
          <DurationField
            control={control}
            name="tracking.critical_interval"
            label="Critical interval"
            fallback={defaults.tracking.critical_interval}
            description="Past the critical ratio."
          />
        </Grid>
        <Grid>
          <NumberField
            control={control}
            name="tracking.near_ratio"
            label="Near ratio"
            fallback={defaults.tracking.near_ratio}
            step="0.01"
            description="Share of budget committed at which the cadence first steps up. Must be below the critical ratio."
          />
          <NumberField
            control={control}
            name="tracking.critical_ratio"
            label="Critical ratio"
            fallback={defaults.tracking.critical_ratio}
            step="0.01"
            description="Where it steps up again — at most 1."
          />
        </Grid>
      </DetailSection>

      <DetailSection
        title="Token refresh windows"
        description="How far ahead of expiry each platform's token is refreshed. Per-platform because the tokens are not one length: Instagram's lasts sixty days, TikTok's a day, Google's an hour."
      >
        <Grid>
          <DurationField
            control={control}
            name="tracking.instagram_refresh_window"
            label="Instagram"
            fallback={defaults.tracking.instagram_refresh_window}
          />
          <DurationField
            control={control}
            name="tracking.tiktok_refresh_window"
            label="TikTok"
            fallback={defaults.tracking.tiktok_refresh_window}
          />
          <DurationField
            control={control}
            name="tracking.youtube_refresh_window"
            label="YouTube"
            fallback={defaults.tracking.youtube_refresh_window}
          />
          <NumberField
            control={control}
            name="tracking.instagram_resolve_pages"
            label="Instagram resolve pages"
            fallback={defaults.tracking.instagram_resolve_pages}
            max={MAX_RESOLVE_PAGES}
            description="Instagram has no shortcode lookup, so finding a post means paging back through a creator's media. This is where that walk gives up."
          />
        </Grid>
      </DetailSection>
    </div>
  );
}
