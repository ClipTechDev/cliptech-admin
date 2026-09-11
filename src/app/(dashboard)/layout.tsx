import { cookies } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { adminMeOptions } from "@/hooks/use-admin";
import { serverFetch } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  const queryClient = getQueryClient();
  // Prefetched once for the whole shell so the sidebar renders the real admin
  // on first paint rather than flashing a placeholder. A failure is swallowed:
  // the client query re-runs and its 401 is what routes them to sign in.
  await queryClient.prefetchQuery(adminMeOptions(serverFetch)).catch(() => undefined);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        {/* min-w-0 on both: a flex child defaults to min-width:auto, so one
            wide table would stretch the main column past the viewport and
            scroll the whole page sideways instead of scrolling itself. */}
        <SidebarInset className="min-w-0">
          <SiteHeader />
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
