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
  configured: boolean;
  /** Why it is not configured - which environment variables are missing. */
  config_detail?: string;

  total: number;
  connected: number;
  auth_failed: number;
  disconnected: number;
  /** Connected accounts whose token has already lapsed; a reconnect fixes it. */
  expired: number;
  /** Connected, valid, but inside the 72h window before expiry. */
  expiring_soon: number;

  last_failure_at: string | null;
};

export type SocialHealthResponse = {
  success: boolean;
  platforms: PlatformHealth[];
};

export type PlatformHealthState = "unconfigured" | "failing" | "degraded" | "ok";

/**
 * How one integration reads at a glance. Not configured comes first: nothing
 * else on the row matters if the credentials aren't set. Then live auth
 * failures, then merely expired tokens, which a creator reconnecting clears.
 */
export function platformHealthState(row: PlatformHealth): PlatformHealthState {
  if (!row.configured) return "unconfigured";
  if (row.auth_failed > 0) return "failing";
  if (row.expired > 0) return "degraded";
  return "ok";
}
