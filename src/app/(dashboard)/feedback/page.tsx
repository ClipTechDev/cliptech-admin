import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { FeedbackBrowser } from "@/components/feedback/feedback-browser";

/**
 * The support inbox: what creators have reported, newest first.
 *
 * Read-only, because the API is - feedback is what somebody said, and there
 * is nothing here for an admin to change about it.
 */
export default function FeedbackPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Feedback"
        description="Reports creators have sent from the app, with any screenshot they attached."
      />
      <Suspense fallback={null}>
        <FeedbackBrowser />
      </Suspense>
    </div>
  );
}
