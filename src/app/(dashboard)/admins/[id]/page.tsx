import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { adminDetailOptions } from "@/hooks/use-admins";
import { ApiError } from "@/lib/api-client";
import { serverFetch } from "@/lib/api-server";
import { getQueryClient } from "@/lib/query-client";
import { AdminDetail } from "@/components/admins/admin-detail";

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const queryClient = getQueryClient();
  // fetchQuery rather than prefetchQuery: prefetch swallows the failure, and a
  // 404 here means the id in the URL names nothing, which should be the app's
  // own not-found page inside the shell - not a detail screen rendering an
  // error panel where the record would have been. Every other failure is left
  // to the client query, whose 401/403 wording is the useful one.
  try {
    await queryClient.fetchQuery(adminDetailOptions(id, serverFetch));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminDetail adminId={id} />
    </HydrationBoundary>
  );
}
