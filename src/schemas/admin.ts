import { z } from "zod";

/** Mirrors admin.Response in cliptech-api (internal/features/admin/dto.go). */
export type Admin = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  two_factor_enabled: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type AdminMeResponse = {
  success: boolean;
  admin: Admin;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  admin: Admin;
  two_factor_enabled: boolean;
  expires_at: string;
};

export type AdminsListResponse = {
  success: boolean;
  admins: Admin[];
  pagination: import("@/schemas/common").PageMeta;
};

export type AdminResponse = {
  success: boolean;
  message?: string;
  admin: Admin;
};

/** The role every /v1/admin/users route requires. */
export const USERS_ROLE = "users";
export const SUPER_ADMIN_ROLE = "super_admin";
export const ADMINS_ROLE = "admins";

/**
 * Mirrors `allowed_admin_roles` in cliptech-api's config.yaml (and
 * defaultAllowedAdminRoles when that file is absent).
 *
 * The API has no endpoint that publishes this list, so it is duplicated here
 * to populate the pickers. The API is still the authority: ValidateRoles
 * rejects anything not in *its* config with `unknown role "x", allowed: ...`,
 * which surfaces verbatim in the form. If a deployment narrows or extends the
 * list, this array is what needs updating.
 */
export const ADMIN_ROLES = [
  "super_admin",
  "users",
  "campaigns",
  "submissions",
  "withdrawals",
  "transactions",
  "feedback",
  "notifications",
  "admins",
] as const;

/** Mirrors minPasswordLength in internal/features/admin/service.go. */
export const MIN_PASSWORD_LENGTH = 8;

const rolesField = z
  .array(z.string())
  .min(1, "Pick at least one role")
  .refine((roles) => roles.every((role) => ADMIN_ROLES.includes(role as never)), {
    message: "Unknown role",
  });

/**
 * POST /v1/admin/admins/invite - name, email, roles, and a 2FA flag. There is
 * deliberately no password: the API generates one and emails it, so nobody
 * inviting an admin ever sees the credential.
 */
export const inviteAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  roles: rolesField,
  two_factor_enabled: z.boolean(),
});

export type InviteAdminValues = z.infer<typeof inviteAdminSchema>;

/**
 * POST /v1/admin/admins - the same account with a password chosen by hand.
 * Kept alongside invite because invite refuses to run without SMTP, and a
 * deployment without a mail relay still has to be able to add an admin.
 *
 * Note the API ignores two_factor_enabled on this route; only invite sets it.
 */
export const createAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  roles: rolesField,
});

export type CreateAdminValues = z.infer<typeof createAdminSchema>;

/**
 * PATCH /v1/admin/admins/:id. Every field is optional; a blank password means
 * "leave it alone" rather than "clear it", since an admin with no password
 * could not sign in.
 */
export const updateAdminSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .refine(
      (value) => value === "" || value.length >= MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    ),
  roles: rolesField,
  is_active: z.boolean(),
});

export type UpdateAdminValues = z.infer<typeof updateAdminSchema>;

export function adminFormDefaults(admin?: Admin): UpdateAdminValues {
  return {
    name: admin?.name ?? "",
    email: admin?.email ?? "",
    password: "",
    roles: admin?.roles ?? [],
    is_active: admin?.is_active ?? true,
  };
}

/**
 * The PATCH body: only what changed.
 *
 * UpdateRequest takes pointers and answers an empty patch with ErrNoChanges,
 * so sending the whole form would fail on a no-op save and would also log
 * every field as changed in the audit trail.
 */
export function adminFormDiff(
  values: UpdateAdminValues,
  admin: Admin
): Record<string, unknown> {
  const diff: Record<string, unknown> = {};

  if (values.name !== admin.name) diff.name = values.name;
  // The API lower-cases the address it stores, so compare case-insensitively
  // or every save would re-send an email that only differs in capitalisation.
  if (values.email.toLowerCase() !== admin.email.toLowerCase()) diff.email = values.email;
  if (values.password) diff.password = values.password;
  if (!sameRoles(values.roles, admin.roles)) diff.roles = values.roles;
  if (values.is_active !== admin.is_active) diff.is_active = values.is_active;

  return diff;
}

/** Roles are a set; re-ordering the checkboxes is not a change. */
function sameRoles(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return [...a].sort().every((role, index) => role === sortedB[index]);
}

/**
 * Mirrors admin.RequireRoles: a super admin passes every role check, so it is
 * checked here too rather than expecting the role list to contain everything.
 *
 * This is for drawing the UI only. The API re-checks every request against
 * the database row - not the token - so a revoked role takes effect
 * immediately regardless of what this returns.
 */
export function hasRole(admin: Admin | null | undefined, role: string): boolean {
  if (!admin) return false;
  return admin.roles.includes(SUPER_ADMIN_ROLE) || admin.roles.includes(role);
}

/**
 * Login credentials. The API answers a blank email or password with the same
 * ErrInvalidCredentials it uses for a wrong one, so validating presence here
 * only saves a round trip - it isn't the real check.
 */
export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginValues = z.infer<typeof loginSchema>;
