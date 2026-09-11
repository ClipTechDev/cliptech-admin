/**
 * Constrains a `?next=` value to a path inside this app.
 *
 * An unchecked redirect target is an open redirect: `?next=https://evil.example`
 * would send a freshly-signed-in admin somewhere else entirely, and the
 * login page is exactly where that is most worth doing. Only a single-slash
 * absolute path is allowed - `//host` is protocol-relative and leaves the
 * origin, and a backslash is normalised to a slash by some browsers.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
