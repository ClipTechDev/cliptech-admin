"use client";

import { Download, Lock } from "lucide-react";

import { humanise } from "@/lib/format";
import { exportUrl, type ExportReport } from "@/schemas/export";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { FilterValues } from "@/components/exports/export-filters";

/**
 * One report, and whether it can be taken right now.
 *
 * A download can be unavailable for two quite different reasons - the admin
 * lacks the role, or the report needs a campaign and none is chosen - and a
 * disabled button that says neither is the kind of dead end that gets
 * reported as a bug. Each says which, on the button itself rather than only
 * in the filters column, because that column is hidden on a phone.
 */
export function ExportRow({
  report,
  filters,
  campaignId,
  permitted,
}: {
  report: ExportReport;
  filters: FilterValues;
  campaignId: string;
  permitted: boolean;
}) {
  const href = exportUrl(report, filters, campaignId);
  const needsCampaign = Boolean(report.requiresCampaign && !campaignId);

  // Only the filters this report actually reads, so the row tells the truth
  // about what the file will contain.
  const applied = report.filters
    .filter((filter) => filters[filter])
    .map((filter) => `${humanise(filter.replace(/_id$/, ""))}: ${filters[filter]}`);

  return (
    <TableRow>
      <TableCell className="align-top">
        <p className="font-medium">{report.name}</p>
        <p className="text-muted-foreground mt-1 max-w-md text-xs">{report.description}</p>
      </TableCell>

      <TableCell className="hidden align-top md:table-cell">
        {report.requiresCampaign ? (
          <span className="text-muted-foreground text-xs">
            {campaignId ? "One campaign" : "Pick a campaign above"}
          </span>
        ) : applied.length === 0 ? (
          <span className="text-muted-foreground text-xs">Everything</span>
        ) : (
          <ul className="space-y-1">
            {applied.map((line) => (
              <li key={line} className="text-muted-foreground text-xs">
                {line}
              </li>
            ))}
          </ul>
        )}
      </TableCell>

      <TableCell className="align-top">
        <Badge variant={permitted ? "outline" : "secondary"}>{humanise(report.role)}</Badge>
      </TableCell>

      <TableCell className="text-right align-top">
        {!permitted ? (
          <Button
            size="sm"
            variant="ghost"
            disabled
            title={`Needs the "${report.role}" role.`}
          >
            <Lock />
            No access
          </Button>
        ) : !href || needsCampaign ? (
          <div className="flex flex-col items-end gap-1">
            <Button size="sm" variant="outline" disabled>
              <Download />
              CSV
            </Button>
            <span className="text-muted-foreground text-xs">Choose a campaign</span>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            // A plain link, not a fetch: the browser has to see the
            // Content-Disposition the proxy relays for this to save rather
            // than render, and pulling it through JS would buffer a streamed
            // export whole in memory first.
            //
            // In a new tab because an error response has no attachment
            // header: a 403 or a 500 would otherwise navigate this page to
            // raw JSON and lose whatever the admin was doing. On success the
            // tab closes itself once the download starts.
            render={<a href={href} target="_blank" rel="noopener noreferrer" />}
          >
            <Download />
            CSV
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
