import { cookies } from "next/headers";

import { env, ADMIN_COOKIE_NAME } from "@/lib/env";
import {
  buildQuery,
  parseResponse,
  type ApiFetcher,
  type ApiRequestOptions,
} from "@/lib/api-client";

/**
 * Server-side fetcher: calls cliptech-api directly and hand-forwards the
 * admin session cookie read from the incoming request.
 *
 * It deliberately does NOT go through /api/proxy. The proxy exists to give
 * the *browser* a same-origin door; routing the server through it would mean
 * an extra HTTP hop to ourselves and needing an absolute URL for our own app.
 *
 * Server Components only - `cookies()` throws anywhere else. Anything that
 * runs in both places should take an `ApiFetcher` and be handed this one from
 * the server side. Reading cookies also opts the calling page into dynamic
 * rendering, which is what we want: these pages are per-admin by definition.
 */
export const serverFetch: ApiFetcher = async <T,>(
  path: string,
  { body, query, headers, ...init }: ApiRequestOptions = {}
): Promise<T> => {
  const token = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;

  const response = await fetch(`${env.serverApiUrl}/v1${path}${buildQuery(query)}`, {
    ...init,
    // Admin data is per-session and mutable; a cached SSR fetch would serve
    // one admin's view to the next request.
    cache: "no-store",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Cookie: `${ADMIN_COOKIE_NAME}=${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response, path);
};
