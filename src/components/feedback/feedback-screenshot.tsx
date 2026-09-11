"use client";

import * as React from "react";
import { ExternalLink, ImageOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The screenshot a creator attached, if it still loads.
 *
 * Attachments live in whatever storage bucket the deployment uses, and that
 * URL can outlive the file - a rotated bucket, an expired signature, a purge.
 * Left to the browser that shows a broken-image glyph and nothing else, which
 * reads as though the admin screen is broken rather than the file being gone.
 * So a failure is caught and named, with the link kept: the URL is still
 * worth having when someone goes looking for the object by hand.
 *
 * A plain <img> rather than next/image, because the bucket host is not one
 * the image optimiser is configured for.
 */
export function FeedbackScreenshot({ url }: { url: string }) {
  const [state, setState] = React.useState<"loading" | "loaded" | "failed">("loading");

  return (
    <div className="min-w-0 space-y-2">
      {state === "failed" ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <ImageOff className="size-5" />
          <p className="text-sm">This screenshot could not be loaded.</p>
          <p className="text-xs">
            The report is intact — only the attached file is unreachable.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Held at a plausible height while it loads, so the sheet does not
              jump when a large screenshot lands. */}
          {state === "loading" && <Skeleton className="h-64 w-full rounded-lg" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Screenshot attached to this report"
            onLoad={() => setState("loaded")}
            onError={() => setState("failed")}
            className={
              state === "loading"
                ? "absolute inset-0 opacity-0"
                : "max-h-96 w-full rounded-lg border object-contain"
            }
          />
        </div>
      )}

      <Button
        size="sm"
        variant="outline"
        render={<a href={url} target="_blank" rel="noopener noreferrer" />}
      >
        <ExternalLink />
        {state === "failed" ? "Try opening directly" : "Open full size"}
      </Button>
    </div>
  );
}
