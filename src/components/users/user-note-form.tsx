"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { errorMessage } from "@/components/shared/query-state";
import { useSetUserNoteMutation } from "@/hooks/use-users";
import {
  MAX_NOTE_LENGTH,
  userNoteSchema,
  type AdminUser,
  type UserNoteValues,
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
import { Textarea } from "@/components/ui/textarea";

/**
 * The internal note, on its own PATCH because the API gives it its own
 * endpoint: it is rewritable working text for other admins, deliberately kept
 * out of the immutable action log and never returned to the creator.
 */
export function UserNoteForm({ user }: { user: AdminUser }) {
  const form = useForm<UserNoteValues>({
    resolver: zodResolver(userNoteSchema),
    defaultValues: { note: user.admin_note ?? "" },
  });

  const setNote = useSetUserNoteMutation(user.id);

  React.useEffect(() => {
    form.reset({ note: user.admin_note ?? "" });
  }, [user, form]);

  const note = form.watch("note");
  const isDirty = note !== (user.admin_note ?? "");

  function onSubmit(values: UserNoteValues) {
    setNote.mutate(values.note, {
      onSuccess: () =>
        toast.success(values.note.trim() ? "Note saved" : "Note cleared"),
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-4">
        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Internal note</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder="Context other admins should know about this account..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Only admins see this. Saving an empty note clears it.{" "}
                {note.length}/{MAX_NOTE_LENGTH}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={setNote.isPending || !isDirty}>
          {setNote.isPending ? "Saving..." : "Save note"}
        </Button>
      </form>
    </Form>
  );
}
