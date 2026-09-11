"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { useCreateAdminMutation, useInviteAdminMutation } from "@/hooks/use-admins";
import {
  ADMINS_ROLE,
  MIN_PASSWORD_LENGTH,
  createAdminSchema,
  hasRole,
  inviteAdminSchema,
  SUPER_ADMIN_ROLE,
  type CreateAdminValues,
  type InviteAdminValues,
} from "@/schemas/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { roleOptions } from "@/components/admins/admin-roles";

/**
 * Two ways to add an admin, because cliptech-api has two endpoints and they
 * are not interchangeable:
 *
 * - Invite (`POST /admin/admins/invite`) generates the password, emails it,
 *   and never returns it. Super admin only, and refuses outright when SMTP is
 *   unconfigured rather than creating an account nobody can sign in to.
 * - Create (`POST /admin/admins`) takes a password you choose. Needs only the
 *   "admins" role, and works without a mail relay.
 *
 * Invite leads because a password that only ever exists in the recipient's
 * inbox is the better default; create stays for deployments with no SMTP.
 */
export function NewAdminForm() {
  const router = useRouter();
  const { data: me } = useAdminMeQuery();

  const canInvite = me?.roles.includes(SUPER_ADMIN_ROLE) ?? false;
  const canCreate = hasRole(me, ADMINS_ROLE);

  // Land on whichever the signed-in admin is actually allowed to use. The
  // roles arrive with /admin/me, which may resolve after the first render, so
  // the default is re-applied when it changes - adjusting state during render
  // rather than in an effect, which would paint the wrong tab first.
  const preferred = canInvite ? "invite" : "create";
  const [mode, setMode] = React.useState(preferred);
  const [lastPreferred, setLastPreferred] = React.useState(preferred);

  if (preferred !== lastPreferred) {
    setLastPreferred(preferred);
    setMode(preferred);
  }

  // Neither path available: a pair of disabled tabs with one of them somehow
  // selected reads as a bug. Say what is missing instead.
  if (me && !canInvite && !canCreate) {
    return (
      <PermissionNotice>
        Adding an admin needs either the &quot;admins&quot; role (to set a
        password yourself) or super admin (to send an invite). Your account has
        neither - ask a super admin to grant one, or to add the account for you.
      </PermissionNotice>
    );
  }

  return (
    <Tabs value={mode} onValueChange={(value) => setMode(String(value))}>
      <TabsList className="w-full max-w-md">
        <TabsTrigger value="invite" disabled={!canInvite}>
          Invite by email
        </TabsTrigger>
        <TabsTrigger value="create" disabled={!canCreate}>
          Set a password
        </TabsTrigger>
      </TabsList>

      <TabsContent value="invite" className="pt-4">
        {canInvite ? (
          <InviteForm onDone={(id) => router.push(`/admins/${id}`)} />
        ) : (
          <PermissionNotice>
            Inviting an admin emails somebody a working credential, so
            cliptech-api restricts it to super admins.
          </PermissionNotice>
        )}
      </TabsContent>

      <TabsContent value="create" className="pt-4">
        {canCreate ? (
          <CreateForm onDone={(id) => router.push(`/admins/${id}`)} />
        ) : (
          <PermissionNotice>
            Creating an admin account requires the &quot;admins&quot; role.
          </PermissionNotice>
        )}
      </TabsContent>
    </Tabs>
  );
}

function PermissionNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex max-w-xl items-start gap-2 rounded-lg border border-dashed p-4 text-sm">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function InviteForm({ onDone }: { onDone: (id: string) => void }) {
  const form = useForm<InviteAdminValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: { name: "", email: "", roles: [], two_factor_enabled: false },
  });

  const invite = useInviteAdminMutation();

  function onSubmit(values: InviteAdminValues) {
    invite.mutate(values, {
      onSuccess: (response) => {
        toast.success(`Invited ${response.admin.name}`, {
          description: "Their password has been emailed to them.",
        });
        onDone(response.admin.id);
      },
      onError: (error) => toast.error(inviteError(error)),
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Invite an admin</CardTitle>
        <CardDescription>
          The API generates their password and emails it. Nobody here sees it -
          not even you - so there is nothing to pass on afterwards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <IdentityFields form={form} />

            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormControl>
                    <CheckboxGroup
                      name="invite-roles"
                      options={roleOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="two_factor_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Two-factor authentication</FormLabel>
                    <FormDescription>
                      Recorded on the account. Only the invite endpoint sets it.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? "Sending invite..." : "Send invite"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function CreateForm({ onDone }: { onDone: (id: string) => void }) {
  const form = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { name: "", email: "", password: "", roles: [] },
  });

  const create = useCreateAdminMutation();

  function onSubmit(values: CreateAdminValues) {
    create.mutate(values, {
      onSuccess: (response) => {
        toast.success(`Created ${response.admin.name}`, {
          description: "Pass the password on to them yourself - it isn't emailed.",
        });
        onDone(response.admin.id);
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "Couldn't create the admin"),
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create an admin</CardTitle>
        <CardDescription>
          You choose the password, so you have to deliver it. Prefer an invite
          where the deployment can send email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <IdentityFields form={form} />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormDescription>
                    At least {MIN_PASSWORD_LENGTH} characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roles</FormLabel>
                  <FormControl>
                    <CheckboxGroup
                      name="create-roles"
                      options={roleOptions}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Creating..." : "Create admin"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

/** Name and email, identical on both forms. */
function IdentityFields({
  form,
}: {
  // Both schemas share these two fields; the union keeps each form's own
  // resolver types intact at its call site.
  form: ReturnType<typeof useForm<InviteAdminValues>> | ReturnType<typeof useForm<CreateAdminValues>>;
}) {
  const typedForm = form as ReturnType<typeof useForm<InviteAdminValues>>;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FormField
        control={typedForm.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Jane Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={typedForm.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="jane@cliptech.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/**
 * The invite endpoint has two failure modes worth explaining rather than
 * echoing, because both are about the deployment rather than the input, and
 * both leave no account behind.
 */
function inviteError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return "Email isn't configured on the API, so the invite wasn't sent and no account was created. Set a password instead, or configure SMTP.";
    }
    if (error.status === 502) {
      return "The account was rolled back because its password couldn't be emailed. Safe to retry once the mail server is reachable.";
    }
    return error.message;
  }
  return "Couldn't send the invite";
}
