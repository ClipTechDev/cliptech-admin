"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Confirmation gate for anything destructive.
 *
 * Controlled only - it is nearly always opened from a dropdown item, and a
 * trigger nested inside a menu races the menu's own unmount. The caller keeps
 * the open state, renders this as a sibling, and the two never fight.
 *
 * `onConfirm` may return a promise; the dialog stays open and disabled until
 * it settles, so a slow request can't be double-submitted, and it closes only
 * on success - leaving a failure visible behind the toast that explains it.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<unknown>;
}) {
  const [isPending, setIsPending] = React.useState(false);

  async function handleConfirm() {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Reporting is the caller's job - it knows what failed and has the
      // toast. Here we only need to stop pretending the action is in flight.
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={isPending}
            // AlertDialogAction is a plain Button, not a Close, so the
            // dialog is dismissed in handleConfirm once the action settles.
            onClick={() => void handleConfirm()}
          >
            {isPending ? "Working..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
