import { z } from "zod";

import type { PageMeta } from "@/schemas/common";

export const JOIN_METHODS = ["open", "criteria", "manual"] as const;
export type JoinMethod = (typeof JOIN_METHODS)[number];

export const JOIN_METHOD_LABELS: Record<JoinMethod, string> = {
  open: "Anyone can join",
  criteria: "Only pages that meet requirements",
  manual: "Admin approves each request",
};

export const JOIN_METHOD_HINTS: Record<JoinMethod, string> = {
  open: "Creators join instantly with any connected page on an allowed platform.",
  criteria:
    "Pages that meet the requirements join instantly. Pages that don't are refused with the reason. If we can't check a requirement automatically, an admin reviews it.",
  manual:
    "Every request waits for an admin. Requirements are optional here — pages that clearly fail them are refused before they reach you.",
};

export const ELIGIBILITY_MATCHES = ["all", "any"] as const;
export type EligibilityMatch = (typeof ELIGIBILITY_MATCHES)[number];

export type ValueType = "number" | "percent" | "country" | "text" | "boolean";

export type Operator = "gt" | "gte" | "lt" | "lte" | "eq" | "neq" | "between" | "in" | "not_in";

export const OPERATOR_LABELS: Record<Operator, string> = {
  gt: "more than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  eq: "is",
  neq: "is not",
  between: "between",
  in: "is one of",
  not_in: "is not one of",
};

export function isListOperator(operator: string): boolean {
  return operator === "in" || operator === "not_in";
}

export type RuleType = {
  key: string;
  label: string;
  description: string;
  fact: string;
  value_type: ValueType;
  operators: Operator[];
  unit: string | null;
  is_active: boolean;
  supported: boolean;
};

export type RuleTypesResponse = { success: boolean; rule_types: RuleType[] };
export type RuleTypeResponse = { success: boolean; rule_type: RuleType };

export type RuleView = {
  rule_type: string;
  label: string;
  operator: Operator;
  value: unknown;
  description: string;
};

export type RuleRow = {
  rule_type: string;
  value_type: ValueType | "";
  operator: string;
  value: string;
  value_max: string;
};

export const emptyRuleRow: RuleRow = {
  rule_type: "",
  value_type: "",
  operator: "",
  value: "",
  value_max: "",
};

function isNumberText(text: string): boolean {
  return text.trim() !== "" && Number.isFinite(Number(text)) && Number(text) >= 0;
}

function splitList(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function ruleRowError(row: RuleRow): { field: keyof RuleRow; message: string } | null {
  if (!row.rule_type) return { field: "rule_type", message: "Choose a rule" };
  if (!row.operator) return { field: "operator", message: "Choose a condition" };

  const numeric = row.value_type === "number" || row.value_type === "percent";

  if (row.operator === "between") {
    if (!isNumberText(row.value)) return { field: "value", message: "Enter the minimum" };
    if (!isNumberText(row.value_max)) return { field: "value_max", message: "Enter the maximum" };
    if (Number(row.value) > Number(row.value_max)) {
      return { field: "value_max", message: "Must be at least the minimum" };
    }
    if (row.value_type === "percent" && Number(row.value_max) > 100) {
      return { field: "value_max", message: "At most 100" };
    }
    return null;
  }

  if (isListOperator(row.operator)) {
    const items = splitList(row.value);
    if (items.length === 0) return { field: "value", message: "Enter at least one value" };
    if (row.value_type === "country" && !items.every((item) => /^[a-zA-Z]{2}$/.test(item))) {
      return { field: "value", message: "Use two-letter country codes, e.g. US, GB, IN" };
    }
    const lowered = items.map((item) => item.toLowerCase());
    if (new Set(lowered).size !== lowered.length) {
      return { field: "value", message: "A value is listed twice" };
    }
    return null;
  }

  if (numeric) {
    if (!isNumberText(row.value)) return { field: "value", message: "Enter a number of 0 or more" };
    if (row.value_type === "percent" && Number(row.value) > 100) {
      return { field: "value", message: "At most 100" };
    }
    return null;
  }

  if (row.value_type === "country" && !/^[a-zA-Z]{2}$/.test(row.value.trim())) {
    return { field: "value", message: "Use a two-letter country code, e.g. US" };
  }
  if (row.value.trim() === "") return { field: "value", message: "Enter a value" };
  return null;
}

export const ruleRowSchema = z
  .object({
    rule_type: z.string(),
    value_type: z.union([
      z.literal(""),
      z.enum(["number", "percent", "country", "text", "boolean"]),
    ]),
    operator: z.string(),
    value: z.string(),
    value_max: z.string(),
  })
  .superRefine((row, ctx) => {
    const error = ruleRowError(row);
    if (error) ctx.addIssue({ code: "custom", path: [error.field], message: error.message });
  });

export function ruleRowPayload(row: RuleRow): {
  rule_type: string;
  operator: string;
  value: unknown;
} {
  const numeric = row.value_type === "number" || row.value_type === "percent";
  let value: unknown;

  if (row.operator === "between") {
    value = [Number(row.value), Number(row.value_max)];
  } else if (isListOperator(row.operator)) {
    const items = splitList(row.value);
    value = row.value_type === "country" ? items.map((item) => item.toUpperCase()) : items;
  } else if (numeric) {
    value = Number(row.value);
  } else if (row.value_type === "boolean") {
    value = row.value === "true";
  } else if (row.value_type === "country") {
    value = row.value.trim().toUpperCase();
  } else {
    value = row.value.trim();
  }

  return { rule_type: row.rule_type, operator: row.operator, value };
}

export function ruleRowFromView(view: RuleView, types: RuleType[]): RuleRow {
  const valueType = types.find((type) => type.key === view.rule_type)?.value_type ?? "";
  const row: RuleRow = {
    rule_type: view.rule_type,
    value_type: valueType,
    operator: view.operator,
    value: "",
    value_max: "",
  };

  if (Array.isArray(view.value)) {
    if (view.operator === "between") {
      row.value = String(view.value[0] ?? "");
      row.value_max = String(view.value[1] ?? "");
    } else {
      row.value = view.value.map(String).join(", ");
    }
  } else if (view.value !== null && view.value !== undefined) {
    row.value = String(view.value);
  }

  return row;
}

export type CampaignMemberStatus = "pending" | "approved" | "rejected" | "removed";

export const MEMBER_STATUS_LABELS: Record<CampaignMemberStatus, string> = {
  pending: "Waiting for review",
  approved: "Joined",
  rejected: "Declined",
  removed: "Removed",
};

export type RuleResult = {
  rule_type: string;
  label: string;
  operator: Operator;
  value: unknown;
  description: string;
  fact?: unknown;
  outcome: "pass" | "fail" | "unknown" | "missing_input";
  reason?: string;
};

export type Evaluation = {
  match?: EligibilityMatch;
  decision?: "pass" | "refuse" | "review";
  results?: RuleResult[];
  evaluated_at?: string;
  note?: string;
};

export type CampaignMember = {
  id: string;
  campaign_id: string;
  social_account_id: string;
  status: CampaignMemberStatus;
  decided_by: "system" | "admin";
  evaluation: Evaluation;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;

  user_id: string;
  campaign_name: string;
  creator_name: string;
  creator_email: string;
  platform: string;
  username: string;
  connected: boolean;
  reviewed_by: string | null;
};

export type CampaignMembersResponse = {
  success: boolean;
  members: CampaignMember[];
  pagination: PageMeta;
};

export type CampaignMemberResponse = {
  success: boolean;
  message?: string;
  membership: CampaignMember;
};

export type ReevaluateResponse = {
  success: boolean;
  report: { checked: number; approved: number; rejected: number; pending: number };
};
