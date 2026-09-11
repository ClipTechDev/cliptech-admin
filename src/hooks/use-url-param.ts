"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * One search param, read and written as state.
 *
 * Every listing that opens a record in a sheet keeps which record is open in
 * the URL rather than in React state, so the view can be linked to a
 * colleague and the back button closes the sheet instead of leaving the page.
 * Four screens were writing the same read/merge/replace by hand.
 *
 * Navigation is `replace`, not `push`: opening and closing three records in a
 * row should not put three entries in the back stack. Every other param on
 * the URL is preserved, so a sheet opened over a filtered table does not
 * clear the filters.
 */
export function useUrlParam(key: string): [string | null, (value: string | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = searchParams.get(key);

  const setValue = React.useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (next) params.set(key, next);
      else params.delete(key);

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, key]
  );

  return [value, setValue];
}
