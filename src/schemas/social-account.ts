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

/**
 * Mirrors social.VerificationMethod. How the creator proved the account is
 * theirs: an OAuth grant, which leaves a token behind, or a code placed in the
 * public bio, which leaves none - so a code account has no token expiry and no
 * scopes, and is re-checked by re-resolving its handle instead.
 */
export const SOCIAL_VERIFICATION_METHODS = ["oauth", "code"] as const;
export type SocialVerificationMethod = (typeof SOCIAL_VERIFICATION_METHODS)[number];

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

  verification_method: SocialVerificationMethod;
  verification_handle: string | null;
  verified_at: string | null;
  last_verified_at: string | null;
};

/** Unpaginated - a creator has at most one account per platform. */
export type SocialAccountsResponse = {
  success: boolean;
  accounts: SocialAccount[];
};

/**
 * Mirrors social.AdminClaimResponse - a bio-code verification in progress.
 *
 * The code itself is absent by design: it is the creator's to place, and an
 * admin who could read it could verify somebody else's handle from a machine
 * that already holds their session.
 */
export type SocialClaim = {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  handle: string;
  platform_account_id: string;
  platform_username: string | null;
  attempts: number;
  attempts_remaining: number;
  expires_at: string;
  created_at: string;
};
