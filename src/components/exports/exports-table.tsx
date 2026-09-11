"use client";

import * as React from "react";

import { useAdminMeQuery } from "@/hooks/use-admin";
import { hasRole } from "@/schemas/admin";
import { EXPORT_REPORTS, type ExportFilter } from "@/schemas/export";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExportFilters, type FilterValues } from "@/components/exports/export-filters";
import { ExportRow } from "@/components/exports/export-row";

/**
 * The CSV downloads, as one table.
 *
 * A table rather than four cards because the reports differ in exactly three
 * ways - what they contain, which filters they read, and which role they need
 * - and columns are the honest way to show three columns of difference.
 *
 * Filter state is local rather than in the URL: it is a scratch pad for
 * building one download, not a view worth sharing, and putting it in the
 * address bar would suggest the page itself had been narrowed.
 */
export function ExportsTable() {
  const { data: admin } = useAdminMeQuery();
  const [filters, setFilters] = React.useState<FilterValues>({});
  const [campaignId, setCampaignId] = React.useState("");

  const anyFilter = Object.values(filters).some(Boolean) || Boolean(campaignId);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ExportFilters
        values={filters}
        onChange={(key: ExportFilter, value: string) =>
          setFilters((current) => ({ ...current, [key]: value }))
        }
        campaignId={campaignId}
        onCampaignChange={setCampaignId}
        onReset={() => {
          setFilters({});
          setCampaignId("");
        }}
        showReset={anyFilter}
      />

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report</TableHead>
              <TableHead className="hidden md:table-cell">Filters applied</TableHead>
              <TableHead>Needs</TableHead>
              <TableHead className="text-right">Download</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EXPORT_REPORTS.map((report) => (
              <ExportRow
                key={report.id}
                report={report}
                filters={filters}
                campaignId={campaignId}
                // Presentation only: the API re-checks the role on every
                // request, so a disabled button grants and protects nothing.
                // Defaults to permitted until /admin/me resolves, so the page
                // does not flash every row as locked.
                permitted={!admin || hasRole(admin, report.role)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        Files are streamed as they are built, so a large export starts downloading
        immediately and has no progress bar. Each is named with the moment it was
        requested.
      </p>
    </div>
  );
}
