"use client";

import { useFieldArray, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { newRuleRow, type CampaignFormValues } from "@/schemas/campaign";
import {
  JOIN_METHOD_HINTS,
  JOIN_METHOD_LABELS,
  JOIN_METHODS,
  OPERATOR_LABELS,
  isListOperator,
  type Operator,
  type RuleType,
} from "@/schemas/eligibility";
import { Button } from "@/components/ui/button";
import {
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

export function EligibilityFields({
  control,
  setValue,
  ruleTypes,
}: {
  control: Control<CampaignFormValues>;
  setValue: UseFormSetValue<CampaignFormValues>;
  ruleTypes: RuleType[];
}) {
  const joinMethod = useWatch({ control, name: "join_method" });
  const { fields, append, remove } = useFieldArray({ control, name: "eligibility_rules" });

  const usedKeys = new Set(fields.map((field) => field.rule_type));
  const choosable = ruleTypes.filter(
    (type) => (type.is_active && type.supported) || usedKeys.has(type.key)
  );

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="join_method"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Who can join</FormLabel>
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
              {JOIN_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  role="radio"
                  aria-checked={field.value === method}
                  onClick={() => {
                    field.onChange(method);
                    if (method === "open") setValue("eligibility_rules", []);
                    if (method === "criteria" && fields.length === 0) append(newRuleRow());
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left text-sm transition-colors",
                    field.value === method
                      ? "border-primary bg-primary/5 ring-primary/30 ring-2"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span className="font-medium">{JOIN_METHOD_LABELS[method]}</span>
                </button>
              ))}
            </div>
            <FormDescription>{JOIN_METHOD_HINTS[joinMethod]}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {joinMethod !== "open" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {joinMethod === "criteria" ? "Requirements" : "Requirements (optional)"}
            </p>
            {fields.length > 1 && (
              <FormField
                control={control}
                name="eligibility_match"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(next) => field.onChange(next)}>
                    <SelectTrigger className="w-auto">
                      <SelectValue>
                        {(selected) =>
                          selected === "any" ? "Must meet any one of these" : "Must meet all of these"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Must meet all of these</SelectItem>
                      <SelectItem value="any">Must meet any one of these</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </div>

          {fields.length === 0 && (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              {joinMethod === "criteria"
                ? "Add at least one requirement a page must meet to join."
                : "No requirements — every request goes straight to you for review."}
            </p>
          )}

          {fields.map((field, index) => (
            <RuleRowFields
              key={field.id}
              index={index}
              control={control}
              setValue={setValue}
              ruleTypes={choosable}
              onRemove={() => remove(index)}
            />
          ))}

          <FormField
            control={control}
            name="eligibility_rules"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= 20 || choosable.length === 0}
            onClick={() => append(newRuleRow())}
          >
            <Plus />
            Add requirement
          </Button>
        </div>
      )}
    </div>
  );
}

function RuleRowFields({
  index,
  control,
  setValue,
  ruleTypes,
  onRemove,
}: {
  index: number;
  control: Control<CampaignFormValues>;
  setValue: UseFormSetValue<CampaignFormValues>;
  ruleTypes: RuleType[];
  onRemove: () => void;
}) {
  const row = useWatch({ control, name: `eligibility_rules.${index}` });
  const ruleType = ruleTypes.find((type) => type.key === row?.rule_type);
  const operator = (row?.operator ?? "") as Operator | "";
  const unit = ruleType?.value_type === "percent" ? "%" : (ruleType?.unit ?? "");

  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-start">
      <FormField
        control={control}
        name={`eligibility_rules.${index}.rule_type`}
        render={({ field }) => (
          <FormItem>
            <Select
              value={field.value}
              onValueChange={(next) => {
                const chosen = ruleTypes.find((type) => type.key === next);
                field.onChange(String(next));
                setValue(`eligibility_rules.${index}.value_type`, chosen?.value_type ?? "");
                setValue(`eligibility_rules.${index}.operator`, chosen?.operators[0] ?? "");
                setValue(`eligibility_rules.${index}.value`, "");
                setValue(`eligibility_rules.${index}.value_max`, "");
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full" aria-label="Requirement">
                  <SelectValue placeholder="Choose a requirement">
                    {(selected) =>
                      ruleTypes.find((type) => type.key === selected)?.label ?? "Choose a requirement"
                    }
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {ruleTypes.map((type) => (
                  <SelectItem key={type.key} value={type.key}>
                    {type.label}
                    {!type.is_active && " (switched off)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ruleType?.description && (
              <FormDescription className="text-xs">{ruleType.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`eligibility_rules.${index}.operator`}
        render={({ field }) => (
          <FormItem>
            <Select
              value={field.value}
              disabled={!ruleType}
              onValueChange={(next) => {
                const wasList = isListOperator(field.value);
                field.onChange(String(next));
                if (wasList !== isListOperator(String(next))) {
                  setValue(`eligibility_rules.${index}.value`, "");
                }
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full" aria-label="Condition">
                  <SelectValue placeholder="Condition">
                    {(selected) => OPERATOR_LABELS[selected as Operator] ?? "Condition"}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(ruleType?.operators ?? []).map((option) => (
                  <SelectItem key={option} value={option}>
                    {OPERATOR_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex min-w-0 items-start gap-2">
        <FormField
          control={control}
          name={`eligibility_rules.${index}.value`}
          render={({ field }) => (
            <FormItem className="min-w-0 flex-1">
              <FormControl>
                <ValueInput
                  valueType={ruleType?.value_type}
                  operator={operator}
                  placeholder={operator === "between" ? "Min" : undefined}
                  disabled={!ruleType}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              {unit && operator !== "between" && !isListOperator(operator) && (
                <FormDescription className="text-xs">{unit}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {operator === "between" && (
          <FormField
            control={control}
            name={`eligibility_rules.${index}.value_max`}
            render={({ field }) => (
              <FormItem className="min-w-0 flex-1">
                <FormControl>
                  <ValueInput
                    valueType={ruleType?.value_type}
                    operator={operator}
                    placeholder="Max"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                {unit && <FormDescription className="text-xs">{unit}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Remove requirement"
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

function ValueInput({
  valueType,
  operator,
  placeholder,
  disabled,
  value,
  onChange,
}: {
  valueType?: string;
  operator: string;
  placeholder?: string;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  if (valueType === "boolean") {
    return (
      <Select value={value} onValueChange={(next) => onChange(String(next))} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Yes or no">
            {(selected) => (selected === "true" ? "Yes" : selected === "false" ? "No" : "Yes or no")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  const numeric = valueType === "number" || valueType === "percent";
  const list = isListOperator(operator);

  return (
    <Input
      type={numeric && !list ? "number" : "text"}
      min={numeric ? 0 : undefined}
      max={valueType === "percent" ? 100 : undefined}
      step="any"
      disabled={disabled}
      placeholder={
        placeholder ??
        (valueType === "country"
          ? list
            ? "US, GB, CA"
            : "US"
          : list
            ? "Comma separated"
            : numeric
              ? "e.g. 10000"
              : "Value")
      }
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
