"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { errorMessage } from "@/components/shared/query-state";
import { useAdminMeQuery } from "@/hooks/use-admin";
import { useUpdateAdminMutation } from "@/hooks/use-admins";
import {
  MIN_PASSWORD_LENGTH,
  adminFormDefaults,
  adminFormDiff,
  updateAdminSchema,
  type Admin,
  type UpdateAdminValues,
} from "@/schemas/admin";
import { Button } from "@/components/ui/button";
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
import { CheckboxGroup } from "@/components/shared/checkbox-group";
import { roleOptions } from "@/components/admins/admin-roles";

/**
 * Edit form for PATCH /v1/admin/admins/:id - every field UpdateRequest accepts.
 *
 * Password is here rather than on a separate screen because the API treats it
 * as one more optional field; blank means "leave it alone", since an admin
 * with no password could not sign in.
 */
export function AdminForm({ admin }: { admin: Admin }) {
  const { data: me } = useAdminMeQuery();
  const isSelf = me?.id === admin.id;

  const form = useForm<UpdateAdminValues>({
    resolver: zodResolver(updateAdminSchema),
    defaultValues: adminFormDefaults(admin),
  });

  const updateAdmin = useUpdateAdminMutation(admin);

  // Re-seed from the record after a save, so the form shows what was actually
  // stored - the trimmed name and lower-cased email included - and the
  // password field returns to blank rather than holding the one just set.
  React.useEffect(() => {
    form.reset(adminFormDefaults(admin));
  }, [admin, form]);

  const values = form.watch();
  const hasChanges = Object.keys(adminFormDiff(values, admin)).length > 0;

  function onSubmit(submitted: UpdateAdminValues) {
    // The API answers an empty patch with ErrNoChanges, so a no-op save is
    // stopped here rather than turned into a confusing 400.
    if (Object.keys(adminFormDiff(submitted, admin)).length === 0) {
      toast.info("Nothing to save");
      return;
    }

    updateAdmin.mutate(submitted, {
      onSuccess: () => toast.success("Admin updated"),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="off" {...field} />
                </FormControl>
                <FormDescription>This is what they sign in with.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep the current one"
                  {...field}
                />
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
                  name="edit-roles"
                  options={roleOptions}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                {isSelf
                  ? "These are your own roles - removing one takes effect on your next request."
                  : "Checked on every request against the stored row, so changes take effect immediately."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <FormDescription>
                  {isSelf
                    ? "Deactivating your own account will lock you out."
                    : "A disabled admin is refused at sign-in and on every request."}
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={updateAdmin.isPending || !hasChanges}>
            {updateAdmin.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasChanges || updateAdmin.isPending}
            onClick={() => form.reset(adminFormDefaults(admin))}
          >
            Discard
          </Button>
        </div>
      </form>
    </Form>
  );
}
