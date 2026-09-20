"use client";

import * as React from "react";

import { useCampaignMembersQuery } from "@/hooks/use-eligibility";
import type { CampaignMemberStatus } from "@/schemas/eligibility";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/shared/query-state";
import { SimplePagination } from "@/components/shared/simple-pagination";
import { MemberCard } from "@/components/campaigns/campaign-members";

const FILTERS: { value: CampaignMemberStatus | ""; label: string }[] = [
  { value: "pending", label: "Waiting for review" },
  { value: "rejected", label: "Declined" },
  { value: "", label: "All" },
];

export function JoinRequests() {
  const [status, setStatus] = React.useState<CampaignMemberStatus | "">("pending");
  const [page, setPage] = React.useState(1);
  const members = useCampaignMembersQuery(null, status, page);
  const rows = members.data?.members ?? [];

  return (
    <div className="max-w-4xl min-w-0 space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => (
          <Button
            key={filter.label}
            size="sm"
            variant={status === filter.value ? "default" : "outline"}
            onClick={() => {
              setStatus(filter.value);
              setPage(1);
            }}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <QueryState
        isLoading={members.isPending}
        error={members.error}
        onRetry={() => void members.refetch()}
        isEmpty={rows.length === 0}
        emptyMessage={status === "pending" ? "No join requests waiting." : "Nothing here yet."}
      >
        <ul className="space-y-3">
          {rows.map((member) => (
            <MemberCard key={member.id} member={member} showCampaign />
          ))}
        </ul>
        <SimplePagination meta={members.data?.pagination} onPageChange={setPage} noun="requests" />
      </QueryState>
    </div>
  );
}
