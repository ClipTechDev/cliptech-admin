/**
 * Removes the Domain attribute from a Set-Cookie the proxy is relaying.
 *
 * cliptech-api stamps its cookies with COOKIE_DOMAIN, which is set for the
 * creator-facing app's benefit and names a host that is very often not this
 * one. A browser rejects any cookie whose Domain isn't a suffix of the origin
 * that served it, so relaying it verbatim would silently drop the session -
 * login would appear to succeed and then do nothing.
 *
 * Dropping the attribute makes the cookie host-only on this app's origin,
 * which is exactly right for one we are re-hosting: it should be scoped to
 * the admin app and nothing else. Everything that carries security meaning -
 * HttpOnly, Secure, SameSite, Max-Age, Expires - passes through untouched.
 */
export function stripCookieDomain(cookie: string): string {
  return cookie
    .split(";")
    .filter((part) => !part.trimStart().toLowerCase().startsWith("domain="))
    .join(";");
}
