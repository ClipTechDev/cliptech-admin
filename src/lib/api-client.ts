/**
 * Transport shared by every resource in this app.
 *
 * cliptech-api serves admin routes under `/v1/admin/...` behind an HttpOnly
 * cookie set on its own origin, so neither side of this app can talk to it
 * naively: the browser would be cross-origin, and the Next server can't read
 * a cookie scoped to the API's host. Two fetchers solve that, both speaking
 * the same `ApiFetcher` contract so a query's `queryFn` can be reused
 * verbatim between an SSR prefetch and the client hook that hydrates it:
 *
 * - `clientFetch` (here) goes through this app's own `/api/proxy` handler,
 *   which is same-origin, so the cookie rides along automatically.
 * - `serverFetch` (lib/api-server.ts) calls the API directly and forwards
 *   the cookie it reads from `next/headers`.
 *
 * Paths are written the way the API groups them, minus the version prefix:
 * `"/admin/users"`, not `"/v1/admin/users"`.
 */

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** Values that survive a round trip through a query string. */
export type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Appended as a query string; empty, null and undefined values are dropped. */
  query?: Record<string, QueryValue>;
};

export type ApiFetcher = <T>(path: string, options?: ApiRequestOptions) => Promise<T>;

/**
 * Serialises a query object, skipping anything the API would read as "no
 * filter" anyway. Dropping empties rather than sending `?search=` keeps query
 * keys stable, which matters because they're also cache identity.
 */
export function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  const serialised = params.toString();
  return serialised ? `?${serialised}` : "";
}

/**
 * Turns a Response into either the decoded payload or an ApiError carrying
 * the API's own `message`, which every failure envelope in cliptech-api sets.
 */
export async function parseResponse<T>(response: Response, path: string): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : null) ?? `Request to ${path} failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

/** Browser-side fetcher. Same-origin via the proxy, so the session cookie is sent. */
export const clientFetch: ApiFetcher = async <T,>(
  path: string,
  { body, query, headers, ...init }: ApiRequestOptions = {}
): Promise<T> => {
  // A FormData body is passed through untouched: the browser sets its own
  // multipart Content-Type with the boundary, which we must not override, and
  // it must not be JSON-serialised.
  const isMultipart = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(`/api/proxy${path}${buildQuery(query)}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(body !== undefined && !isMultipart ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body:
      body === undefined
        ? undefined
        : isMultipart
          ? (body as FormData)
          : JSON.stringify(body),
  });

  return parseResponse<T>(response, path);
};
