import type { NotificationFilter, NotificationItem } from "@otbt/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@otbt/ui";
import { MoreHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router";

import {
  useMarkAllNotificationsRead,
  useNotifications,
  useUpdateNotificationStatus,
} from "../notifications.hooks";

const filters: Array<{ label: string; value: NotificationFilter }> = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Orders", value: "order" },
  { label: "System", value: "system" },
];

function formatNotificationDate(notification: NotificationItem) {
  const date = new Date(notification.createdAt);

  if (Number.isNaN(date.valueOf())) {
    return "";
  }

  return date.toLocaleDateString();
}

function resolveRelatedOrderPath(notification: NotificationItem) {
  return notification.resource === "orders" && notification.resourceId
    ? `/orders/${notification.resourceId}`
    : null;
}

export function NotificationList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get("filter") ?? "all") as NotificationFilter;
  const { data } = useNotifications(filter);
  const markAllRead = useMarkAllNotificationsRead();
  const updateStatus = useUpdateNotificationStatus();

  const notifications = data?.notifications ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-56 rounded-md border bg-card p-4">
          <p className="text-2xl font-semibold">{data?.summary.unreadCount ?? 0}</p>
          <p className="text-sm text-muted-foreground">Unread notifications</p>
        </div>
        <div className="min-w-56 rounded-md border bg-card p-4">
          <p className="text-2xl font-semibold">
            {data?.summary.recentOrderCount ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">Recent order events</p>
        </div>
        <Button
          className="ml-auto"
          disabled={markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </Button>
      </div>

      <div className="flex rounded-md border bg-muted/30 p-1">
        {filters.map((candidate) => (
          <Button
            key={candidate.value}
            onClick={() => setSearchParams({ filter: candidate.value })}
            type="button"
            variant={filter === candidate.value ? "secondary" : "ghost"}
          >
            {candidate.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              No notifications found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              New order activity will appear here.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-auto">
            <table className="w-full min-w-[900px] table-fixed caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 w-[12%] px-4 text-left align-middle font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="h-12 w-[58%] px-4 text-left align-middle font-medium text-muted-foreground">
                    Notification
                  </th>
                  <th className="h-12 w-[18%] px-4 text-left align-middle font-medium text-muted-foreground">
                    Time
                  </th>
                  <th className="h-12 w-[12%] px-4 text-right align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {notifications.map((notification) => {
                  const relatedOrderPath = resolveRelatedOrderPath(notification);

                  return (
                    <tr
                      className={
                        notification.status === "unread"
                          ? "border-b bg-destructive/5 transition-colors hover:bg-destructive/10"
                          : "border-b transition-colors hover:bg-muted/50"
                      }
                      key={notification.id}
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              notification.status === "unread"
                                ? "size-2 rounded-full bg-destructive"
                                : "size-2 rounded-full bg-muted-foreground/20"
                            }
                          />
                          <span className="capitalize text-muted-foreground">
                            {notification.type}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <p className="font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {notification.message}
                        </p>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {formatNotificationDate(notification)}
                      </td>
                      <td className="p-4 text-right align-middle">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" type="button" variant="outline">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">
                                Open notification actions
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {relatedOrderPath ? (
                              <DropdownMenuItem asChild>
                                <Link to={relatedOrderPath}>View order</Link>
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                              disabled={notification.status === "read"}
                              onSelect={() =>
                                updateStatus.mutate({
                                  notificationId: notification.id,
                                  status: "read",
                                })
                              }
                            >
                              Mark as read
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                updateStatus.mutate({
                                  notificationId: notification.id,
                                  status: "dismissed",
                                })
                              }
                            >
                              Dismiss notification
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
