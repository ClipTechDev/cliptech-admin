import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { adminDashboardOptions } from "@/hooks/use-dashboard";
import { serverFetch } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DashboardRefresh } from "@/components/dashboard/dashboard-refresh";

/**
 * The landing screen, prefetched so the figures are in the first paint.
 *
 * GET /v1/admin/dashboard sits behind the admin cookie but no particular
 * role, so this is the one page every admin can see whatever they are granted.
 */
export default async function DashboardPage() {
  const queryClient = getQueryClient();
  await queryClient
    .prefetchQuery(adminDashboardOptions(serverFetch))
    .catch(() => undefined);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PageHeader
          title="Dashboard"
          description="Where ClipTech stands right now — the queues waiting on someone, and the money behind them."
          actions={<DashboardRefresh />}
        />
        <AdminDashboard />
      </HydrationBoundary>
    </div>
  );
}
