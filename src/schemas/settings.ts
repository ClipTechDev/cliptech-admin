import { z } from "zod";

/**
 * Mirrors config.Settings and settings.Response
 * (internal/config/settings.go, internal/features/settings/dto.go).
 *
 * These are the background jobs' operational knobs - the values an operator
 * changes without a deploy. Durations cross the wire as Go duration strings
 * ("5m", "1h30m"), not as numbers, so they stay readable in the settings file
 * this API rewrites.
 */

export type WorkerSettings = {
  paused: boolean;
  instagram_tracking_interval: string;
  twitter_tracking_interval: string;
  tiktok_tracking_interval: string;
  youtube_tracking_interval: string;
  refresh_interval: string;
  reverify_interval: string;
  credit_interval: string;
  /**
   * Read-only here: settings.WorkerPatch has no field for it, so the API
   * accepts no change to it over this route. Shown because an operator
   * reading the page still needs to know the cadence.
   */
  notify_interval: string;
  startup_delay: string;
};

export type TrackingSettings = {
  batch_limit: number;
  lease: string;
  max_failures: number;

  base_interval: string;
  near_interval: string;
  critical_interval: string;
  near_ratio: number;
  critical_ratio: number;
  max_backoff: string;

  instagram_refresh_window: string;
  tiktok_refresh_window: string;
  youtube_refresh_window: string;
  code_reverify_window: string;
  instagram_resolve_pages: number;
};

export type PayoutSettings = {
  settlement_grace: string;
  batch_limit: number;
  large_snapshot_warning: number;
  snapshot_thresholds: number[];
  minimum_withdrawal: number;
};

export type Settings = {
  worker: WorkerSettings;
  tracking: TrackingSettings;
  payout: PayoutSettings;
};

export type SettingsResponse = {
  success: boolean;
  message?: string;
  /** Which fields the save touched, as the API's audit trail recorded them. */
  changed?: string[];
  settings: {
    /** Where the settings file lives on the box, for whoever has to look. */
    file: string;
    settings: Settings;
    defaults: Settings;
  };
};

/**
 * A Go duration, as time.ParseDuration reads one: a run of number+unit pairs,
 * optionally signed. Validated here only to catch a typo before the round
 * trip - config.ValidateSettings is the real check, and its message (which
 * names the offending field and its bounds) is what the form surfaces.
 */
const DURATION = /^[+-]?(\d+(\.\d+)?(ns|us|µs|μs|ms|s|m|h))+$/;

const duration = z
  .string()
  .trim()
  .regex(DURATION, 'Use a duration like "30s", "5m" or "1h30m"');

const count = (label: string, max: number) =>
  z
    .number({ message: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .max(max, `${label} must be at most ${max}`);

const ratio = z
  .number({ message: "Must be a number" })
  .gt(0, "Must be above 0")
  .lte(1, "Must be at most 1");

/**
 * Mirrors the bounds in config.ValidateSettings. Duplicated deliberately: the
 * API rejects out-of-range values regardless, but catching them here means an
 * operator sees the limit next to the field rather than as a toast after a
 * failed save.
 */
export const MAX_BATCH_LIMIT = 5000;
export const MAX_FAILURE_RUNS = 50;
export const MAX_RESOLVE_PAGES = 50;
export const MAX_MINIMUM_WITHDRAWAL = 1_000_000;

const minimumWithdrawal = z
  .number({ message: "Minimum withdrawal must be a number" })
  .min(0.01, "Minimum withdrawal must be at least 0.01")
  .max(MAX_MINIMUM_WITHDRAWAL, `Minimum withdrawal must be at most ${MAX_MINIMUM_WITHDRAWAL}`)
  .refine(
    (value) => Number.isInteger(Number((value * 100).toFixed(6))),
    "Minimum withdrawal supports at most 2 decimal places"
  );

/**
 * Thresholds are typed as a comma-separated list - "25, 50, 75, 100" - which
 * is how an operator thinks of them.
 *
 * Validated in place rather than transformed to numbers, so the form's input
 * and output types stay identical: react-hook-form's Control is invariant in
 * its transformed type, and a diverging one would not fit the shared
 * FormField. The parse happens in settingsFormDiff instead, which is the only
 * place the numbers are actually needed.
 *
 * The API wants ascending, unique, ending at 100. The first two are checked
 * here because a repeat is a typo; the last because forgetting it silently
 * means creators are only paid when a campaign ends.
 */
const thresholds = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const parts = splitThresholds(value);

    if (parts.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Needs at least one threshold, or creators are only paid when a campaign ends",
      });
      return;
    }

    let previous = 0;
    for (const part of parts) {
      const threshold = Number(part);
      if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
        ctx.addIssue({
          code: "custom",
          message: `"${part}" is not a percentage between 1 and 100`,
        });
        return;
      }
      if (threshold <= previous) {
        ctx.addIssue({
          code: "custom",
          message: `Must ascend without repeats - ${threshold} follows ${previous}`,
        });
        return;
      }
      previous = threshold;
    }

    if (previous !== 100) {
      ctx.addIssue({
        code: "custom",
        message:
          "Must end at 100, or a campaign that spends its budget while still running is never credited",
      });
    }
  });

function splitThresholds(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * The typed list as numbers. Only ever called on a value the schema above has
 * already accepted, so it does no validation of its own.
 */
export function parseThresholds(value: string): number[] {
  return splitThresholds(value).map(Number);
}

export const settingsFormSchema = z.object({
  worker: z.object({
    paused: z.boolean(),
    instagram_tracking_interval: duration,
    twitter_tracking_interval: duration,
    tiktok_tracking_interval: duration,
    youtube_tracking_interval: duration,
    refresh_interval: duration,
    reverify_interval: duration,
    credit_interval: duration,
    startup_delay: duration,
  }),
  tracking: z.object({
    batch_limit: count("Batch limit", MAX_BATCH_LIMIT),
    lease: duration,
    max_failures: count("Max failures", MAX_FAILURE_RUNS),
    base_interval: duration,
    near_interval: duration,
    critical_interval: duration,
    near_ratio: ratio,
    critical_ratio: ratio,
    max_backoff: duration,
    instagram_refresh_window: duration,
    tiktok_refresh_window: duration,
    youtube_refresh_window: duration,
    code_reverify_window: duration,
    instagram_resolve_pages: count("Resolve pages", MAX_RESOLVE_PAGES),
  }),
  payout: z.object({
    settlement_grace: duration,
    batch_limit: count("Batch limit", MAX_BATCH_LIMIT),
    large_snapshot_warning: count("Large snapshot warning", 1_000_000),
    snapshot_thresholds: thresholds,
    minimum_withdrawal: minimumWithdrawal,
  }),
});

/**
 * What the form holds. Input and output are the same shape by design - see
 * the note on `thresholds` - so there is one type here rather than two.
 */
export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function settingsFormDefaults(settings: Settings): SettingsFormValues {
  return {
    worker: {
      paused: settings.worker.paused,
      instagram_tracking_interval: settings.worker.instagram_tracking_interval,
      twitter_tracking_interval: settings.worker.twitter_tracking_interval,
      tiktok_tracking_interval: settings.worker.tiktok_tracking_interval,
      youtube_tracking_interval: settings.worker.youtube_tracking_interval,
      refresh_interval: settings.worker.refresh_interval,
      reverify_interval: settings.worker.reverify_interval,
      credit_interval: settings.worker.credit_interval,
      startup_delay: settings.worker.startup_delay,
    },
    tracking: { ...settings.tracking },
    payout: {
      settlement_grace: settings.payout.settlement_grace,
      batch_limit: settings.payout.batch_limit,
      large_snapshot_warning: settings.payout.large_snapshot_warning,
      snapshot_thresholds: settings.payout.snapshot_thresholds.join(", "),
      minimum_withdrawal: settings.payout.minimum_withdrawal,
    },
  };
}

/**
 * The PATCH body: only the sections and fields that changed.
 *
 * settings.UpdateRequest takes pointers all the way down, so an omitted field
 * means "don't touch it" - which is different from sending its current value,
 * because ChangedFields would then record every knob as moved in the audit
 * trail. An entirely empty patch is answered with ErrNoChanges, so the form
 * stops a no-op save before it becomes a confusing 400.
 */
export function settingsFormDiff(
  values: SettingsFormValues,
  current: Settings
): Record<string, Record<string, unknown>> {
  const patch: Record<string, Record<string, unknown>> = {};

  const worker = changedFields(values.worker, current.worker);
  if (worker) patch.worker = worker;

  const tracking = changedFields(values.tracking, current.tracking);
  if (tracking) patch.tracking = tracking;

  // Thresholds are held apart from the rest of the section: they are a string
  // in the form and an int array on the wire, so they cannot be compared or
  // copied by the same field-by-field pass as everything else.
  const payout = changedFields(
    { ...values.payout, snapshot_thresholds: undefined },
    { ...current.payout, snapshot_thresholds: undefined }
  );

  const nextThresholds = parseThresholds(values.payout.snapshot_thresholds);
  const thresholdsChanged = !sameNumbers(
    nextThresholds,
    current.payout.snapshot_thresholds
  );

  if (payout || thresholdsChanged) {
    patch.payout = { ...(payout ?? {}) };
    if (thresholdsChanged) {
      patch.payout.snapshot_thresholds = nextThresholds;
    }
  }

  return patch;
}

/** The fields of one section that differ, or undefined if none do. */
function changedFields(
  values: Record<string, unknown>,
  current: Record<string, unknown>
): Record<string, unknown> | undefined {
  const diff: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (value !== current[key]) diff[key] = value;
  }

  return Object.keys(diff).length > 0 ? diff : undefined;
}

function sameNumbers(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function hasSettingsChanges(
  values: SettingsFormValues,
  current: Settings
): boolean {
  return Object.keys(settingsFormDiff(values, current)).length > 0;
}
