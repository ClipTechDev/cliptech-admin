"use client";

import { useUrlParam } from "@/hooks/use-url-param";
import { FeedbackSheet } from "@/components/feedback/feedback-sheet";
import { FeedbackTable } from "@/components/feedback/feedback-table";

/** The inbox with the open report on top of it, addressable as `?feedback=`. */
export function FeedbackBrowser() {
  const [openFeedback, setOpenFeedback] = useUrlParam("feedback");

  return (
    <>
      <FeedbackTable onSelect={setOpenFeedback} />
      <FeedbackSheet
        feedbackId={openFeedback}
        onOpenChange={(open) => !open && setOpenFeedback(null)}
      />
    </>
  );
}
