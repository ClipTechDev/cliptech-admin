import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { settingsOptions } from "@/hooks/use-settings";
import { serverFetch } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

/**
 * The background jobs' operational settings — super admin only.
 *
 * A non-super admin's prefetch 403s, which is swallowed here like every other
 * prefetch failure; the client retry then renders it properly as "You don't
 * have access to this" rather than an empty form.
 */
export default async function SettingsPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(settingsOptions(serverFetch)).catch(() => undefined);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Settings"
        description="How the background workers behave. Changes apply from each job's next tick — no deploy, no restart."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SettingsForm />
      </HydrationBoundary>
    </div>
  );
}
