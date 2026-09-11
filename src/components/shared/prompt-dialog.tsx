"use client";

import * as React from "react";

import { humanise } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/**
 * Collects one value before an action fires.
 *
 * The step between "clicked reject" and "rejected" across the whole app:
 * a rejection reason, an invalidation reason from a fixed list, an internal
 * note, a bank reference. They differ only in whether the value is required,
 * typed or picked, and one line or several - so those are props rather than
 * four near-identical dialogs.
 *
 * Controlled only, like ConfirmDialog and for the same reason: these are
 * nearly always opened from a button that unmounts or a menu that closes, and
 * a trigger nested inside would race the dialog opening.
 *
 * The dialog does NOT close itself on confirm. The caller closes it in its own
 * success handler, which leaves a failed action visible behind the toast that
 * explains it rather than dismissing the form the admin has to retype.
 */
export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  placeholder,
  confirmLabel,
  options,
  multiline,
  required,
  destructive,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  fieldLabel: string;
  placeholder?: string;
  confirmLabel: string;
  /** When present the value is chosen from a fixed list, not typed. */
  options?: readonly string[];
  /** A textarea rather than a single-line input. Ignored with `options`. */
  multiline?: boolean;
  /** Blocks confirming on an empty value. */
  required?: boolean;
  destructive?: boolean;
  isPending: boolean;
  onConfirm: (value: string) => void;
}) {
  const [value, setValue] = React.useState("");
  const [wasOpen, setWasOpen] = React.useState(open);

  // Clear the field each time the dialog opens, so a reason typed and then
  // cancelled doesn't reappear on the next record. Adjusting state during
  // render rather than in an effect - an effect would show the stale value
  // for a frame first.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue("");
  }

  const trimmed = value.trim();
  const canSubmit = !required || trimmed !== "";
  const fieldId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-4">
          <Label htmlFor={fieldId}>
            {fieldLabel}
            {required ? "" : " (optional)"}
          </Label>

          {options ? (
            <Select value={value} onValueChange={(next) => setValue(String(next))}>
              <SelectTrigger id={fieldId} className="w-full">
                {/* Base UI renders the raw value unless given a render
                    function, which would show the API's snake_case enum. */}
                <SelectValue placeholder={placeholder ?? "Pick one"}>
                  {(selected) =>
                    selected ? humanise(String(selected)) : (placeholder ?? "Pick one")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {humanise(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : multiline ? (
            <Textarea
              id={fieldId}
              rows={3}
              value={value}
              placeholder={placeholder}
              onChange={(event) => setValue(event.target.value)}
            />
          ) : (
            <Input
              id={fieldId}
              value={value}
              placeholder={placeholder}
              onChange={(event) => setValue(event.target.value)}
            />
          )}
        </div>

        <DialogFooter>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={!canSubmit || isPending}
            onClick={() => onConfirm(trimmed)}
          >
            {isPending ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
