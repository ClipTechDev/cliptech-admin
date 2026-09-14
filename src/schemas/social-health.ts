import type { SocialPlatform } from "@/schemas/social-account";

/**
 * Mirrors social.PlatformHealth (internal/features/social/health.go).
 *
 * One row per integration: whether it can be connected to at all, and how its
 * existing connections are holding up. A report, not an alarm - it answers 200
 * whatever it finds.
 */
export type PlatformHealth = {
  platform: SocialPlatform;
  /** Whether OAuth is configured. Kept under its original name. */
  configured: boolean;
  /** Why it is not configured - which environment variables are missing. */
  config_detail?: string;

  /** The same value as `configured`, under the name that now says which route. */
  oauth_configured: boolean;
  /**
   * Whether the platform can take a bio code at all. False for Instagram and
   * TikTok, which publish neither a bio nor a view count to app credentials -
   * so `code_configured` being false there is not a fault to report.
   */
  code_supported: boolean;
  /** Whether the app credential that reads public profiles is set. */
  code_configured: boolean;
  code_config_detail?: string;

  total: number;
  connected: number;
  auth_failed: number;
  disconnected: number;
  /** Connected OAuth accounts whose token has already lapsed. */
  expired: number;
  /** Connected OAuth accounts inside the 72h window before expiry. */
  expiring_soon: number;

  oauth_connected: number;
  code_connected: number;
  /** Code accounts whose handle is overdue a re-check; the sweep is behind. */
  stale_verification: number;

  last_failure_at: string | null;
  last_verification_at: string | null;
};

export type SocialHealthResponse = {
  success: boolean;
  platforms: PlatformHealth[];
};

export type PlatformHealthState =
  | "unconfigured"
  | "partial"
  | "failing"
  | "degraded"
  | "ok";

/**
 * How one integration reads at a glance.
 *
 * There are two ways in now, so "not configured" means neither is set - a
 * platform that takes bio codes but has no OAuth app still works, and saying
 * otherwise would send someone hunting a fault that isn't there. One route
 * missing is "partial". After that: live auth failures, then the merely
 * overdue - expired tokens and stale re-verifications, both of which clear
 * themselves once the creator or the sweep catches up.
 */
export function platformHealthState(row: PlatformHealth): PlatformHealthState {
  const codeUsable = row.code_supported && row.code_configured;

  if (!row.oauth_configured && !codeUsable) return "unconfigured";
  if (row.auth_failed > 0) return "failing";
  if (row.expired > 0 || row.stale_verification > 0) return "degraded";
  if (!row.oauth_configured || (row.code_supported && !row.code_configured)) {
    return "partial";
  }
  return "ok";
}

/**
 * Why a platform is only half set up, for the card to show instead of a bare
 * status. Returns null when both available routes are configured - including
 * on Instagram and TikTok, which have no code route to be missing.
 */
export function missingRoute(row: PlatformHealth): string | null {
  if (!row.oauth_configured && row.config_detail) return row.config_detail;
  if (row.code_supported && !row.code_configured && row.code_config_detail) {
    return row.code_config_detail;
  }
  return null;
}
