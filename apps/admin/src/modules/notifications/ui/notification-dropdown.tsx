import type { NotificationItem } from "@otbt/types";
import { Button } from "@otbt/ui";
import { Link } from "react-router";

import {
  useUpdateNotificationStatus,
  useNotifications,
} from "../notifications.hooks";

function formatNotificationTime(notification: NotificationItem) {
  const date = new Date(notification.createdAt);

  if (Number.isNaN(date.valueOf())) {
    return "";
  }

  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function NotificationDropdown() {
  const { data, isLoading } = useNotifications("all");
  const updateStatus = useUpdateNotificationStatus();
  const notifications = data?.notifications.slice(0, 3) ?? [];

  return (
    <div className="absolute right-0 z-50 mt-2 w-[22rem] rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Notifications</p>
        <p className="text-xs text-muted-foreground">
          {data?.summary.unreadCount ?? 0} unread
        </p>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            Loading notifications
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              className="flex w-full gap-3 rounded-md border bg-muted/30 p-3 text-left transition-colors hover:bg-muted/60"
              key={notification.id}
              onClick={() =>
                notification.status === "unread"
                  ? updateStatus.mutate({
                      notificationId: notification.id,
                      status: "read",
                    })
                  : undefined
              }
              type="button"
            >
              <span
                className={
                  notification.status === "unread"
                    ? "mt-1.5 size-2 rounded-full bg-destructive"
                    : "mt-1.5 size-2 rounded-full bg-muted-foreground/20"
                }
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {notification.title}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {notification.message}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                {formatNotificationTime(notification)}
              </span>
            </button>
          ))
        )}
      </div>

      <Button asChild className="mt-4 w-full">
        <Link to="/notifications">View all notifications</Link>
      </Button>
    </div>
  );
}
