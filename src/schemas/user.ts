import { z } from "zod";

/**
 * Mirrors user.AdminResponse in cliptech-api
 * (internal/features/user/dto.go). Go pointer fields serialise to `null`,
 * not `undefined`, which is why the optional fields are typed that way.
 */

export const USER_STATUSES = ["active", "suspended", "banned", "deleted"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  country_code: string | null;
  country: string | null;
  profile_picture: string | null;
  available_balance: number;
  total_withdrawn: number;
  lifetime_earnings: number;
  status: UserStatus;
  created_at: string;
  last_login_at: string | null;
  /** Internal, admin-only. Never returned by the creator-facing endpoints. */
  admin_note: string | null;
  updated_at: string;
};

export type UsersListResponse = {
  success: boolean;
  users: AdminUser[];
  pagination: import("@/schemas/common").PageMeta;
};

export type UserResponse = {
  success: boolean;
  user: AdminUser;
};

/**
 * The edit form. Matches AdminUpdateRequest's four writable fields - email is
 * the login identity, and balances belong to the ledger, so neither is here.
 *
 * `country_code` is optional but, when present, must be exactly two letters:
 * the API rejects anything else and has no way to clear it, so a blank field
 * means "leave it alone" and is omitted from the PATCH rather than sent empty.
 */
export const userFormSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  status: z.enum(USER_STATUSES),
  country: z.string().trim(),
  country_code: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => value === "" || /^[A-Za-z]{2}$/.test(value), {
      message: "Use a two-letter country code, e.g. US",
    }),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

/** Mirrors maxNoteLength in internal/features/user/service.go. */
export const MAX_NOTE_LENGTH = 2000;

export const userNoteSchema = z.object({
  note: z.string().max(MAX_NOTE_LENGTH, `At most ${MAX_NOTE_LENGTH} characters`),
});

export type UserNoteValues = z.infer<typeof userNoteSchema>;

export function userFormDefaults(user?: AdminUser): UserFormValues {
  return {
    name: user?.name ?? "",
    status: user?.status ?? "active",
    country: user?.country ?? "",
    country_code: user?.country_code ?? "",
  };
}

/**
 * The PATCH body: only what actually changed.
 *
 * AdminUpdateRequest takes pointers and rejects an empty update with
 * ErrNoChanges, so sending the whole form back would both log every field as
 * "changed" in the audit trail and fail validation on a no-op save.
 */
export function userFormDiff(
  values: UserFormValues,
  user: AdminUser
): Partial<UserFormValues> {
  const diff: Partial<UserFormValues> = {};

  if (values.name !== user.name) diff.name = values.name;
  if (values.status !== user.status) diff.status = values.status;
  if (values.country !== (user.country ?? "")) diff.country = values.country;
  // Blank means "unchanged", not "clear it" - the API has no way to unset it.
  if (values.country_code && values.country_code !== user.country_code) {
    diff.country_code = values.country_code;
  }

  return diff;
}
