import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { USER_FILTER_KEYS, usersListOptions } from "@/hooks/use-users";
import { serverFetch } from "@/lib/api-server";
import { parseListParams } from "@/lib/list-params";
import { getQueryClient } from "@/lib/query-client";
import { PageHeader } from "@/components/shared/page-header";
import { UsersTable } from "@/components/users/users-table";

/**
 * The listing, rendered on the server for whatever the URL asks for.
 *
 * The filters are parsed here and again in the client hook, from the same
 * URL - so both derive the same query key and the prefetched page is the one
 * TanStack Query hydrates, rather than a default view that gets replaced a
 * moment later.
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseListParams(await searchParams, USER_FILTER_KEYS);

  const queryClient = getQueryClient();
  // serverFetch, not the hook's default: this runs before there's a browser
  // to carry the session cookie, so it forwards the one on this request.
  // A failure here (an expired session, the API down) is swallowed so the
  // page still renders - the client retry surfaces the error properly.
  await queryClient
    .prefetchQuery(usersListOptions(params, serverFetch))
    .catch(() => undefined);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Users"
        description="Creators on ClipTech. Search, filter and open an account to edit it."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersTable />
      </HydrationBoundary>
    </div>
  );
}
