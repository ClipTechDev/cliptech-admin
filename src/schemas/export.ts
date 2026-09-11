import { SUBMISSION_STATUSES } from "@/schemas/submission";
import { WITHDRAWAL_METHODS, WITHDRAWAL_STATUSES } from "@/schemas/withdrawal";

/**
 * The four CSV reports cliptech-api streams
 * (internal/features/export/routes.go, handler.go).
 *
 * Described as data rather than four hand-written download buttons, because
 * the differences between them are exactly three things - which filters each
 * accepts, which role it needs, and whether it is scoped to one campaign -
 * and a table is the honest way to show three columns of differences.
 *
 * `role` mirrors the RequireRoles each route is mounted behind. Each export
 * sits behind the role that owns the data it contains rather than a single
 * "exports" grant: a file of every creator's earnings is the same data as the
 * transactions screen, and downloading it should not be a quieter permission.
 */

/** The filter params a report reads off the query string. */
export type ExportFilter =
  | "from"
  | "to"
  | "campaign_id"
  | "user_id"
  | "platform"
  | "status"
  | "method";

export type ExportReport = {
  id: string;
  name: string;
  description: string;
  /** Path under /admin/exports, `:id` standing in for a campaign. */
  path: string;
  role: string;
  filters: readonly ExportFilter[];
  /** Needs a campaign chosen before it can be downloaded. */
  requiresCampaign?: boolean;
  /** Values a filter is restricted to, where the API validates a fixed set. */
  options?: Partial<Record<ExportFilter, readonly string[]>>;
};

export const EXPORT_REPORTS: readonly ExportReport[] = [
  {
    id: "submissions",
    name: "Submissions",
    description:
      "Every post with its views, earnings and review state. The widest report, and the one to reach for when reconciling a campaign by hand.",
    path: "/admin/exports/submissions.csv",
    role: "submissions",
    filters: ["campaign_id", "user_id", "platform", "status", "from", "to"],
    options: { status: SUBMISSION_STATUSES },
  },
  {
    id: "campaign-results",
    name: "Campaign results",
    description:
      "One campaign's final standings - each creator, what they posted and what it earned. Scoped to a single campaign, so pick one first.",
    path: "/admin/exports/campaigns/:id/results.csv",
    role: "campaigns",
    filters: [],
    requiresCampaign: true,
  },
  {
    id: "earnings",
    name: "Earnings",
    description:
      "The credit side of every creator's ledger over a date range. This is the same data as the transactions screen, in a form an accountant can open.",
    path: "/admin/exports/earnings.csv",
    role: "transactions",
    filters: ["from", "to"],
  },
  {
    id: "withdrawals",
    name: "Withdrawals",
    description:
      "Payout requests with their status, method and provider reference - the file to reconcile against a bank statement.",
    path: "/admin/exports/withdrawals.csv",
    role: "withdrawals",
    filters: ["user_id", "status", "method", "from", "to"],
    options: { status: WITHDRAWAL_STATUSES, method: WITHDRAWAL_METHODS },
  },
] as const;

/**
 * Builds the download URL for one report.
 *
 * It points at /api/proxy rather than the API directly: the session cookie is
 * HttpOnly on the API's origin, so a link straight there would download
 * nothing. The proxy relays the Content-Disposition header, which is what
 * makes the browser save the stream instead of rendering it.
 *
 * Only the filters a report actually reads are appended - sending `platform`
 * to the earnings report would be ignored, but it would also imply the file
 * was narrowed when it was not.
 */
export function exportUrl(
  report: ExportReport,
  values: Partial<Record<ExportFilter, string>>,
  campaignId?: string
): string | null {
  if (report.requiresCampaign && !campaignId) return null;

  const path = report.requiresCampaign
    ? report.path.replace(":id", encodeURIComponent(campaignId as string))
    : report.path;

  const query = new URLSearchParams();
  for (const filter of report.filters) {
    const value = values[filter];
    if (value) query.set(filter, value);
  }

  const serialised = query.toString();
  return `/api/proxy${path}${serialised ? `?${serialised}` : ""}`;
}
