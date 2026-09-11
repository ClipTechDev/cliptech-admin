"use client";

import * as React from "react";

import { useCampaignsQuery } from "@/hooks/use-campaigns";
import { emptyListParams } from "@/lib/list-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Campaigns to pick from, for the one report scoped to a single campaign.
 *
 * Capped at the API's page maximum rather than paged: this is a convenience
 * for the common case, and a campaign's own page carries the same download
 * for anything older than the hundred most recent.
 */
export function CampaignPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (campaignId: string) => void;
}) {
  // Memoised on nothing: a fresh object each render would be a new query key
  // every time the parent re-renders, which is every keystroke in the filters.
  const params = React.useMemo(() => ({ ...emptyListParams(), limit: 100 }), []);
  const { data, isLoading } = useCampaignsQuery(params);

  const campaigns = data?.campaigns ?? [];
  const names = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));

  const placeholder = isLoading ? "Loading campaigns..." : "No campaign chosen";

  return (
    <Select
      value={value || "none"}
      onValueChange={(next) => onChange(next === "none" ? "" : String(next))}
    >
      <SelectTrigger id={id} className="w-full">
        {/* Base UI renders the raw value unless given a render function,
            which would print a uuid rather than the campaign's name. */}
        <SelectValue>
          {(selected) =>
            !selected || selected === "none"
              ? placeholder
              : (names.get(String(selected)) ?? "Selected campaign")
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No campaign chosen</SelectItem>
        {campaigns.map((campaign) => (
          <SelectItem key={campaign.id} value={campaign.id}>
            {campaign.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
