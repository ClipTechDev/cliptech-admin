import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { systemStatusOptions } from "@/hooks/use-system";
import { serverFetch } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { SystemStatusPanel } from "@/components/system/system-status";

/**
 * Worker health — super admin only, like settings and for the same reason:
 * the people who can change how the jobs run are the ones who need to see
 * what they did.
 */
export default async function SystemPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(systemStatusOptions(serverFetch)).catch(() => undefined);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="System"
        description="What the background jobs have been doing — when each last ran, how long it took, and what it said if it failed."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SystemStatusPanel />
      </HydrationBoundary>
    </div>
  );
}
