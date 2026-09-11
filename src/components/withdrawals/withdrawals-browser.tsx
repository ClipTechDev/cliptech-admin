"use client";

import { useUrlParam } from "@/hooks/use-url-param";
import { WithdrawalSheet } from "@/components/withdrawals/withdrawal-sheet";
import { WithdrawalsTable } from "@/components/withdrawals/withdrawals-table";

/**
 * The payout queue and the request currently open on top of it.
 *
 * The open request lives in the URL, so a payout that needs a second opinion
 * can be sent to a colleague as a link - and so the back button closes the
 * sheet instead of leaving the page.
 */
export function WithdrawalsBrowser() {
  const [openWithdrawal, setOpenWithdrawal] = useUrlParam("withdrawal");

  return (
    <>
      <WithdrawalsTable onSelect={setOpenWithdrawal} />
      <WithdrawalSheet
        withdrawalId={openWithdrawal}
        onOpenChange={(open) => !open && setOpenWithdrawal(null)}
      />
    </>
  );
}
