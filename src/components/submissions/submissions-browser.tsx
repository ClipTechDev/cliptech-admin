"use client";

import { useUrlParam } from "@/hooks/use-url-param";
import { SubmissionSheet } from "@/components/submissions/submission-sheet";
import { SubmissionsTable } from "@/components/submissions/submissions-table";

/**
 * The standalone submissions screen: the same table and sheet the campaign
 * page uses, with the open post kept in the URL so a review can be handed to
 * somebody else as a link.
 */
export function SubmissionsBrowser() {
  const [openSubmission, setOpenSubmission] = useUrlParam("submission");

  return (
    <>
      <SubmissionsTable onSelect={setOpenSubmission} />
      <SubmissionSheet
        submissionId={openSubmission}
        onOpenChange={(open) => !open && setOpenSubmission(null)}
      />
    </>
  );
}
