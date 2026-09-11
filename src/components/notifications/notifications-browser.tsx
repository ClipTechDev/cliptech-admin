"use client";

import { useUrlParam } from "@/hooks/use-url-param";
import { NotificationSheet } from "@/components/notifications/notification-sheet";
import { NotificationsTable } from "@/components/notifications/notifications-table";

/**
 * The outbox with the open row on top of it, addressable as `?notification=`,
 * so a stuck delivery can be sent to whoever owns the channel as a link.
 */
export function NotificationsBrowser() {
  const [openNotification, setOpenNotification] = useUrlParam("notification");

  return (
    <>
      <NotificationsTable onSelect={setOpenNotification} />
      <NotificationSheet
        notificationId={openNotification}
        onOpenChange={(open) => !open && setOpenNotification(null)}
      />
    </>
  );
}
