import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { SubmissionsBrowser } from "@/components/submissions/submissions-browser";

/**
 * Every submission across all campaigns - the review queue, as opposed to the
 * per-campaign view on a campaign's own page.
 *
 * Not SSR-prefetched: the table resolves creator names client-side from ids
 * the API doesn't embed, so the first paint would be half-filled either way.
 */
export default function SubmissionsPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Submissions"
        description="Posts entered into campaigns. Filter to pending to work the review queue."
      />
      <Suspense fallback={null}>
        <SubmissionsBrowser />
      </Suspense>
    </div>
  );
}
