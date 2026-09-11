"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  emptyListParams,
  listParamsToSearchString,
  mergeListParams,
  parseListParams,
  type ListParams,
} from "@/lib/list-params";

/**
 * Client half of the URL-as-table-state pattern: reads the same params the
 * Server Component parsed for its prefetch, and writes changes back to the
 * address bar.
 *
 * The URL is the single source of truth rather than React state, so a
 * filtered view is shareable, survives a refresh, and lands in history - and
 * so the server's prefetched page and the client's query key can never drift.
 *
 * Navigation is `replace`, not `push`: typing eight characters into a search
 * box should not put eight entries in the back stack.
 */
export function useListParams(filterKeys: readonly string[] = []) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // filterKeys is nearly always an inline literal, so a fresh array arrives on
  // every parent render. Keying the memo on its contents instead of its
  // identity stops that from re-parsing the params (and re-rendering) endlessly.
  const keySignature = filterKeys.join(",");
  const keys = React.useMemo(() => keySignature.split(",").filter(Boolean), [keySignature]);

  const params = React.useMemo(
    () => parseListParams(searchParams, keys),
    [searchParams, keys]
  );

  const navigate = React.useCallback(
    (next: ListParams) => {
      const query = listParamsToSearchString(next);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const setParams = React.useCallback(
    (patch: Parameters<typeof mergeListParams>[1]) => navigate(mergeListParams(params, patch)),
    [navigate, params]
  );

  const reset = React.useCallback(
    () => navigate(emptyListParams(keys)),
    [navigate, keys]
  );

  return { params, setParams, reset };
}
