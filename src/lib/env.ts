const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const env = {
  /**
   * Base URL server-side code (Server Components, the /api/proxy handler)
   * uses to reach cliptech-api. Override with API_URL when this app and the
   * API share a private network and shouldn't round-trip through the public
   * hostname; falls back to the public URL so local dev needs one env var.
   *
   * There is deliberately no browser-facing base URL any more: the browser
   * talks to /api/proxy on this origin, never to the API directly.
   */
  serverApiUrl: process.env.API_URL ?? publicApiUrl,
};

/**
 * The session cookie cliptech-api issues on admin login. Mirrors
 * shared.AdminCookieName in the Go code - if that constant changes, this
 * must change with it.
 */
export const ADMIN_COOKIE_NAME = "cliptech_admin_token";
