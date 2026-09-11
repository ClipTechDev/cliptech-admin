import type { PageMeta } from "@/schemas/common";

/**
 * Mirrors payout.TransactionResponse
 * (internal/features/payout/dto.go). A creator's ledger is append-only:
 * `balance_after` is the running balance at the moment the row was written.
 */

export const TRANSACTION_TYPES = ["earning", "withdrawal"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type TransactionsListResponse = {
  success: boolean;
  transactions: Transaction[];
  pagination: PageMeta;
};
