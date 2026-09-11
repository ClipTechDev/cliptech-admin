"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { humanise } from "@/lib/format";
import { errorMessage } from "@/components/shared/query-state";
import { useUpdateUserMutation } from "@/hooks/use-users";
import {
  USER_STATUSES,
  userFormDefaults,
  userFormDiff,
  userFormSchema,
  type AdminUser,
  type UserFormValues,
} from "@/schemas/user";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Edit form for the four fields PATCH /v1/admin/users/:id will accept.
 *
 * Email is absent because it is the login identity and changing it would need
 * re-verification the API doesn't do; balances are absent because they belong
 * to the ledger, which only the payout flow may move.
 */
export function UserForm({ user }: { user: AdminUser }) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: userFormDefaults(user),
  });

  const updateUser = useUpdateUserMutation(user);

  // The server is the source of truth: after a save (or a refetch elsewhere)
  // re-seed the form from the record, so what's on screen is what was stored -
  // trimmed names and upper-cased country codes included.
  React.useEffect(() => {
    form.reset(userFormDefaults(user));
  }, [user, form]);

  const values = form.watch();
  const hasChanges = Object.keys(userFormDiff(values, user)).length > 0;

  function onSubmit(submitted: UserFormValues) {
    // The API answers an empty patch with ErrNoChanges, so a no-op save is
    // stopped here rather than turned into a confusing 400.
    if (Object.keys(userFormDiff(submitted, user)).length === 0) {
      toast.info("Nothing to save");
      return;
    }

    updateUser.mutate(submitted, {
      onSuccess: () => toast.success("User updated"),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-6">
        <FormField
          control={form.control}
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
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    {/* Base UI renders the stored value unless given a render
                        function, which would show "suspended", not "Suspended". */}
                    <SelectValue placeholder="Select a status">
                      {(value) => (value ? humanise(String(value)) : "Select a status")}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {USER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {humanise(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Anything other than active blocks sign-in. Moving an account out
                of active emails the creator.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="United States" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="US"
                    maxLength={2}
                    className="uppercase"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Two letters. Leave blank to keep the current code - the API
                  has no way to clear it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={updateUser.isPending || !hasChanges}>
            {updateUser.isPending ? "Saving..." : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!hasChanges || updateUser.isPending}
            onClick={() => form.reset(userFormDefaults(user))}
          >
            Discard
          </Button>
        </div>
      </form>
    </Form>
  );
}
