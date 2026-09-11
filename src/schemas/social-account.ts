/**
 * Mirrors social.AccountResponse (internal/features/social/dto.go).
 *
 * Access and refresh tokens are absent by design - the admin endpoint reuses
 * the creator-facing response precisely so platform credentials stay out of
 * it - so there is nothing here to redact.
 */

export const SOCIAL_PLATFORMS = ["instagram", "twitter", "youtube", "tiktok"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_STATUSES = ["connected", "disconnected", "auth_failed"] as const;
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  platform_account_id: string;
  platform_username: string | null;
  status: SocialStatus;
  scopes: string[];
  needs_reconnect: boolean;
  token_expires_at: string | null;
  connected_at: string;
  last_connected_at: string | null;
  disconnected_at: string | null;
  last_error: string | null;
};

/** Unpaginated - a creator has at most one account per platform. */
export type SocialAccountsResponse = {
  success: boolean;
  accounts: SocialAccount[];
};
