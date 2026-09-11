"use client";

import * as React from "react";

/**
 * Trails `value` by `delay` ms. Used to keep a search box responsive while
 * the request (and the URL rewrite behind it) only fires once the admin
 * stops typing.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
