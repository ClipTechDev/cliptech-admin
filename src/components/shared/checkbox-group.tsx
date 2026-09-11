"use client";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type CheckboxGroupOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

/**
 * Controlled multi-select as a checkbox grid - for a small, fixed set where
 * seeing every option at once matters more than compactness. Admin roles are
 * exactly that: nine of them, and the point of the screen is reviewing which
 * are granted.
 *
 * Order is preserved from `options` rather than from click order, so the value
 * a form submits is stable and two admins with the same roles compare equal.
 */
export function CheckboxGroup({
  options,
  value,
  onChange,
  name,
  className,
  disabled,
}: {
  options: readonly CheckboxGroupOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Prefixes the generated input ids, so two groups on a page don't collide. */
  name: string;
  className?: string;
  disabled?: boolean;
}) {
  function toggle(option: string, checked: boolean) {
    const next = checked
      ? options.filter((o) => o.value === option || value.includes(o.value)).map((o) => o.value)
      : value.filter((v) => v !== option);
    onChange(next);
  }

  return (
    <div
      role="group"
      className={cn("grid gap-3 sm:grid-cols-2", className)}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        return (
          <div key={option.value} className="flex items-start gap-2">
            <Checkbox
              id={id}
              checked={value.includes(option.value)}
              disabled={disabled || option.disabled}
              onCheckedChange={(checked) => toggle(option.value, !!checked)}
              className="mt-0.5"
            />
            <div className="grid gap-0.5 leading-tight">
              <Label htmlFor={id} className="font-normal">
                {option.label}
              </Label>
              {option.description && (
                <span className="text-muted-foreground text-xs">{option.description}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
