import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { socialHealthOptions } from "@/hooks/use-social-health";
import { serverFetch } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { SocialHealthPanel } from "@/components/social/social-health";

/**
 * Platform integrations — super admin only, like system status and for the
 * same reason: the people who run the OAuth apps are the ones who need to see
 * whether they are set up and whether creators' connections are holding.
 */
export default async function SocialPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(socialHealthOptions(serverFetch)).catch(() => undefined);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Integrations"
        description="Each social platform's OAuth health — whether its app is configured, and how many creator connections are failing or about to expire."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <SocialHealthPanel />
      </HydrationBoundary>
    </div>
  );
}
