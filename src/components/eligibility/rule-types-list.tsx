"use client";

import * as React from "react";
import { toast } from "sonner";

import { useRuleTypesQuery, useUpdateRuleTypeMutation } from "@/hooks/use-eligibility";
import { OPERATOR_LABELS, type RuleType } from "@/schemas/eligibility";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { QueryState, errorMessage } from "@/components/shared/query-state";

const VALUE_TYPE_LABELS: Record<RuleType["value_type"], string> = {
  number: "a number",
  percent: "a percentage",
  country: "a country",
  text: "text",
  boolean: "yes or no",
};

export function RuleTypesList() {
  const ruleTypes = useRuleTypesQuery();

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-muted-foreground text-sm">
        Switch a requirement off to stop it being added to new campaigns. Campaigns that
        already use it keep checking it. New kinds of requirement are added by the
        engineering team.
      </p>
      <QueryState
        isLoading={ruleTypes.isPending}
        error={ruleTypes.error}
        onRetry={() => void ruleTypes.refetch()}
        isEmpty={(ruleTypes.data ?? []).length === 0}
        emptyMessage="No requirements are set up yet."
      >
        <ul className="space-y-3">
          {(ruleTypes.data ?? []).map((ruleType) => (
            <RuleTypeCard key={ruleType.key} ruleType={ruleType} />
          ))}
        </ul>
      </QueryState>
    </div>
  );
}

function RuleTypeCard({ ruleType }: { ruleType: RuleType }) {
  const update = useUpdateRuleTypeMutation();
  const [editing, setEditing] = React.useState(false);
  const [label, setLabel] = React.useState(ruleType.label);
  const [description, setDescription] = React.useState(ruleType.description);

  function save(body: { label?: string; description?: string; is_active?: boolean }, done: string) {
    update.mutate(
      { key: ruleType.key, body },
      {
        onSuccess: () => {
          toast.success(done);
          setEditing(false);
        },
        onError: (error) => toast.error(errorMessage(error)),
      }
    );
  }

  return (
    <li className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{ruleType.label}</p>
            {!ruleType.is_active && <Badge variant="outline">Switched off</Badge>}
            {!ruleType.supported && <Badge variant="destructive">No checker in the API</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">{ruleType.description}</p>
          <p className="text-muted-foreground text-xs">
            Compares {VALUE_TYPE_LABELS[ruleType.value_type]}
            {ruleType.unit ? ` (${ruleType.unit})` : ""} using:{" "}
            {ruleType.operators.map((operator) => OPERATOR_LABELS[operator]).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={ruleType.is_active}
            disabled={update.isPending || (!ruleType.supported && !ruleType.is_active)}
            aria-label={ruleType.is_active ? "Switch off" : "Switch on"}
            onCheckedChange={(checked) =>
              save({ is_active: checked }, checked ? "Requirement switched on" : "Requirement switched off")
            }
          />
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit wording
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <div className="space-y-2">
          <Input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={100} />
          <Textarea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={update.isPending || label.trim() === ""}
              onClick={() => save({ label, description }, "Wording updated")}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLabel(ruleType.label);
                setDescription(ruleType.description);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
