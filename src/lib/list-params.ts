/**
 * The listing contract every admin endpoint in cliptech-api shares:
 * `?page&limit&search&from&to` plus whatever filters that resource adds
 * (`status` for users, `role` for admins, and so on).
 *
 * Keeping this in one place means a new resource's table gets URL-synced
 * paging, search and date filtering by naming its extra filter keys, and
 * that the SSR prefetch and the client hook derive identical params - and
 * therefore identical query keys - from the same URL.
 */

/** Mirrors shared.DefaultPageSize / shared.MaxPageSize in the Go code. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export type ListParams = {
  page: number;
  limit: number;
  search: string;
  /** ISO date (YYYY-MM-DD) lower bound on created_at. */
  from: string;
  /** ISO date (YYYY-MM-DD) upper bound; the API widens it to end-of-day. */
  to: string;
  /** Resource-specific filters, e.g. `{ status: "active" }`. */
  filters: Record<string, string>;
};

/** A plain object of search params, as a Server Component receives them. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function readOne(params: RawSearchParams | URLSearchParams, key: string): string {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? "";
  }
  const value = params[key];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function readInt(
  params: RawSearchParams | URLSearchParams,
  key: string,
  fallback: number
): number {
  const parsed = Number.parseInt(readOne(params, key), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Reads params off a URL. Out-of-range values fall back rather than throwing:
 * a hand-edited `?page=abc` should show page one, not an error page.
 */
export function parseListParams(
  params: RawSearchParams | URLSearchParams,
  filterKeys: readonly string[] = []
): ListParams {
  const filters: Record<string, string> = {};
  for (const key of filterKeys) {
    const value = readOne(params, key);
    if (value) filters[key] = value;
  }

  return {
    page: readInt(params, "page", 1),
    limit: Math.min(readInt(params, "limit", DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
    search: readOne(params, "search"),
    from: readOne(params, "from"),
    to: readOne(params, "to"),
    filters,
  };
}

/** Flattens params into the query object `ApiFetcher` sends upstream. */
export function listParamsToQuery(params: ListParams) {
  return {
    page: params.page,
    limit: params.limit,
    search: params.search,
    from: params.from,
    to: params.to,
    ...params.filters,
  };
}

/**
 * Back to a query string for the address bar. Defaults are omitted so the
 * untouched view has a clean URL, and the key order is fixed so the same
 * state always produces the same string (and so React doesn't see a "new"
 * URL for an unchanged view).
 */
export function listParamsToSearchString(params: ListParams): string {
  const search = new URLSearchParams();

  if (params.page > 1) search.set("page", String(params.page));
  if (params.limit !== DEFAULT_PAGE_SIZE) search.set("limit", String(params.limit));
  if (params.search) search.set("search", params.search);
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);

  for (const key of Object.keys(params.filters).sort()) {
    if (params.filters[key]) search.set(key, params.filters[key]);
  }

  return search.toString();
}

/**
 * Applies a partial change. Anything that narrows the result set resets to
 * page one - staying on page 5 while filtering down to three rows shows an
 * empty table and looks like a bug.
 */
export function mergeListParams(
  current: ListParams,
  patch: Partial<Omit<ListParams, "filters">> & { filters?: Record<string, string> }
): ListParams {
  const next: ListParams = {
    ...current,
    ...patch,
    filters: patch.filters ? { ...current.filters, ...patch.filters } : current.filters,
  };

  const narrowed =
    patch.search !== undefined ||
    patch.from !== undefined ||
    patch.to !== undefined ||
    patch.filters !== undefined ||
    patch.limit !== undefined;

  if (narrowed && patch.page === undefined) {
    next.page = 1;
  }

  return next;
}

export function isFiltered(params: ListParams): boolean {
  return Boolean(
    params.search ||
      params.from ||
      params.to ||
      Object.values(params.filters).some(Boolean)
  );
}

export function emptyListParams(filterKeys: readonly string[] = []): ListParams {
  return parseListParams({}, filterKeys);
}
