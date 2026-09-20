import { z } from "zod";

import type { PageMeta } from "@/schemas/common";
import {
  ELIGIBILITY_MATCHES,
  JOIN_METHODS,
  emptyRuleRow,
  ruleRowFromView,
  ruleRowPayload,
  ruleRowSchema,
  type EligibilityMatch,
  type JoinMethod,
  type RuleRow,
  type RuleType,
  type RuleView,
} from "@/schemas/eligibility";
import { SOCIAL_PLATFORMS } from "@/schemas/social-account";

/**
 * Mirrors campaign.Response in cliptech-api
 * (internal/features/campaign/dto.go) - the admin view, which unlike the
 * creator-facing PublicResponse includes where the money has gone.
 */

export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_approval",
  "active",
  "submissions_closed",
  "paused",
  "ended",
  "completed",
  "archived",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/** The only two a campaign may be created as (ErrStatusOnCreate). */
export const CREATABLE_STATUSES = ["draft", "active"] as const;

export type Campaign = {
  id: string;
  name: string;
  banner_url: string | null;
  description: string | null;
  rules: string | null;
  content_links: string[];
  hashtags: string[];
  allowed_platforms: string[];

  cpm: number;
  total_budget: number;
  spent_amount: number;
  accrued_amount: number;
  remaining_budget: number;

  minimum_views: number | null;
  max_payout_per_post: number | null;

  starts_at: string;
  ends_at: string;
  submission_cutoff_percent: number;

  status: CampaignStatus;
  /**
   * The transitions the API will accept from here, computed server-side from
   * `allowedTransitions`. The UI offers exactly these rather than keeping its
   * own copy of the lifecycle, which would drift.
   */
  next_statuses: CampaignStatus[];
  accepts_submissions: boolean;
  cutoff_reached: boolean;

  ended_at: string | null;
  settled_at: string | null;
  /**
   * Whether an admin may release this campaign's accrued earnings now.
   * Settlement is the only thing that credits creators, so this - not the
   * status alone - drives the release control.
   */
  can_settle: boolean;

  approved_by: string | null;
  approved_at: string | null;
  approved_budget: number | null;
  needs_approval: boolean;

  created_by: string | null;
  created_at: string;
  updated_at: string;

  join_method: JoinMethod;
  eligibility_match: EligibilityMatch;
  eligibility_rules: RuleView[];
};

export type CampaignsListResponse = {
  success: boolean;
  campaigns: Campaign[];
  pagination: PageMeta;
};

export type CampaignResponse = {
  success: boolean;
  message?: string;
  campaign: Campaign;
};

/** Committed = spent + accrued: every dollar the budget has to cover. */
export function committed(campaign: Campaign): number {
  return campaign.spent_amount + campaign.accrued_amount;
}

export function budgetUsedPercent(campaign: Campaign): number {
  if (campaign.total_budget <= 0) return 100;
  return Math.min((committed(campaign) / campaign.total_budget) * 100, 100);
}

export const APPROVAL_THRESHOLD = 10000;

export function isAwaitingApproval(campaign?: Campaign): boolean {
  return campaign?.status === "pending_approval";
}

export function budgetNeedsApproval(
  budget: number,
  approvedBudget: number | null
): boolean {
  if (budget <= APPROVAL_THRESHOLD) return false;
  return approvedBudget === null || budget > approvedBudget;
}

/**
 * Limits taken from internal/features/campaign/validation.go, which mirrors
 * the column definitions - NUMERIC(10,4) for CPM, NUMERIC(14,2) for money.
 * Duplicated here only to fail fast in the browser; the API re-validates.
 */
const MAX_CPM = 999999.9999;
const MAX_BUDGET = 999999999999.99;
const MAX_NAME = 255;
const MAX_TEXT = 10000;
const MAX_LINKS = 20;
const MAX_HASHTAGS = 10;
const MAX_HASHTAG_LEN = 100;
const MAX_RULES = 20;
/** minCampaignRun: a campaign must run for at least an hour. */
const MIN_RUN_MS = 60 * 60 * 1000;

const httpUrl = z
  .string()
  .trim()
  .refine((value) => /^https?:\/\/[^\s]+$/i.test(value) && value.length <= 2048, {
    message: "Must be an http(s) URL",
  });

/** Rounds to `places` so a float artefact can't trip the API's precision check. */
function withinPrecision(value: number, places: number): boolean {
  const scaled = value * 10 ** places;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

export const campaignFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(MAX_NAME, "At most 255 characters"),
    banner_url: z.union([httpUrl, z.literal("")]),
    description: z.string().max(MAX_TEXT, "Too long"),
    rules: z.string().max(MAX_TEXT, "Too long"),
    /** One URL per line in the textarea; split and cleaned on submit. */
    content_links: z.string(),
    /** Comma or space separated in the input; split and cleaned on submit. */
    hashtags: z.string(),
    allowed_platforms: z
      .array(z.string())
      .min(1, "Pick at least one platform")
      .refine((list) => list.every((p) => SOCIAL_PLATFORMS.includes(p as never)), "Unknown platform"),

    cpm: z
      .number({ error: "Enter a CPM" })
      .positive("Must be greater than 0")
      .max(MAX_CPM, "Too large")
      .refine((v) => withinPrecision(v, 4), "At most 4 decimal places"),
    total_budget: z
      .number({ error: "Enter a budget" })
      .positive("Must be greater than 0")
      .max(MAX_BUDGET, "Too large")
      .refine((v) => withinPrecision(v, 2), "At most 2 decimal places"),

    minimum_views: z.union([z.number().int().positive("Must be greater than 0"), z.literal("")]),
    max_payout_per_post: z
      .union([
        z
          .number()
          .positive("Must be greater than 0")
          .refine((v) => withinPrecision(v, 2), "At most 2 decimal places"),
        z.literal(""),
      ]),

    starts_at: z.string().min(1, "Start date is required"),
    ends_at: z.string().min(1, "End date is required"),
    submission_cutoff_percent: z
      .number({ error: "Enter a cutoff" })
      .int()
      .min(1, "Between 1 and 100")
      .max(100, "Between 1 and 100"),

    join_method: z.enum(JOIN_METHODS),
    eligibility_match: z.enum(ELIGIBILITY_MATCHES),
    eligibility_rules: z.array(ruleRowSchema).max(MAX_RULES, `At most ${MAX_RULES} requirements`),
  })
  .refine((values) => values.join_method !== "criteria" || values.eligibility_rules.length > 0, {
    path: ["eligibility_rules"],
    message: "Add at least one requirement, or let anyone join",
  })
  .refine(
    (values) => {
      const pairs = values.eligibility_rules.map((row) => `${row.rule_type}|${row.operator}`);
      return new Set(pairs).size === pairs.length;
    },
    { path: ["eligibility_rules"], message: "The same requirement and condition is listed twice" }
  )
  // Cross-field rules, mirroring validateWindow and validateMaxPayout. They
  // live here so the form can say which field is wrong, instead of the API
  // rejecting the whole submit with one message.
  .refine(
    (values) => {
      const links = splitLinks(values.content_links);
      return links.length <= MAX_LINKS;
    },
    { path: ["content_links"], message: `At most ${MAX_LINKS} links` }
  )
  .refine(
    (values) => splitLinks(values.content_links).every((l) => /^https?:\/\/[^\s]+$/i.test(l)),
    { path: ["content_links"], message: "Every line must be an http(s) URL" }
  )
  .refine((values) => splitHashtags(values.hashtags).length <= MAX_HASHTAGS, {
    path: ["hashtags"],
    message: `At most ${MAX_HASHTAGS} tags`,
  })
  .refine(
    (values) => splitHashtags(values.hashtags).every((t) => t.length <= MAX_HASHTAG_LEN),
    { path: ["hashtags"], message: `Each tag must be at most ${MAX_HASHTAG_LEN} characters` }
  )
  .refine(
    // Mirrors validHashtag in the Go service: letters, digits and underscores,
    // with no separators. \p{L} rather than A-Z so a non-Latin tag passes here
    // exactly as it does server-side.
    (values) => splitHashtags(values.hashtags).every((t) => /^[\p{L}\p{N}_]+$/u.test(t)),
    {
      path: ["hashtags"],
      message: "Tags may only contain letters, numbers and underscores",
    }
  )
  .refine(
    (values) => new Date(values.ends_at).getTime() > new Date(values.starts_at).getTime(),
    { path: ["ends_at"], message: "Must be after the start date" }
  )
  .refine(
    (values) =>
      new Date(values.ends_at).getTime() - new Date(values.starts_at).getTime() >= MIN_RUN_MS,
    { path: ["ends_at"], message: "A campaign must run for at least an hour" }
  )
  .refine((values) => new Date(values.ends_at).getTime() > Date.now(), {
    path: ["ends_at"],
    message: "Must be in the future",
  })
  .refine(
    (values) =>
      values.max_payout_per_post === "" || values.max_payout_per_post <= values.total_budget,
    { path: ["max_payout_per_post"], message: "Cannot exceed the total budget" }
  );

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export function campaignEditSchema(campaign: Campaign) {
  return campaignFormSchema
    .refine((values) => values.total_budget >= campaign.spent_amount, {
      path: ["total_budget"],
      message: "Cannot be less than what the campaign has already spent",
    })
    .refine(
      (values) => isDraft(campaign) || values.total_budget >= campaign.total_budget,
      {
        path: ["total_budget"],
        message: "Cannot be decreased once a campaign has left draft - only increased",
      }
    );
}

/** One link per line; blanks and duplicates dropped, as the API does. */
export function splitLinks(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !seen.has(line) && (seen.add(line), true));
}

/**
 * Tags as typed, split into the array the API takes.
 *
 * Commas, spaces and newlines all separate, because an admin will use whichever
 * they reach for. The leading '#' is stripped here for the same reason the API
 * strips it: it is punctuation the UI puts back, not part of the tag.
 * Duplicates are dropped case-insensitively, keeping the first spelling.
 */
export function splitHashtags(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const raw of value.split(/[\s,]+/)) {
    const tag = raw.replace(/^#+/, "").trim();
    if (tag === "") continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

export function campaignFormDefaults(
  campaign?: Campaign,
  ruleTypes: RuleType[] = []
): CampaignFormValues {
  return {
    name: campaign?.name ?? "",
    banner_url: campaign?.banner_url ?? "",
    description: campaign?.description ?? "",
    rules: campaign?.rules ?? "",
    content_links: (campaign?.content_links ?? []).join("\n"),
    hashtags: (campaign?.hashtags ?? []).join(", "),
    allowed_platforms: campaign?.allowed_platforms ?? [],
    cpm: campaign?.cpm ?? 0,
    total_budget: campaign?.total_budget ?? 0,
    minimum_views: campaign?.minimum_views ?? "",
    max_payout_per_post: campaign?.max_payout_per_post ?? "",
    starts_at: toLocalInput(campaign?.starts_at),
    ends_at: toLocalInput(campaign?.ends_at),
    submission_cutoff_percent: campaign?.submission_cutoff_percent ?? 80,
    join_method: campaign?.join_method ?? "open",
    eligibility_match: campaign?.eligibility_match ?? "all",
    eligibility_rules: (campaign?.eligibility_rules ?? []).map((view) =>
      ruleRowFromView(view, ruleTypes)
    ),
  };
}

export function newRuleRow(): RuleRow {
  return { ...emptyRuleRow };
}

function eligibilityPayload(values: CampaignFormValues) {
  return {
    join_method: values.join_method,
    eligibility_match: values.eligibility_match,
    eligibility_rules:
      values.join_method === "open" ? [] : values.eligibility_rules.map(ruleRowPayload),
  };
}

function campaignEligibility(campaign: Campaign) {
  return {
    join_method: campaign.join_method ?? "open",
    eligibility_match: campaign.eligibility_match ?? "all",
    eligibility_rules: (campaign.eligibility_rules ?? []).map((rule) => ({
      rule_type: rule.rule_type,
      operator: rule.operator,
      value: rule.value,
    })),
  };
}

/** RFC3339 -> the `YYYY-MM-DDTHH:mm` a datetime-local input wants, in local time. */
export function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/** The inverse: a local input value back to the RFC3339 the API parses. */
export function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

type CampaignPayload = Record<string, unknown>;

/** The create body. Everything is sent: there is nothing to diff against. */
export function campaignCreatePayload(
  values: CampaignFormValues,
  status: (typeof CREATABLE_STATUSES)[number]
): CampaignPayload {
  return {
    name: values.name,
    banner_url: values.banner_url,
    description: values.description,
    rules: values.rules,
    content_links: splitLinks(values.content_links),
    hashtags: splitHashtags(values.hashtags),
    allowed_platforms: values.allowed_platforms,
    cpm: values.cpm,
    total_budget: values.total_budget,
    minimum_views: values.minimum_views === "" ? null : values.minimum_views,
    max_payout_per_post: values.max_payout_per_post === "" ? null : values.max_payout_per_post,
    starts_at: fromLocalInput(values.starts_at),
    ends_at: fromLocalInput(values.ends_at),
    submission_cutoff_percent: values.submission_cutoff_percent,
    status,
    ...eligibilityPayload(values),
  };
}

/**
 * The PATCH body: only what changed.
 *
 * UpdateRequest takes pointers and answers an empty patch with ErrNoChanges,
 * and every field it receives is named in the audit log - so sending the whole
 * form would both fail on a no-op save and record twelve fields as "changed".
 */
export function campaignFormDiff(
  values: CampaignFormValues,
  campaign: Campaign
): CampaignPayload {
  const diff: CampaignPayload = {};

  if (values.name !== campaign.name) diff.name = values.name;
  if (values.banner_url !== (campaign.banner_url ?? "")) diff.banner_url = values.banner_url;
  if (values.description !== (campaign.description ?? "")) diff.description = values.description;
  if (values.rules !== (campaign.rules ?? "")) diff.rules = values.rules;

  const links = splitLinks(values.content_links);
  if (links.join("\n") !== campaign.content_links.join("\n")) diff.content_links = links;

  const tags = splitHashtags(values.hashtags);
  if (tags.join(",") !== (campaign.hashtags ?? []).join(",")) diff.hashtags = tags;

  const platforms = [...values.allowed_platforms].sort();
  if (platforms.join(",") !== [...campaign.allowed_platforms].sort().join(",")) {
    diff.allowed_platforms = values.allowed_platforms;
  }

  if (values.cpm !== campaign.cpm) diff.cpm = values.cpm;
  if (values.total_budget !== campaign.total_budget) diff.total_budget = values.total_budget;

  const minViews = values.minimum_views === "" ? null : values.minimum_views;
  if (minViews !== campaign.minimum_views && minViews !== null) diff.minimum_views = minViews;

  const maxPayout = values.max_payout_per_post === "" ? null : values.max_payout_per_post;
  if (maxPayout !== campaign.max_payout_per_post && maxPayout !== null) {
    diff.max_payout_per_post = maxPayout;
  }

  // Compare as instants: the input is local-time text, so the strings differ
  // whenever the timezone offset does even when the moment is identical.
  if (new Date(values.starts_at).getTime() !== new Date(campaign.starts_at).getTime()) {
    diff.starts_at = fromLocalInput(values.starts_at);
  }
  if (new Date(values.ends_at).getTime() !== new Date(campaign.ends_at).getTime()) {
    diff.ends_at = fromLocalInput(values.ends_at);
  }

  if (values.submission_cutoff_percent !== campaign.submission_cutoff_percent) {
    diff.submission_cutoff_percent = values.submission_cutoff_percent;
  }

  const nextEligibility = eligibilityPayload(values);
  if (JSON.stringify(nextEligibility) !== JSON.stringify(campaignEligibility(campaign))) {
    Object.assign(diff, nextEligibility);
  }

  return diff;
}

/**
 * Fields the API freezes once a campaign leaves draft (ErrFrozenField): the
 * terms creators already signed up to. The budget is separately restricted -
 * it may only grow - so it stays editable, with campaignEditSchema holding the
 * floor under it rather than the input being disabled.
 */
export const DRAFT_ONLY_FIELDS = ["cpm", "allowed_platforms", "starts_at"] as const;

export function isDraft(campaign?: Campaign): boolean {
  return campaign?.status === "draft";
}

/** Ended, completed and archived campaigns reject every edit (ErrTerminal). */
export function isTerminal(campaign?: Campaign): boolean {
  return (
    campaign?.status === "ended" ||
    campaign?.status === "completed" ||
    campaign?.status === "archived"
  );
}
