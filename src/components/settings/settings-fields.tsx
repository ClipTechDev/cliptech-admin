"use client";

import type { ReactNode } from "react";
import type { Control, FieldPath } from "react-hook-form";

import type { SettingsFormValues } from "@/schemas/settings";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/** The form's control, named once so every section agrees on it. */
export type SettingsControl = Control<SettingsFormValues>;

export type SettingsFieldName = FieldPath<SettingsFormValues>;

/** The value a field reverts to, shown next to every input. */
export function Fallback({ children }: { children: ReactNode }) {
  return <code className="text-xs">{children}</code>;
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-6 sm:grid-cols-2">{children}</div>;
}

/**
 * A Go duration field.
 *
 * Text rather than a number-plus-unit pair because that is what crosses the
 * wire and what sits in the settings file - an operator comparing this screen
 * to the file on the box should see the same string, not a value they have to
 * mentally reassemble.
 */
export function DurationField({
  control,
  name,
  label,
  fallback,
  description,
}: {
  control: SettingsControl;
  name: SettingsFieldName;
  label: string;
  fallback: string;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={fallback} {...field} value={String(field.value ?? "")} />
          </FormControl>
          <FormDescription>
            {description ? `${description} ` : ""}Reverts to <Fallback>{fallback}</Fallback>.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function NumberField({
  control,
  name,
  label,
  fallback,
  max,
  step,
  description,
}: {
  control: SettingsControl;
  name: SettingsFieldName;
  label: string;
  fallback: number;
  max?: number;
  step?: string;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              max={max}
              placeholder={String(fallback)}
              value={String(field.value ?? "")}
              // An emptied box has to stay empty while it is being retyped,
              // so it becomes NaN rather than 0 - which zod reports as "must
              // be a number" instead of silently saving a zero that would
              // pause the job the field configures.
              onChange={(event) =>
                field.onChange(
                  event.target.value === "" ? Number.NaN : Number(event.target.value)
                )
              }
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormDescription>
            {description ? `${description} ` : ""}Reverts to <Fallback>{fallback}</Fallback>.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * A value the settings API will not change.
 *
 * Shown rather than hidden: an operator reading this page still needs to know
 * the cadence, and silently omitting it would make the screen look like the
 * complete picture when it is not.
 */
export function ReadOnlyField({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="grid gap-1.5 rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">
        {label}: <code className="text-xs">{value}</code>
      </p>
      <p className="text-muted-foreground text-sm">{note}</p>
    </div>
  );
}
