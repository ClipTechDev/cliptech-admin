"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { errorMessage } from "@/components/shared/query-state";
import { useSettingsQuery, useUpdateSettingsMutation } from "@/hooks/use-settings";
import {
  hasSettingsChanges,
  settingsFormDefaults,
  settingsFormDiff,
  settingsFormSchema,
  type Settings,
  type SettingsFormValues,
} from "@/schemas/settings";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DetailList } from "@/components/shared/detail-list";
import { QueryState } from "@/components/shared/query-state";
import { PayoutSettingsFields } from "@/components/settings/payout-settings";
import { TrackingSettingsFields } from "@/components/settings/tracking-settings";
import { WorkerSettingsFields } from "@/components/settings/worker-settings";

/**
 * The background jobs' operational settings.
 *
 * Every field here changes how the workers behave from their next tick, for
 * everybody - which is why the API puts the whole thing behind super admin.
 * The form's job is to make that legible: each field says what it does and
 * what it would revert to, and the save sends only what moved.
 *
 * Validation is duplicated from config.ValidateSettings deliberately. The API
 * is the authority, and several of its rules are relational - a lease has to
 * outlast the tracking interval it runs alongside - so those are left to it
 * and surfaced verbatim. The per-field bounds are checked here only so a
 * slipped decimal is caught next to the field rather than as a toast.
 */
export function SettingsForm() {
  const { data, isLoading, error, refetch } = useSettingsQuery();

  return (
    <QueryState
      isLoading={isLoading && !data}
      loadingFallback={<SettingsSkeleton />}
      error={error}
      onRetry={() => void refetch()}
    >
      {data && (
        <SettingsFields settings={data.settings} defaults={data.defaults} file={data.file} />
      )}
    </QueryState>
  );
}

function SettingsFields({
  settings,
  defaults,
  file,
}: {
  settings: Settings;
  defaults: Settings;
  file: string;
}) {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: settingsFormDefaults(settings),
  });

  const updateSettings = useUpdateSettingsMutation();
  const [confirmPause, setConfirmPause] = React.useState<SettingsFormValues | null>(null);

  // Re-seed from the record after a save, so the form shows what was actually
  // stored - the thresholds re-joined from the parsed array included.
  React.useEffect(() => {
    form.reset(settingsFormDefaults(settings));
  }, [settings, form]);

  const values = form.watch();
  // Disable Save on a no-op rather than letting it fail: the API answers an
  // empty patch with ErrNoChanges, which as a red toast reads like a bug.
  const hasChanges = hasSettingsChanges(values, settings);
  const paused = values.worker.paused;
  const pausing = paused && !settings.worker.paused;

  /**
   * Returns the in-flight save so the confirm dialog can await it and stay
   * open if it fails. It rejects on failure even though `onError` has already
   * reported it - that rejection is the signal, not the message.
   */
  function save(submitted: SettingsFormValues) {
    const patch = settingsFormDiff(submitted, settings);
    if (Object.keys(patch).length === 0) {
      toast.info("Nothing to save");
      return;
    }

    return updateSettings.mutateAsync(patch, {
      onSuccess: (response) =>
        toast.success(
          response.changed?.length
            ? `Saved: ${response.changed.join(", ")}`
            : "Settings saved"
        ),
      onError: (saveError) => toast.error(errorMessage(saveError)),
    });
  }

  function onSubmit(submitted: SettingsFormValues) {
    // Pausing halts tracking and crediting for every campaign at once, and
    // the switch that does it sits among a dozen ordinary numbers. It is the
    // one change on this form worth stopping to confirm.
    if (pausing) {
      setConfirmPause(submitted);
      return;
    }

    // The rejection is already reported by `onError`; catching here only
    // stops it surfacing as an unhandled promise rejection.
    save(submitted)?.catch(() => undefined);
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="min-w-0 space-y-6">
          {settings.worker.paused && (
            <div
              role="status"
              className="border-destructive/40 bg-destructive/5 rounded-lg border p-4"
            >
              <p className="text-sm font-medium">Background jobs are paused</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Views are not being tracked and nothing is being credited. The jobs are
                still scheduled — unpausing resumes them without a restart.
              </p>
            </div>
          )}

          <Tabs defaultValue="worker" className="min-w-0">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <TabsList>
                <TabsTrigger value="worker">Scheduler</TabsTrigger>
                <TabsTrigger value="tracking">Tracking</TabsTrigger>
                <TabsTrigger value="payout">Payouts</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="worker" className="min-w-0 pt-4">
              <WorkerSettingsFields
                control={form.control}
                current={settings}
                defaults={defaults}
              />
            </TabsContent>

            <TabsContent value="tracking" className="min-w-0 pt-4">
              <TrackingSettingsFields control={form.control} defaults={defaults} />
            </TabsContent>

            <TabsContent value="payout" className="min-w-0 pt-4">
              <PayoutSettingsFields control={form.control} defaults={defaults} />
            </TabsContent>

            <TabsContent value="about" className="min-w-0 pt-4">
              <About file={file} />
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2 border-t pt-6">
            <Button type="submit" disabled={updateSettings.isPending || !hasChanges}>
              {updateSettings.isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!hasChanges || updateSettings.isPending}
              onClick={() => form.reset(settingsFormDefaults(settings))}
            >
              Discard
            </Button>
            <p className="text-muted-foreground text-xs">
              Only the fields you changed are sent, and the audit log records which.
            </p>
          </div>
        </form>
      </Form>

      <ConfirmDialog
        open={confirmPause !== null}
        onOpenChange={(open) => !open && setConfirmPause(null)}
        title="Pause every background job?"
        description="View tracking stops and no campaign is credited until this is turned back on. Posts already submitted keep their last reading; nothing is lost, but earnings stop moving for every creator at once."
        confirmLabel="Pause jobs"
        onConfirm={() => (confirmPause ? save(confirmPause) : undefined)}
      />
    </>
  );
}

function About({ file }: { file: string }) {
  return (
    <DetailList
      items={[
        {
          label: "Settings file",
          value: <code className="text-xs break-all">{file}</code>,
          wide: true,
        },
        {
          label: "Scope",
          value:
            "Local to the machine the API runs on, and rewritten by this form. Separate from config.yaml, which lists the values the database will accept and is version-controlled.",
          wide: true,
        },
        {
          label: "When changes apply",
          value: "From each job's next tick. No restart or deploy is needed.",
          wide: true,
        },
      ]}
    />
  );
}

/**
 * Mirrors the tab bar and a page of fields, so the form does not appear to
 * jump into place - QueryState's three generic lines would collapse a screen
 * this tall to nothing.
 */
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-80 rounded-lg" />
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
