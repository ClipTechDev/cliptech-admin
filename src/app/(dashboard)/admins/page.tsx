import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { ADMIN_FILTER_KEYS, adminsListOptions } from "@/hooks/use-admins";
import { serverFetch } from "@/lib/api-server";
import { parseListParams } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { AdminsTable } from "@/components/admins/admins-table";

export default async function AdminsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, ADMIN_FILTER_KEYS);

  const queryClient = getQueryClient();
  await queryClient
    .prefetchQuery(adminsListOptions(params, serverFetch))
    .catch(() => undefined);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Admins"
        description="Staff accounts and what each one is allowed to do."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminsTable />
      </HydrationBoundary>
    </div>
  );
}
