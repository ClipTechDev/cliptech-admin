/**
 * Display helpers shared across tables and detail pages, so a date or a
 * balance reads the same everywhere.
 *
 * All of these take the API's raw shape - including the nulls its pointer
 * fields serialise to - and return something safe to drop straight into JSX.
 */

const EM_DASH = "—";

export function formatDate(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH;

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return EM_DASH;
  return new Intl.NumberFormat().format(value);
}

/** Falls back to an em dash so an empty cell still occupies its column. */
export function orDash(value: string | null | undefined): string {
  return value && value.trim() ? value : EM_DASH;
}

/** "auth_failed" -> "Auth failed". For the API's snake_case enums. */
export function humanise(value: string): string {
  const spaced = value.replace(/[_-]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Platform names as the platforms spell them - humanise() would render the
 * API's lowercase enum as "Tiktok" and "Youtube", which are simply wrong.
 * "twitter" shows as X, matching what the API's own error messages call it.
 */
const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X",
};

export function platformLabel(platform: string): string {
  return platformLabels[platform] ?? humanise(platform);
}

export function formatHandle(username: string): string {
  const trimmed = username.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * Seconds back into the duration an operator wrote.
 *
 * The system status endpoint sends job intervals as a number because monitors
 * threshold on one, but "5m" is what sits in the settings file and what the
 * settings screen shows - so the two screens should not disagree about the
 * same value.
 */
export function formatInterval(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return EM_DASH;
  if (!Number.isFinite(seconds) || seconds <= 0) return EM_DASH;

  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = seconds / 60;
  if (minutes < 60) {
    return Number.isInteger(minutes) ? `${minutes}m` : `${minutes.toFixed(1)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes - hours * 60);
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}

/** Milliseconds as a duration, for the "how long did this job take" column. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return EM_DASH;
  if (ms < 1000) return `${formatNumber(ms)} ms`;
  return formatInterval(ms / 1000);
}

export function formatAgo(
  timestamp: number | null | undefined,
  now: number = Date.now()
): string | null {
  if (timestamp === null || timestamp === undefined) return null;
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;

  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}
