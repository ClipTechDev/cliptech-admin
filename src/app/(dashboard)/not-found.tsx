import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/shared/error-panel";

/**
 * What a detail page renders when the id in the URL names nothing.
 *
 * The detail pages call `notFound()` when their prefetch comes back 404, so a
 * mistyped or stale id lands here - inside the shell, with the sidebar still
 * there to leave by - rather than on Next's stock 404 outside the app.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="w-full max-w-md">
        <ErrorPanel
          title="Not found"
          description="There's no record with that id. It may have been deleted, or the link may be wrong."
        >
          <Button variant="outline" size="sm" render={<Link href="/" />}>
            Back to dashboard
          </Button>
        </ErrorPanel>
      </div>
    </div>
  );
}
