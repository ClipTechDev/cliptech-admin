import type { PageMeta } from "@/schemas/common";
import type { ListParams } from "@/lib/list-params";
import type { ServerPagination } from "@/components/data-table/data-table-pagination";

/** The subset of `setParams` a pagination footer needs. */
type PageSetter = (patch: { page?: number; limit?: number }) => void;

/**
 * Builds the `serverPagination` prop from the three things every URL-driven
 * listing already has: the params it parsed, the meta the API returned, and
 * the setter that writes changes back to the address bar.
 *
 * Every table was spelling this out identically, which is eight chances for
 * one of them to drift - and the fallbacks are the part worth getting right
 * once. `hasPrev` falls back to `page > 1` rather than to false so the arrows
 * stay usable while the first response is still in flight; `hasNext` cannot
 * be guessed the same way, because nothing here knows whether more rows
 * exist, so it stays false until the API says otherwise.
 */
export function serverPaginationFor(
  params: ListParams,
  meta: PageMeta | undefined,
  setParams: PageSetter
): ServerPagination {
  return {
    page: params.page,
    limit: params.limit,
    total: meta?.total ?? 0,
    totalPages: meta?.total_pages ?? 0,
    hasNext: meta?.has_next ?? false,
    hasPrev: meta?.has_prev ?? params.page > 1,
    onPageChange: (page) => setParams({ page }),
    onLimitChange: (limit) => setParams({ limit }),
  };
}

/**
 * The same, for a panel that keeps its page in local state rather than the
 * URL - an embedded table inside a tab or a sheet, where writing to the
 * address bar would collide with the listing params the page already owns.
 */
export function localPaginationFor(
  page: number,
  limit: number,
  meta: PageMeta | undefined,
  setPage: (page: number) => void,
  setLimit: (limit: number) => void
): ServerPagination {
  return {
    page,
    limit,
    total: meta?.total ?? 0,
    totalPages: meta?.total_pages ?? 0,
    hasNext: meta?.has_next ?? false,
    hasPrev: meta?.has_prev ?? page > 1,
    onPageChange: setPage,
    onLimitChange: (next) => {
      setLimit(next);
      // A page size change re-slices the whole listing, so the old page
      // number no longer points at the rows the admin was looking at.
      setPage(1);
    },
  };
}
