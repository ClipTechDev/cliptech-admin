import type { PageMeta } from "@/schemas/common";

/**
 * Mirrors admin.ActionLogResponse (internal/features/admin/dto.go).
 *
 * The audit trail: who changed what, in the words of whichever handler wrote
 * the entry. `summary` is already formatted prose - it is not a template to
 * re-render here.
 */

/** Mirrors the admin_action enum in Postgres. */
export const ADMIN_ACTIONS = [
  "created",
  "updated",
  "deleted",
  "approved",
  "rejected",
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

export type ActionBadgeVariant = "default" | "secondary" | "destructive" | "outline";

export const ACTION_BADGE_VARIANTS: Record<AdminAction, ActionBadgeVariant> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
  approved: "default",
  rejected: "destructive",
};

export type ActionLog = {
  id: string;
  admin_id: string;
  action: AdminAction;
  summary: string;
  created_at: string;
};

export type ActionLogsResponse = {
  success: boolean;
  logs: ActionLog[];
  pagination: PageMeta;
};
