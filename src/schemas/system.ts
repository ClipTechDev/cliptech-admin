/**
 * Mirrors the system status payload (internal/features/system/handler.go).
 *
 * A report on the background workers, not on the API serving it - which is
 * why it answers 200 even when `healthy` is false.
 */

export type WorkerJob = {
  name: string;
  /** Seconds rather than a duration string: the API sends it for thresholding. */
  interval_seconds: number;

  last_run_at: string | null;
  last_success_at: string | null;
  last_duration_ms: number | null;

  last_error: string | null;
  last_error_at: string | null;
  consecutive_failures: number;

  /** The job has not run within the window its own interval implies. */
  stale: boolean;
};

export type SystemStatus = {
  /** The one field a monitor needs; the rest is for whoever comes looking. */
  healthy: boolean;
  /** WORKER_ENABLED - whether this deployment runs background jobs at all. */
  worker_enabled: boolean;
  /** The operational pause, which is the settings flag an admin can toggle. */
  worker_paused: boolean;
  jobs: WorkerJob[];
};

export type SystemStatusResponse = {
  success: boolean;
  status: SystemStatus;
};

/**
 * How a single job reads at a glance. Failing beats stale: a job that is
 * erroring is a different problem from one that simply has not woken up, and
 * the error is the more actionable of the two.
 */
export type JobHealth = "failing" | "stale" | "idle" | "ok";

export function jobHealth(job: WorkerJob): JobHealth {
  if (job.consecutive_failures > 0) return "failing";
  if (job.stale) return "stale";
  if (!job.last_run_at) return "idle";
  return "ok";
}
