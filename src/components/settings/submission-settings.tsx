"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import type { SettingsControl } from "@/components/settings/settings-fields";

export function SubmissionSettingsFields({ control }: { control: SettingsControl }) {
  return (
    <div className="min-w-0 space-y-6">
      <FormField
        control={control}
        name="submissions.auto_approve"
        render={({ field }) => (
          <FormItem className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Approve clips automatically</FormLabel>
              <FormDescription>
                Off (recommended): every new clip waits in Awaiting review until an admin
                approves or rejects it. On: clips that pass the automatic checks start
                tracking straight away, and clips that fail are rejected without review.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
