import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorPanel } from "@/components/shared/error-panel";

/**
 * A URL that matches no route at all.
 *
 * This one renders outside the dashboard shell - an unmatched path belongs to
 * no section, so there is no sidebar to keep - which is why it offers the way
 * back explicitly.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <ErrorPanel
          title="Page not found"
          description="That address isn't part of the admin panel."
        >
          <Button variant="outline" size="sm" render={<Link href="/" />}>
            Back to dashboard
          </Button>
        </ErrorPanel>
      </div>
    </div>
  );
}
