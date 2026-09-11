import { isServer, QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data comes from our own API, not the browser cache of a CDN, so a
        // short stale window avoids refetch storms without serving data that
        // is very obviously out of date.
        staleTime: 30 * 1000,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * One QueryClient per server request (never shared between requests), and a
 * single long-lived instance in the browser (so navigation keeps the cache).
 */
export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
