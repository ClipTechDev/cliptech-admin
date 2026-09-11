/**
 * Shapes cliptech-api returns on every listing, mirrored from
 * internal/shared/pagination.go.
 */

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

/** Every list endpoint answers `{ success, <resource>: [...], pagination }`. */
export type PaginatedResponse<TKey extends string, TItem> = {
  success: boolean;
  pagination: PageMeta;
} & { [K in TKey]: TItem[] };

export const EMPTY_PAGE_META: PageMeta = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false,
};
