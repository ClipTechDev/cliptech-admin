import { Suspense } from "react";
import Link from "next/link";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { WithdrawalsBrowser } from "@/components/withdrawals/withdrawals-browser";

/**
 * The payout queue: every creator withdrawal and the state it is in.
 *
 * Not SSR-prefetched. The listing is filtered from the URL like the others,
 * but a payout screen is worked over minutes rather than glanced at, so the
 * first paint being a moment behind costs nothing - and the sheet the page
 * opens needs the client router anyway.
 */
export default function WithdrawalsPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Withdrawals"
        description="Creators asking to be paid. Open a request to see what to do next."
        actions={
          <Button variant="outline" render={<Link href="/exports" />}>
            <Download />
            Export CSV
          </Button>
        }
      />
      <Suspense fallback={null}>
        <WithdrawalsBrowser />
      </Suspense>
    </div>
  );
}
