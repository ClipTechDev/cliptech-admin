"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { platformLabel } from "@/lib/format";
import { SOCIAL_PLATFORMS } from "@/schemas/social-account";
import type { ExportFilter } from "@/schemas/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignPicker } from "@/components/exports/campaign-picker";

export type FilterValues = Partial<Record<ExportFilter, string>>;

/**
 * The shared filter bar above the reports.
 *
 * Every control maps to a query param one or more of the reports reads; each
 * row below picks out the ones that apply to it and ignores the rest. Shared
 * rather than per-report because an admin narrowing to last month wants that
 * range on whichever file they end up taking.
 */
export function ExportFilters({
  values,
  onChange,
  campaignId,
  onCampaignChange,
  onReset,
  showReset,
}: {
  values: FilterValues;
  onChange: (key: ExportFilter, value: string) => void;
  campaignId: string;
  onCampaignChange: (id: string) => void;
  onReset: () => void;
  showReset: boolean;
}) {
  return (
    <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field
        label="Date range"
        htmlFor="export-date-range"
        className="sm:col-span-2"
      >
        <DateRangePicker
          id="export-date-range"
          from={values.from}
          to={values.to}
          onChange={({ from, to }) => {
            onChange("from", from);
            onChange("to", to);
          }}
          placeholder="Any date"
        />
      </Field>

      <Field label="Campaign" htmlFor="export-campaign">
        <CampaignPicker
          id="export-campaign"
          value={campaignId}
          onChange={onCampaignChange}
        />
      </Field>

      <Field label="Platform" htmlFor="export-platform">
        <Select
          value={values.platform || "all"}
          onValueChange={(value) => onChange("platform", value === "all" ? "" : String(value))}
        >
          <SelectTrigger id="export-platform" className="w-full">
            <SelectValue>
              {(value) =>
                !value || value === "all" ? "All platforms" : platformLabel(String(value))
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {SOCIAL_PLATFORMS.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platformLabel(platform)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Creator ID"
        htmlFor="export-user"
        hint="Narrows the submissions and withdrawals files to one creator."
      >
        <Input
          id="export-user"
          value={values.user_id ?? ""}
          placeholder="Paste a user id"
          onChange={(event) => onChange("user_id", event.target.value.trim())}
        />
      </Field>

      {showReset && (
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
