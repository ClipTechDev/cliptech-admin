"use client";

import { Download, ExternalLink } from "lucide-react";

import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  humanise,
  platformLabel,
} from "@/lib/format";
import { useCampaignQuery } from "@/hooks/use-campaigns";
import { useUrlParam } from "@/hooks/use-url-param";
import { committed, type Campaign } from "@/schemas/campaign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RecordActivity } from "@/components/shared/record-activity";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailList } from "@/components/shared/detail-list";
import { PageHeader } from "@/components/shared/page-header";
import { QueryState } from "@/components/shared/query-state";
import { StatCard, StatGrid } from "@/components/shared/stat-card";
import { CampaignBudget } from "@/components/campaigns/campaign-budget";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { CampaignSnapshots } from "@/components/campaigns/campaign-snapshots";
import { CampaignStatusActions } from "@/components/campaigns/campaign-status-actions";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { SubmissionSheet } from "@/components/submissions/submission-sheet";
import { SubmissionsTable } from "@/components/submissions/submissions-table";

/**
 * The campaign tracking page.
 *
 * Ordered by what an admin opens it to find out, top to bottom: is it running
 * and what state can it move to; where has the money got to; then the posts
 * driving that, then the payouts that have already gone out, then the terms.
 *
 * Budget sits above the tabs rather than inside one because it is the answer
 * to "is this campaign healthy" and should never be a click away.
 */
export function CampaignDetail({ campaignId }: { campaignId: string }) {
  const { data: campaign, isLoading, error, refetch } = useCampaignQuery(campaignId);

  // The open submission lives in the URL, so a post under review can be
  // linked to a colleague without them having to hunt for it.
  const [openSubmission, setOpenSubmission] = useUrlParam("submission");

  return (
    <QueryState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
      {campaign && (
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <PageHeader
            title={
              <span className="flex flex-wrap items-center gap-3">
                {campaign.name}
                <CampaignStatusBadge status={campaign.status} />
                {campaign.accepts_submissions ? (
                  <Badge variant="secondary">Accepting posts</Badge>
                ) : (
                  <Badge variant="outline">Closed to new posts</Badge>
                )}
              </span>
            }
            description={
              <>
                {formatDateTime(campaign.starts_at)} — {formatDateTime(campaign.ends_at)}
                <span className="mx-2">·</span>
                {campaign.allowed_platforms.map(platformLabel).join(", ")}
              </>
            }
            actions={
              <>
                <Button
                  variant="outline"
                  render={
                    <a
                      // Streamed by the API; the browser downloads it through
                      // the proxy, which relays the attachment header. In a
                      // new tab because an error response carries no such
                      // header, and would otherwise navigate this page away
                      // to raw JSON.
                      href={`/api/proxy/admin/exports/campaigns/${campaign.id}/results.csv`}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <Download />
                  Results CSV
                </Button>
                <CampaignStatusActions campaign={campaign} />
              </>
            }
          />

          <Card>
            <CardContent className="pt-6">
              <CampaignBudget campaign={campaign} />
            </CardContent>
          </Card>

          <StatGrid>
            <StatCard
              label="CPM"
              value={formatCurrency(campaign.cpm)}
              hint="per 1,000 payable views"
            />
            <StatCard
              label="Committed"
              value={formatCurrency(committed(campaign))}
              hint={`${formatCurrency(campaign.accrued_amount)} not yet credited`}
            />
            <StatCard
              label="Minimum views"
              value={campaign.minimum_views ? formatNumber(campaign.minimum_views) : "None"}
              hint="per post, to earn anything"
            />
            <StatCard
              label="Max per post"
              value={
                campaign.max_payout_per_post
                  ? formatCurrency(campaign.max_payout_per_post)
                  : "Uncapped"
              }
            />
          </StatGrid>

          <RecordActivity recordId={campaign.id} variant="card" />

          <Tabs defaultValue="submissions" className="min-w-0">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <TabsList>
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
                <TabsTrigger value="payouts">Payout history</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="submissions" className="min-w-0 pt-4">
              <SubmissionsTable campaignId={campaign.id} onSelect={setOpenSubmission} />
            </TabsContent>

            <TabsContent value="payouts" className="min-w-0 pt-4">
              <CampaignSnapshots campaignId={campaign.id} />
            </TabsContent>

            <TabsContent value="details" className="min-w-0 pt-4">
              <CampaignDetails campaign={campaign} />
            </TabsContent>

            <TabsContent value="edit" className="min-w-0 pt-4">
              <CampaignForm campaign={campaign} />
            </TabsContent>
          </Tabs>

          <SubmissionSheet
            submissionId={openSubmission}
            onOpenChange={(open) => !open && setOpenSubmission(null)}
          />
        </div>
      )}
    </QueryState>
  );
}

function CampaignDetails({ campaign }: { campaign: Campaign }) {
  return (
    <div className="min-w-0 space-y-6">
      <DetailList
        items={[
          { label: "Campaign ID", value: <code className="text-xs break-all">{campaign.id}</code> },
          { label: "Status", value: humanise(campaign.status) },
          { label: "Starts", value: formatDateTime(campaign.starts_at) },
          { label: "Ends", value: formatDateTime(campaign.ends_at) },
          { label: "Created", value: formatDateTime(campaign.created_at) },
          { label: "Last updated", value: formatDateTime(campaign.updated_at) },
          {
            label: "Platforms",
            value: campaign.allowed_platforms.map(platformLabel).join(", ") || "—",
            wide: true,
          },
        ]}
      />

      {campaign.description && (
        <Prose title="Description" body={campaign.description} />
      )}
      {campaign.rules && <Prose title="Rules" body={campaign.rules} />}

      <section className="min-w-0 space-y-2">
        <h3 className="text-sm font-semibold">Required hashtags</h3>
        {(campaign.hashtags ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">None.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {campaign.hashtags.map((tag) => (
              <li
                key={tag}
                className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 font-mono text-xs"
              >
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="min-w-0 space-y-2">
        <h3 className="text-sm font-semibold">Content links</h3>
        {campaign.content_links.length === 0 ? (
          <p className="text-muted-foreground text-sm">None.</p>
        ) : (
          <ul className="space-y-1">
            {campaign.content_links.map((link) => (
              <li key={link} className="min-w-0">
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-sm hover:underline"
                >
                  <span className="truncate">{link}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {campaign.banner_url && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Banner</h3>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={campaign.banner_url}
            alt="Campaign banner"
            className="max-w-md rounded-lg border object-cover"
          />
        </section>
      )}
    </div>
  );
}

function Prose({ title, body }: { title: string; body: string }) {
  return (
    <section className="min-w-0 space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {/* Stored as plain text, so it is rendered as plain text - preserving
          the admin's line breaks without interpreting anything as markup. */}
      <p className="text-muted-foreground text-sm whitespace-pre-wrap">{body}</p>
    </section>
  );
}
